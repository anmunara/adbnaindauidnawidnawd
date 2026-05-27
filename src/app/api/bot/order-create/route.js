import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';
import crypto from 'crypto';

// Bot-internal endpoint — only accessible from localhost
function assertLocalhost(req) {
    const host = req.headers.get('host') || '';
    if (!host.startsWith('localhost') && !host.startsWith('127.0.0.1')) {
        return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
    }
    return null;
}

export async function POST(req) {
    const localErr = assertLocalhost(req);
    if (localErr) return localErr;

    try {
        const body = await req.json();
        const { userId, username, itemId } = body;

        if (!userId || !itemId) {
            return NextResponse.json({ success: false, message: 'Missing userId or itemId' }, { status: 400 });
        }

        // 1. Fetch product details
        const productDoc = await adminDb.collection('game_types').doc(itemId).get();
        if (!productDoc.exists) {
            return NextResponse.json({ success: false, message: 'Product not found' }, { status: 404 });
        }
        const productData = productDoc.data();

        // 2. Check stock
        const stockCheck = await adminDb.collection('redeem_codes')
            .where('typeId', '==', itemId)
            .where('isUsed', '==', false)
            .limit(1)
            .get();

        if (stockCheck.empty) {
            return NextResponse.json({ success: false, message: 'Out of stock' }, { status: 400 });
        }

        // 3. Calculate price
        const price = productData.sellingPrice;
        const paymentAmount = Math.ceil(price * 1.007); // +0.7% fee
        const merchantOrderId = `CP-${Date.now()}-${String(userId).slice(-4)}`;

        // 4. Create transaction in Firestore
        await adminDb.collection('transactions').doc(merchantOrderId).set({
            userId,
            username: username || 'Discord User',
            itemId,
            itemName: productData.name,
            price: paymentAmount,
            merchantOrderId,
            status: 'PENDING',
            createdAt: new Date(),
            delivered: null,
            paymentUrl: '',
        });

        // 5. Generate Duitku payment
        const merchantCode = process.env.DUITKU_MERCHANT_CODE;
        const apiKey = process.env.DUITKU_API_KEY;

        if (!merchantCode || !apiKey) {
            return NextResponse.json({ success: false, message: 'Payment not configured' }, { status: 500 });
        }

        const signature = crypto.createHash('md5')
            .update(`${merchantCode}${merchantOrderId}${paymentAmount}${apiKey}`)
            .digest('hex');

        const payload = {
            merchantCode,
            merchantOrderId,
            paymentAmount,
            paymentMethod: 'SQ',
            productDetails: productData.name,
            email: 'customer@discord.com',
            phoneNumber: '08123456789',
            customerVaName: String(userId).substring(0, 20),
            itemDetails: [{ name: productData.name, price: paymentAmount, quantity: 1 }],
            callbackUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'https://tokoroblox.id'}/api/payment/duitku/callback`,
            returnUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'https://tokoroblox.id'}`,
            signature,
            expiryPeriod: 10,
        };

        const duitkuRes = await fetch('https://passport.duitku.com/webapi/api/merchant/v2/inquiry', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });

        const duitkuData = await duitkuRes.json();

        if (duitkuData.statusCode !== '00') {
            return NextResponse.json({
                success: false,
                message: `Payment failed: ${duitkuData.statusMessage || 'Unknown'}`,
            }, { status: 500 });
        }

        // 6. Update transaction with payment data
        await adminDb.collection('transactions').doc(merchantOrderId).update({
            qrString: duitkuData.qrString || '',
            vaNumber: duitkuData.vaNumber || '',
            reference: duitkuData.reference || '',
            expiryTime: duitkuData.expiryTime || '',
            paymentMethod: 'SQ',
        });

        return NextResponse.json({
            success: true,
            merchantOrderId,
            itemName: productData.name,
            paymentAmount,
            qrString: duitkuData.qrString || null,
            reference: duitkuData.reference || '',
            expiryTime: duitkuData.expiryTime || null,
        });
    } catch (error) {
        console.error('[Bot Order Create] Error:', error);
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}
