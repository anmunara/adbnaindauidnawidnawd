import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';
import * as admin from 'firebase-admin';
import crypto from 'crypto';
import { maskCode, maskEmail } from '@/lib/security';

if (!admin.apps.length) {
    try {
        admin.initializeApp({
            credential: admin.credential.cert({
                projectId: process.env.FIREBASE_PROJECT_ID,
                clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
                privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
            }),
        });
    } catch (error) {
        console.error('Firebase admin init error:', error);
    }
}

const db = adminDb || admin.firestore();

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
                    failureReason: 'amount_mismatch',
                    updatedAt: new Date().toISOString(),
                });
                console.error(`[Callback] Amount mismatch order=${merchantOrderId} paid=${paidAmount} expected=${orderPrice}`);
                return NextResponse.json({ message: 'Amount mismatch' }, { status: 400 });
            }

            const itemId = orderData.itemId;
            const source = orderSource === 'orders' ? 'Website' : 'Discord';
            const userName = orderData.username || orderData.userId || 'Unknown';

            // Atomic code allocation via Firestore transaction
            // Prevents race condition where 2 callbacks pick the same unused code
            let assignedCode = 'STOCK_EMPTY_PLEASE_CONTACT_ADMIN';
            try {
                assignedCode = await db.runTransaction(async (tx) => {
                    const candidateSnap = await db.collection('redeem_codes')
                        .where('typeId', '==', itemId)
                        .where('isUsed', '==', false)
                        .limit(5)
                        .get();

                    for (const cand of candidateSnap.docs) {
                        const fresh = await tx.get(cand.ref);
                        if (fresh.exists && fresh.data().isUsed === false) {
                            const saleTimestamp = new Date().toISOString();
                            const note = `Terjual via ${source} | User: ${userName} | Ref: ${reference} | Order: ${merchantOrderId} | Waktu: ${saleTimestamp}`;
                            tx.update(cand.ref, {
                                isUsed: true,
                                soldTo: orderData.userId || 'unknown',
                                transactionId: merchantOrderId,
                                note,
                                soldAt: admin.firestore.FieldValue.serverTimestamp(),
                                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                            });
                            return fresh.data().code;
                        }
                    }
                    return 'STOCK_EMPTY_PLEASE_CONTACT_ADMIN';
                });
            } catch (txErr) {
                console.error('[Callback] Code allocation tx failed:', txErr);
            }

            await orderRef.update({
                status: 'SUCCESS',
                duitkuReference: reference,
                redeemCode: assignedCode,
                paidAt: admin.firestore.FieldValue.serverTimestamp(),
                updatedAt: new Date().toISOString(),
            });

            console.log(`[Callback] Order ${merchantOrderId} SUCCESS (${source}) - Code: ${maskCode(assignedCode)} - User: ${maskEmail(orderData.userEmail || '')}`);
            return NextResponse.json({ message: 'Success' }, { status: 200 });
        } else {
            await orderRef.update({
                status: 'FAILED',
                resultCode,
                failedAt: admin.firestore.FieldValue.serverTimestamp(),
                updatedAt: new Date().toISOString(),
            });

            console.log(`[Callback] Order ${merchantOrderId} FAILED - resultCode: ${resultCode}`);
            return NextResponse.json({ message: 'Payment Failed' }, { status: 200 });
        }
    } catch (error) {
        console.error('Duitku Callback Error:', error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}
