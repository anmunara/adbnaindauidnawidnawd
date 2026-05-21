import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';
import crypto from 'crypto';

export async function POST(request) {
    try {
        // Content-Type from Duitku is usually application/x-www-form-urlencoded
        const text = await request.text();
        const params = new URLSearchParams(text);

        // Duitku sends these parameters
        const merchantCode = params.get('merchantCode');
        const amount = params.get('amount');
        const merchantOrderId = params.get('merchantOrderId');
        const signature = params.get('signature');
        const resultCode = params.get('resultCode'); // '00' = Success, '01' = Failed
        const reference = params.get('reference');

        console.log('Duitku Callback Received:', Object.fromEntries(params));

        if (!merchantCode || !amount || !merchantOrderId || !signature) {
            return NextResponse.json({ message: 'Invalid Parameters' }, { status: 400 });
        }

        // Verify Signature
        const apiKey = process.env.DUITKU_API_KEY;
        const calcString = merchantCode + amount + merchantOrderId + apiKey;
        const calcSignature = crypto.createHash('md5').update(calcString).digest('hex');

        if (signature !== calcSignature) {
            console.error('Invalid Signature. Expected:', calcSignature, 'Got:', signature);
            return NextResponse.json({ message: 'Invalid Signature' }, { status: 400 });
        }

        // Find order - check BOTH collections (website 'orders' + Discord 'transactions')
        let orderRef = adminDb.collection('orders').doc(merchantOrderId);
        let orderDoc = await orderRef.get();

        if (!orderDoc.exists) {
            // Try transactions collection (Discord bot)
            orderRef = adminDb.collection('transactions').doc(merchantOrderId);
            orderDoc = await orderRef.get();
        }

        if (!orderDoc.exists) {
            console.error('Order not found in any collection:', merchantOrderId);
            return NextResponse.json({ message: 'Order Not Found' }, { status: 404 });
        }

        const newStatus = resultCode === '00' ? 'SUCCESS' : 'FAILED';

        await orderRef.update({
            status: newStatus,
            duitkuReference: reference,
            paidAt: new Date().toISOString(),
            lastCallback: new Date().toISOString()
        });

        console.log(`Order ${merchantOrderId} updated to ${newStatus}`);

        // Return string "OK" as required by Duitku
        return new NextResponse('OK', { status: 200 });

    } catch (error) {
        console.error('Callback Error:', error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}
