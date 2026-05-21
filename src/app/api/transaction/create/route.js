import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import { adminAuth, adminDb } from '@/lib/firebaseAdmin';
import { assertSameOrigin } from '@/lib/security';
import crypto from 'crypto';

// Rate limiting per user
const rateLimitMap = new Map();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX = 3; // max 3 transactions per minute per user

function isRateLimited(userId) {
    const now = Date.now();
    const entry = rateLimitMap.get(userId);

    if (!entry || now - entry.firstAttempt > RATE_LIMIT_WINDOW) {
        rateLimitMap.set(userId, { firstAttempt: now, count: 1 });
        return false;
    }

    entry.count++;
    if (entry.count > RATE_LIMIT_MAX) {
        return true;
    }
    return false;
}

// Validation functions
function validateUserId(userId) {
    if (!userId) return { valid: false, error: 'User ID is required' };
    if (typeof userId !== 'string') return { valid: false, error: 'User ID must be a string' };
    if (userId.length < 3 || userId.length > 100) return { valid: false, error: 'User ID must be 3-100 characters' };
    // Allow alphanumeric, email format, and common special chars for usernames
    if (!/^[a-zA-Z0-9._%+-@]+$/.test(userId)) return { valid: false, error: 'User ID contains invalid characters' };
    return { valid: true, value: userId.trim() };
}

function validateItemId(itemId) {
    if (!itemId) return { valid: false, error: 'Item ID is required' };
    if (typeof itemId !== 'string') return { valid: false, error: 'Item ID must be a string' };
    if (itemId.length < 5 || itemId.length > 50) return { valid: false, error: 'Invalid Item ID' };
    // Firebase document IDs are alphanumeric with some special chars
    if (!/^[a-zA-Z0-9_-]+$/.test(itemId)) return { valid: false, error: 'Invalid Item ID format' };
    return { valid: true, value: itemId.trim() };
}

function validatePrice(price) {
    if (!price && price !== 0) return { valid: false, error: 'Price is required' };
    if (typeof price !== 'number') return { valid: false, error: 'Price must be a number' };
    if (price <= 0) return { valid: false, error: 'Price must be greater than 0' };
    if (price > 10000000) return { valid: false, error: 'Price exceeds maximum limit' };
    return { valid: true, value: Math.floor(price) };
}

function validatePaymentMethod(method) {
    if (!method) return { valid: false, error: 'Payment method is required' };
    if (typeof method !== 'string') return { valid: false, error: 'Payment method must be a string' };
    const allowedMethods = ['SQ', 'M2', 'I1', 'BR', 'A1', 'OV', 'DA', 'SA', 'GJ', 'IR', 'FT', 'QRIS'];
    if (!allowedMethods.includes(method)) return { valid: false, error: 'Invalid payment method' };
    return { valid: true, value: method };
}

export async function POST(request) {
    try {
        const originErr = assertSameOrigin(request);
        if (originErr) return originErr;

        // Authentication check
        const session = await getServerSession(authOptions);
        if (!session || !session.user?.id) {
            return NextResponse.json(
                { success: false, message: 'Unauthorized. Please login.' },
                { status: 401 }
            );
        }

        // Rate limiting per user
        if (isRateLimited(session.user.id)) {
            return NextResponse.json(
                { success: false, message: 'Terlalu banyak transaksi. Coba lagi dalam 1 menit.' },
                { status: 429 }
            );
        }

        // Parse body
        let body;
        try {
            body = await request.json();
        } catch (e) {
            return NextResponse.json(
                { success: false, message: 'Invalid JSON body' },
                { status: 400 }
            );
        }

        const { slug, userId, itemId, itemName, price, paymentMethod } = body;

        // Validate all required fields
        const userIdValidation = validateUserId(userId);
        if (!userIdValidation.valid) {
            return NextResponse.json({ success: false, message: userIdValidation.error }, { status: 400 });
        }

        const itemIdValidation = validateItemId(itemId);
        if (!itemIdValidation.valid) {
            return NextResponse.json({ success: false, message: itemIdValidation.error }, { status: 400 });
        }

        const methodValidation = validatePaymentMethod(paymentMethod);
        if (!methodValidation.valid) {
            return NextResponse.json({ success: false, message: methodValidation.error }, { status: 400 });
        }

        // CRITICAL: trust server-side product data, never the client-supplied price.
        // Without this, a malicious client can request itemId=<expensive> price=1
        // and the Duitku invoice will be Rp 1, bypassing the actual cost.
        const typeDoc = await adminDb.collection('game_types').doc(itemIdValidation.value).get();
        if (!typeDoc.exists) {
            return NextResponse.json({ success: false, message: 'Produk tidak ditemukan' }, { status: 404 });
        }
        const typeData = typeDoc.data();
        const trustedPrice = Math.floor(Number(typeData.sellingPrice) || 0);
        if (trustedPrice < 1000 || trustedPrice > 10_000_000) {
            // Sanity guard: refuse to create payment for an unconfigured / corrupt type.
            return NextResponse.json({ success: false, message: 'Produk belum dikonfigurasi' }, { status: 400 });
        }
        const trustedItemName = String(typeData.name || 'Cloud Phone').slice(0, 100).replace(/[<>"']/g, '');

        // 1. Check Stock BEFORE creating payment
        const codesSnapshot = await adminDb.collection('redeem_codes')
            .where('typeId', '==', itemIdValidation.value)
            .where('isUsed', '==', false)
            .limit(1)
            .get();

        if (codesSnapshot.empty) {
            return NextResponse.json(
                { success: false, message: 'Stok habis! Silakan hubungi admin.' },
                { status: 400 }
            );
        }

        // 2. Create Order ID with crypto (more secure than Math.random)
        const orderId = `TRX-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;

        // 3. Prepare Duitku Parameters
        const merchantCode = process.env.DUITKU_MERCHANT_CODE;
        const apiKey = process.env.DUITKU_API_KEY;
        
        if (!merchantCode || !apiKey) {
            console.error('[Transaction Create] Duitku credentials not configured');
            return NextResponse.json(
                { success: false, message: 'Payment gateway not configured' },
                { status: 500 }
            );
        }

        const paymentAmount = trustedPrice;
        const productDetails = `Top Up ${trustedItemName} (${userIdValidation.value})`;
        const email = session.user.email || 'customer@example.com';
        const phoneNumber = '08123456789';
        const callbackUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://tokoroblox.id'}/api/payment/duitku/callback`;
        const returnUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://tokoroblox.id'}/order/${orderId}`;

        // Signature for v2/inquiry
        const signatureString = merchantCode + orderId + paymentAmount + apiKey;
        const signature = crypto.createHash('md5').update(signatureString).digest('hex');

        // 4. Call Duitku API
        const apiUrl = 'https://passport.duitku.com/webapi/api/merchant/v2/inquiry';

        const payload = {
            merchantCode: merchantCode,
            merchantOrderId: orderId,
            paymentAmount: paymentAmount,
            paymentMethod: methodValidation.value,
            productDetails: productDetails,
            email: email,
            phoneNumber: phoneNumber,
            customerVaName: userIdValidation.value.substring(0, 20), // Limit length
            itemDetails: [
                {
                    name: trustedItemName,
                    price: paymentAmount,
                    quantity: 1
                }
            ],
            callbackUrl: callbackUrl,
            returnUrl: returnUrl,
            signature: signature,
            expiryPeriod: 10 // 10 minutes
        };

        console.log('[Transaction Create] Calling Duitku v2/inquiry...');

        const duitkuRes = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const responseText = await duitkuRes.text();
        console.log('[Transaction Create] Response Status:', duitkuRes.status);

        let duitkuData;
        try {
            duitkuData = JSON.parse(responseText);
        } catch (e) {
            console.error('[Transaction Create] Invalid JSON Response:', responseText);
            return NextResponse.json({
                success: false,
                message: 'Invalid response from payment gateway'
            }, { status: 500 });
        }

        // Check if request was successful
        if (duitkuData.statusCode !== '00') {
            console.error('[Transaction Create] Payment gateway error:', duitkuData.statusMessage);
            return NextResponse.json({
                success: false,
                message: 'Gagal membuat pembayaran: ' + (duitkuData.statusMessage || 'Unknown error')
            }, { status: 500 });
        }

        // Verify QR String for QRIS
        if ((methodValidation.value === 'QRIS' || methodValidation.value === 'SQ') && !duitkuData.qrString) {
            console.error('[Transaction Create] No QR String returned for', methodValidation.value);
            return NextResponse.json({
                success: false,
                message: 'Gagal generate QR Code'
            }, { status: 500 });
        }

        // 5. Save Order to Firestore
        const orderData = {
            orderId,
            userId: userIdValidation.value,
            userEmail: session.user.email,
            itemId: itemIdValidation.value,
            itemName: trustedItemName,
            price: paymentAmount,
            paymentMethod: methodValidation.value,
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

        console.log('[Transaction Create] Order saved:', orderId);

        return NextResponse.json({
            success: true,
            orderId: orderId,
            qrString: duitkuData.qrString,
            vaNumber: duitkuData.vaNumber || null,
            paymentMethod: methodValidation.value,
            expiryTime: duitkuData.expiryTime || null
        });

    } catch (error) {
        console.error('Transaction Error:', error);
        return NextResponse.json(
            { success: false, message: 'Internal Server Error' },
            { status: 500 }
        );
    }
}
