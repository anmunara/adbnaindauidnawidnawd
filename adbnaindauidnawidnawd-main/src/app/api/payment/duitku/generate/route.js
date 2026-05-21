import { NextResponse } from 'next/server';
import crypto from 'crypto';

// Duitku credentials
const DUITKU_MERCHANT_CODE = process.env.DUITKU_MERCHANT_CODE;
const DUITKU_API_KEY = process.env.DUITKU_API_KEY;

// PRODUCTION - Using POP API (Redirect Checkout)
const BASE_URL = 'https://api-prod.duitku.com/api/merchant/createInvoice';

function generateSignature(timestamp) {
    const signatureString = `${DUITKU_MERCHANT_CODE}${timestamp}${DUITKU_API_KEY}`;
    return crypto.createHash('sha256').update(signatureString).digest('hex');
}

export async function POST(req) {
    try {
        const body = await req.json();
        const { userId, itemName, amount, merchantOrderId, paymentMethod = '' } = body;

        if (!DUITKU_MERCHANT_CODE || !DUITKU_API_KEY) {
            return NextResponse.json(
                { error: 'Duitku not configured' },
                { status: 500 }
            );
        }

        const amountInt = parseInt(amount);
        if (amountInt < 10000) {
            return NextResponse.json(
                { error: 'Minimum amount is Rp 10.000' },
                { status: 400 }
            );
        }

        const timestamp = Date.now();
        const signature = generateSignature(timestamp);

        // POP API payload - as per official documentation
        const payload = {
            paymentAmount: amountInt,
            merchantOrderId: merchantOrderId,
            productDetails: itemName,
            additionalParam: '',
            merchantUserInfo: '',
            customerVaName: 'Customer',
            email: 'customer@discord.com',
            phoneNumber: '08123456789',
            itemDetails: [{
                name: itemName,
                price: amountInt,
                quantity: 1
            }],
            customerDetail: {
                firstName: 'Customer',
                lastName: 'Discord',
                email: 'customer@discord.com',
                phoneNumber: '08123456789',
                billingAddress: {
                    firstName: 'Customer',
                    lastName: 'Discord',
                    address: 'Jl. Discord No. 1',
                    city: 'Jakarta',
                    postalCode: '12345',
                    phone: '08123456789',
                    countryCode: 'ID'
                },
                shippingAddress: {
                    firstName: 'Customer',
                    lastName: 'Discord',
                    address: 'Jl. Discord No. 1',
                    city: 'Jakarta',
                    postalCode: '12345',
                    phone: '08123456789',
                    countryCode: 'ID'
                }
            },
            callbackUrl: 'https://tokoroblox.id/api/payment/duitku/callback',
            returnUrl: 'https://tokoroblox.id',
            expiryPeriod: 10
        };

        // Only include paymentMethod if specified
        if (paymentMethod) {
            payload.paymentMethod = paymentMethod;
        }

        console.log('[Next.js POP] Creating invoice...');

        const response = await fetch(BASE_URL, {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'x-duitku-signature': signature,
                'x-duitku-timestamp': `${timestamp}`,
                'x-duitku-merchantcode': DUITKU_MERCHANT_CODE
            },
            body: JSON.stringify(payload)
        });

        const responseText = await response.text();
        console.log('[Next.js POP] Response Status:', response.status);

        if (response.status !== 200) {
            console.log('[Next.js POP] Error:', responseText);
            return NextResponse.json(
                { error: 'Failed to generate payment', details: responseText },
                { status: 500 }
            );
        }

        const data = JSON.parse(responseText);
        
        if (data.statusCode && data.statusCode !== '00') {
            return NextResponse.json(
                { error: data.statusMessage || 'Payment failed', details: responseText },
                { status: 500 }
            );
        }

        console.log('[Next.js POP] ✅ Success! Reference:', data.reference);

        return NextResponse.json({
            success: true,
            paymentUrl: data.paymentUrl,
            reference: data.reference,
            amount: amountInt,
            paymentMethod: paymentMethod || 'CUSTOMER_CHOICE'
        });

    } catch (error) {
        console.error('[Next.js POP] Error:', error);
        return NextResponse.json(
            { error: error.message },
            { status: 500 }
        );
    }
}
