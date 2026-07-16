import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { assertBotSecret } from '@/lib/security';
import { getStock as getAbahcodeStock } from '@/lib/abahcode';
import crypto from 'crypto';

export async function POST(req) {
    const authErr = assertBotSecret(req);
    if (authErr) return authErr;

    try {
        const body = await req.json();
        const { userId, username, itemId } = body;

        if (!userId || !itemId) {
            return NextResponse.json({ success: false, message: 'Missing userId or itemId' }, { status: 400 });
        }

        // 1. Fetch product details
        const productDoc = await db.collection('game_types').doc(itemId).get();
        if (!productDoc.exists) {
            return NextResponse.json({ success: false, message: 'Product not found' }, { status: 404 });
        }
        const productData = productDoc.data();
        const source = productData.source || 'local';

        // 2. Check stock. Local products count unused codes; Abahcode dropship
        // queries live supplier stock and fails closed if unreachable.
        if (source === 'abahcode') {
            let providerStock = 0;
            try {
                providerStock = await getAbahcodeStock(productData.provider_product_id);
            } catch (e) {
                console.error('[Bot Order Create] Abahcode stock check failed:', e.message);
                return NextResponse.json({ success: false, message: 'Provider unavailable' }, { status: 503 });
            }
            if (providerStock < 1) {
                return NextResponse.json({ success: false, message: 'Out of stock' }, { status: 400 });
            }
        } else {
            const stockCheck = await db.collection('redeem_codes')
                .where('type_id', '==', itemId)
                .where('is_used', '==', false)
                .limit(1)
                .get();

            if (stockCheck.empty) {
                return NextResponse.json({ success: false, message: 'Out of stock' }, { status: 400 });
            }
        }

        // 3. Calculate price (server-side from product — never trust client)
        const price = Math.floor(Number(productData.selling_price) || 0);
        // Sanity guard: refuse to invoice an unconfigured / corrupt product
        // (mirrors transaction/create — prevents Rp0 or absurd invoices).
        if (price < 1000 || price > 10_000_000) {
            return NextResponse.json({ success: false, message: 'Produk belum dikonfigurasi' }, { status: 400 });
        }
        const paymentAmount = Math.ceil(price * 1.007); // +0.7% fee
        const merchantOrderId = `CP-${Date.now()}-${String(userId).slice(-4)}`;

        // 4. Create transaction in SQLite
        await db.collection('transactions').doc(merchantOrderId).set({
            user_id: userId,
            username: username || 'Discord User',
            item_id: itemId,
            item_name: productData.name,
            price: paymentAmount,
            status: 'PENDING',
            delivered: false,
            payment_url: '',
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
        await db.collection('transactions').doc(merchantOrderId).update({
            qr_string: duitkuData.qrString || '',
            va_number: duitkuData.vaNumber || '',
            reference: duitkuData.reference || '',
            expiry_time: duitkuData.expiryTime || '',
            payment_method: 'SQ',
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
