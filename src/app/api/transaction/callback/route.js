import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';
import crypto from 'crypto';

export async function POST(request) {
    try {
        const text = await request.text();
        const params = new URLSearchParams(text);

        const merchantCode = params.get('merchantCode');
        const amount = params.get('amount');
        const merchantOrderId = params.get('merchantOrderId');
        const signature = params.get('signature');
        const resultCode = params.get('resultCode');
        const reference = params.get('reference');

        if (!merchantCode || !amount || !merchantOrderId || !signature) {
            return NextResponse.json({ message: 'Invalid Parameters' }, { status: 400 });
        }

        const apiKey = process.env.DUITKU_API_KEY;
        const calcString = merchantCode + amount + merchantOrderId + apiKey;
        const calcSignature = crypto.createHash('md5').update(calcString).digest('hex');

        if (signature !== calcSignature) {
            console.error('[Tx Callback] Invalid signature for order:', merchantOrderId);
            return NextResponse.json({ message: 'Invalid Signature' }, { status: 400 });
        }

        let orderRef = adminDb.collection('orders').doc(merchantOrderId);
        let orderDoc = await orderRef.get();

        if (!orderDoc.exists) {
            orderRef = adminDb.collection('transactions').doc(merchantOrderId);
            orderDoc = await orderRef.get();
        }

        if (!orderDoc.exists) {
            console.error('[Tx Callback] Order not found:', merchantOrderId);
            return NextResponse.json({ message: 'Order Not Found' }, { status: 404 });
        }

        const orderData = orderDoc.data();
        const newStatus = resultCode === '00' ? 'SUCCESS' : 'FAILED';

        if (newStatus === 'SUCCESS') {
            // Defense-in-depth: refuse SUCCESS if paid amount is less than the
            // order's recorded price (prevents claim-via-partial-payment).
            const paidAmount = Number(amount);
            const orderPrice = Number(orderData.price);
            if (!Number.isFinite(paidAmount) || !Number.isFinite(orderPrice) || paidAmount < orderPrice) {
                await orderRef.update({
                    status: 'FAILED',
                    failureReason: 'amount_mismatch',
                    lastCallback: new Date().toISOString(),
                });
                console.error(`[Tx Callback] Amount mismatch order=${merchantOrderId} paid=${paidAmount} expected=${orderPrice}`);
                return new NextResponse('OK', { status: 200 });
            }
        }

        await orderRef.update({
            status: newStatus,
            duitkuReference: reference,
            paidAt: new Date().toISOString(),
            lastCallback: new Date().toISOString(),
        });

        return new NextResponse('OK', { status: 200 });
    } catch (error) {
        console.error('Callback Error:', error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}
