const crypto = require('crypto');

// Load environment variables
const DUITKU_MERCHANT_CODE = process.env.DUITKU_MERCHANT_CODE;
const DUITKU_API_KEY = process.env.DUITKU_API_KEY;

// v2/inquiry untuk direct QR generation
const INQUIRY_URL = 'https://passport.duitku.com/webapi/api/merchant/v2/inquiry';

/**
 * Generate MD5 Signature untuk v2/inquiry
 * Format: MD5(merchantCode + merchantOrderId + paymentAmount + apiKey)
 */
function generateSignature(merchantOrderId, paymentAmount) {
    const signatureString = `${DUITKU_MERCHANT_CODE}${merchantOrderId}${paymentAmount}${DUITKU_API_KEY}`;
    return crypto.createHash('md5').update(signatureString).digest('hex');
}

/**
 * Create Transaction via Duitku v2/inquiry (Direct QR Generation)
 * Returns QR String langsung tanpa redirect ke Duitku checkout
 * 
 * @param {string} userId - User ID
 * @param {string} itemDetails - Item descriptions
 * @param {number} amount - Payment amount
 * @param {string} merchantOrderId - Unique order ID
 * @param {string} email - Customer email
 * @param {string} paymentMethod - Payment method (SQ = QRIS)
 * @returns {Promise<{qrString: string, reference: string, vaNumber: string, expiryTime: string}>}
 */
async function createInvoice(userId, itemDetails, amount, merchantOrderId, email = 'customer@discord.com', paymentMethod = 'SQ') {
    if (!DUITKU_MERCHANT_CODE || !DUITKU_API_KEY) {
        throw new Error('Missing Duitku Credentials');
    }

    const amountInt = parseInt(amount);
    
    // Minimum amount
    if (amountInt < 10000) {
        throw new Error('Minimum payment amount is Rp 10.000');
    }
    
    const signature = generateSignature(merchantOrderId, amountInt);

    // v2/inquiry payload untuk direct QR generation
    const payload = {
        merchantCode: DUITKU_MERCHANT_CODE,
        merchantOrderId: merchantOrderId,
        paymentAmount: amountInt,
        paymentMethod: paymentMethod || 'SQ', // Default SQ (QRIS)
        productDetails: itemDetails,
        email: email,
        phoneNumber: '08123456789',
        customerVaName: userId,
        itemDetails: [{
            name: itemDetails,
            price: amountInt,
            quantity: 1
        }],
        callbackUrl: 'https://tokoroblox.id/api/payment/duitku/callback',
        returnUrl: 'https://tokoroblox.id',
        signature: signature,
        expiryPeriod: 10 // 10 minutes
    };

    console.log(`[Duitku v2/inquiry] Requesting to: ${INQUIRY_URL}`);
    console.log(`[Duitku v2/inquiry] Amount: Rp ${amountInt.toLocaleString('id-ID')}, Ref: ${merchantOrderId}, Method: ${paymentMethod} (QRIS)`);

    try {
        const response = await fetch(INQUIRY_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        const responseText = await response.text();
        console.log(`[Duitku v2/inquiry] Response Status: ${response.status}`);

        if (response.status !== 200) {
            console.log(`[Duitku v2/inquiry] Error Response: ${responseText}`);
            throw new Error(`Duitku HTTP Error ${response.status}: ${responseText}`);
        }

        let data;
        try {
            data = JSON.parse(responseText);
        } catch (e) {
            throw new Error(`Duitku API Error (Non-JSON): ${responseText}`);
        }

        if (data.statusCode !== '00') {
            throw new Error(`Duitku Transaction Failed: ${data.statusMessage || 'Unknown Error'}`);
        }

        // Check if QR String was generated
        if (!data.qrString) {
            console.warn(`[Duitku v2/inquiry] Warning: No QR String in response`);
        }

        console.log(`[Duitku v2/inquiry] Success - Reference: ${data.reference}, QR: ${!!data.qrString}`);

        return {
            qrString: data.qrString || null,
            reference: data.reference,
            vaNumber: data.vaNumber || null,
            amount: amountInt,
            paymentMethod: paymentMethod,
            expiryTime: data.expiryTime || null
        };
    } catch (error) {
        console.error(`[Duitku v2/inquiry] Error:`, error.message);
        throw error;
    }
}

module.exports = { createInvoice };
