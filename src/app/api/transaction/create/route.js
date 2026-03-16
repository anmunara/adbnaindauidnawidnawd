import { NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebaseAdmin';
import crypto from 'crypto';

export async function POST(request) {
    try {
        const { slug, userId, itemId, itemName, price, paymentMethod } = await request.json();

        // 1. Basic Validation - itemId can be typeId or itemId
        if (!userId || !itemId || !price || !paymentMethod) {
            console.error('[Transaction Create] Missing required params:', { userId, itemId, price, paymentMethod });
            return NextResponse.json({ message: 'Data tidak lengkap' }, { status: 400 });
        }

        // 2. Check Stock BEFORE creating payment
        const codesSnapshot = await adminDb.collection('redeem_codes')
            .where('typeId', '==', itemId)
            .where('isUsed', '==', false)
            .limit(1)
            .get();

        if (codesSnapshot.empty) {
            console.error('[Transaction Create] No stock available for itemId:', itemId);
            return NextResponse.json({ message: 'Stok habis! Silakan hubungi admin.' }, { status: 400 });
        }

        console.log('[Transaction Create] Stock available for itemId:', itemId);

        // 3. Create Order ID
        const orderId = `TRX-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

        // 4. Prepare Duitku Parameters for Direct QR Generation
        const merchantCode = process.env.DUITKU_MERCHANT_CODE;
        const apiKey = process.env.DUITKU_API_KEY;
        const paymentAmount = price;
        const productDetails = `Top Up ${itemName} (${userId})`;
        const email = 'customer@example.com';
        const phoneNumber = '08123456789';
        const callbackUrl = 'https://tokoroblox.id/api/payment/duitku/callback';
        const returnUrl = `https://tokoroblox.id/order/${orderId}`;

        // Signature for v2/inquiry: merchantCode + merchantOrderId + paymentAmount + apiKey
        const signatureString = merchantCode + orderId + paymentAmount + apiKey;
        const signature = crypto.createHash('md5').update(signatureString).digest('hex');

        // 4. Call Duitku API v2/inquiry - Direct QR Generation (No Redirect)
        const apiUrl = 'https://passport.duitku.com/webapi/api/merchant/v2/inquiry';

        const payload = {
            merchantCode: merchantCode,
            merchantOrderId: orderId,
            paymentAmount: paymentAmount,
            paymentMethod: paymentMethod, // QRIS code
            productDetails: productDetails,
            email: email,
            phoneNumber: phoneNumber,
            customerVaName: userId,
            itemDetails: [
                {
                    name: itemName,
                    price: paymentAmount,
                    quantity: 1
                }
            ],
            callbackUrl: callbackUrl,
            returnUrl: returnUrl,
            signature: signature,
            expiryPeriod: 10 // 10 minutes untuk QRIS
        };

        console.log('[Transaction Create] Calling Duitku v2/inquiry for QR generation...');
        console.log('[Transaction Create] Payload:', JSON.stringify(payload));

        const duitkuRes = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const responseText = await duitkuRes.text();
        console.log('[Transaction Create] Raw Response Status:', duitkuRes.status);
        console.log('[Transaction Create] Raw Response:', responseText);
        
        let duitkuData;
        
        try {
            duitkuData = JSON.parse(responseText);
        } catch (e) {
            console.error('[Transaction Create] Invalid JSON Response:', responseText);
            return NextResponse.json({
                message: 'Invalid response from payment gateway',
                detail: responseText,
                statusCode: duitkuRes.status
            }, { status: 500 });
        }

        console.log('[Transaction Create] Parsed Duitku Response:', duitkuData);

        // Check if request was successful
        if (duitkuData.statusCode !== '00') {
            console.error('[Transaction Create] Payment gateway error:', duitkuData.statusMessage);
            return NextResponse.json({
                message: 'Gagal membuat pembayaran: ' + (duitkuData.statusMessage || 'Unknown error'),
                detail: duitkuData,
                statusCode: duitkuData.statusCode
            }, { status: 500 });
        }

        // Log QR String untuk debug
        console.log('[Transaction Create] QR String present:', !!duitkuData.qrString);
        console.log('[Transaction Create] QR String content:', duitkuData.qrString?.substring(0, 50) + '...');

        // Verify QR String is present for QRIS/SQ
        if ((paymentMethod === 'QRIS' || paymentMethod === 'SQ') && !duitkuData.qrString) {
            console.error('[Transaction Create] No QR String returned for', paymentMethod, '- Full response:', duitkuData);
            return NextResponse.json({
                message: 'Gagal generate QR Code untuk ' + paymentMethod + ' - Duitku tidak return qrString',
                detail: duitkuData
            }, { status: 500 });
        }

        // 5. Save Order to Firestore with QR String
        const orderData = {
            orderId,
            userId,
            itemId,
            itemName,
            price,
            paymentMethod,
            status: 'PENDING',
            qrString: duitkuData.qrString || null,
            vaNumber: duitkuData.vaNumber || null,
            paymentUrl: duitkuData.paymentUrl || null,
            reference: duitkuData.reference,
            expiryTime: duitkuData.expiryTime || null,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        await adminDb.collection('orders').doc(orderId).set(orderData);

        console.log('[Transaction Create] Order saved with QR String:', !!duitkuData.qrString);

        return NextResponse.json({
            success: true,
            orderId: orderId,
            qrString: duitkuData.qrString,
            vaNumber: duitkuData.vaNumber || null,
            paymentMethod: paymentMethod,
            expiryTime: duitkuData.expiryTime || null
        });

    } catch (error) {
        console.error('Transaction Error:', error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}
