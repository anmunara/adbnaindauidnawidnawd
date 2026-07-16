import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import crypto from 'crypto';
import { maskCode, maskEmail } from '@/lib/security';
import { buySingle as buyAbahcodeVoucher } from '@/lib/abahcode';

export async function POST(req) {
    try {
        const contentType = req.headers.get('content-type') || '';
        let body;

        if (contentType.includes('application/x-www-form-urlencoded')) {
            const formData = await req.formData();
            body = Object.fromEntries(formData.entries());
        } else {
            body = await req.json();
        }

        const { merchantCode, amount, merchantOrderId, signature, resultCode, reference } = body;

        if (!merchantCode || !amount || !merchantOrderId || !signature) {
            return NextResponse.json({ message: 'Invalid Parameters' }, { status: 400 });
        }

        const apiKey = process.env.DUITKU_API_KEY;
        const calcSignature = crypto.createHash('md5')
            .update(`${merchantCode}${amount}${merchantOrderId}${apiKey}`)
            .digest('hex');

        if (calcSignature !== signature) {
            return NextResponse.json({ message: 'Invalid Signature' }, { status: 400 });
        }

        let orderRef = db.collection('orders').doc(merchantOrderId);
        let orderDoc = await orderRef.get();
        let orderSource = null;

        if (orderDoc.exists) {
            orderSource = 'orders';
        } else {
            orderRef = db.collection('transactions').doc(merchantOrderId);
            orderDoc = await orderRef.get();
            if (orderDoc.exists) orderSource = 'transactions';
        }

        if (!orderSource) {
            console.error('[Callback] Order not found:', merchantOrderId);
            return NextResponse.json({ message: 'Order not found' }, { status: 404 });
        }

        const orderData = orderDoc.data();

        if (resultCode === '00') {
            if (orderData.status === 'SUCCESS') {
                return NextResponse.json({ message: 'Already Paid' }, { status: 200 });
            }

            // Verify the paid amount matches the order's stored price.
            // Prevents an attacker who forges a callback (or finds an old signed
            // payload at a different amount) from claiming a code worth more.
            const paidAmount = Number(amount);
            const orderPrice = Number(orderData.price);
            if (!Number.isFinite(paidAmount) || !Number.isFinite(orderPrice) || paidAmount < orderPrice) {
                await orderRef.update({
                    status: 'FAILED',
                    failure_reason: 'amount_mismatch',
                    updated_at: new Date().toISOString(),
                });
                console.error(`[Callback] Amount mismatch order=${merchantOrderId} paid=${paidAmount} expected=${orderPrice}`);
                return NextResponse.json({ message: 'Amount mismatch' }, { status: 400 });
            }

            const itemId = orderData.item_id || orderData.itemId;
            const source = orderSource === 'orders' ? 'Website' : 'Discord';
            const userName = orderData.username || orderData.user_id || orderData.userId || 'Unknown';

            // Determine fulfilment source: 'local' (own redeem_codes stock) or
            // 'abahcode' (dropship — buy the voucher on-demand from the supplier).
            let productSource = 'local';
            let providerProductId = null;
            try {
                const prodDoc = await db.collection('game_types').doc(itemId).get();
                if (prodDoc.exists) {
                    const pd = prodDoc.data();
                    productSource = pd.source || 'local';
                    providerProductId = pd.provider_product_id || null;
                }
            } catch (e) {
                console.error('[Callback] Product lookup failed:', e.message);
            }

            let assignedCode = 'STOCK_EMPTY_PLEASE_CONTACT_ADMIN';
            let providerInvoice = null;

            if (productSource === 'abahcode') {
                // Dropship purchase deducts real balance, so claim the order
                // first (atomic status flip). A concurrent duplicate callback
                // loses the claim and must NOT buy a second voucher.
                let claimed = false;
                try {
                    claimed = await db.runTransaction(async (tx) => {
                        const fresh = await tx.get(orderRef);
                        const st = fresh.exists ? fresh.data().status : null;
                        if (st !== 'SUCCESS' && st !== 'PROCESSING') {
                            tx.update(orderRef, { status: 'PROCESSING', updated_at: new Date().toISOString() });
                            return true;
                        }
                        return false;
                    });
                } catch (claimErr) {
                    console.error('[Callback] Abahcode claim tx failed:', claimErr);
                }

                if (!claimed) {
                    return NextResponse.json({ message: 'Already processing' }, { status: 200 });
                }

                try {
                    const result = await buyAbahcodeVoucher(providerProductId);
                    if (result.code) {
                        assignedCode = result.code;
                        providerInvoice = result.invoiceNo;
                    }
                } catch (buyErr) {
                    console.error(`[Callback] Abahcode purchase failed order=${merchantOrderId}:`, buyErr.message);
                }
            } else {
                // Local: atomic code allocation via SQLite transaction.
                // Prevents race condition where 2 callbacks pick the same unused code.
                try {
                    assignedCode = await db.runTransaction(async (tx) => {
                        const candidateSnap = await db.collection('redeem_codes')
                            .where('type_id', '==', itemId)
                            .where('is_used', '==', false)
                            .limit(5)
                            .get();

                        for (const candDoc of candidateSnap.docs) {
                            const fresh = await tx.get(candDoc.ref);
                            if (fresh.exists && fresh.data().is_used === false) {
                                const saleTimestamp = new Date().toISOString();
                                const note = `Terjual via ${source} | User: ${userName} | Ref: ${reference} | Order: ${merchantOrderId} | Waktu: ${saleTimestamp}`;

                                tx.update(candDoc.ref, {
                                    is_used: true,
                                    sold_to: orderData.user_id || orderData.userId || 'unknown',
                                    transaction_id: merchantOrderId,
                                    note,
                                    sold_at: saleTimestamp,
                                    updated_at: saleTimestamp,
                                });
                                return fresh.data().code;
                            }
                        }
                        return 'STOCK_EMPTY_PLEASE_CONTACT_ADMIN';
                    });
                } catch (txErr) {
                    console.error('[Callback] Code allocation tx failed:', txErr);
                }
            }

            const stockOk = assignedCode && assignedCode !== 'STOCK_EMPTY_PLEASE_CONTACT_ADMIN';

            // Customer has paid. Only mark SUCCESS if a real code was actually
            // allocated/purchased; otherwise flag PAID_NO_STOCK so the order is
            // not closed as fulfilled and an admin can refund / restock + resend.
            await orderRef.update({
                status: stockOk ? 'SUCCESS' : 'PAID_NO_STOCK',
                duitku_reference: reference,
                redeem_code: stockOk ? assignedCode : null,
                provider_invoice: providerInvoice,
                paid_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            });

            if (!stockOk) {
                console.error(`[Callback] PAID BUT NO STOCK order=${merchantOrderId} item=${itemId} src=${productSource} — refund/restock needed`);
                return NextResponse.json({ message: 'Paid, awaiting stock' }, { status: 200 });
            }

            console.log(`[Callback] Order ${merchantOrderId} SUCCESS (${source}/${productSource}) - Code: ${maskCode(assignedCode)} - User: ${maskEmail(orderData.user_email || orderData.userEmail || '')}`);
            return NextResponse.json({ message: 'Success' }, { status: 200 });
        } else {
            await orderRef.update({
                status: 'FAILED',
                result_code: resultCode,
                failed_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            });

            console.log(`[Callback] Order ${merchantOrderId} FAILED - resultCode: ${resultCode}`);
            return NextResponse.json({ message: 'Payment Failed' }, { status: 200 });
        }
    } catch (error) {
        console.error('Duitku Callback Error:', error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}
