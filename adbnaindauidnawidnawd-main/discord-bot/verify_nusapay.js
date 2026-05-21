require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const crypto = require('crypto');
const https = require('https');

const merchantCode = process.env.DUITKU_MERCHANT_CODE;
const apiKey = process.env.DUITKU_API_KEY;
const endpoint = 'https://passport.duitku.com/webapi/api/merchant/v2/inquiry';

if (!merchantCode || !apiKey) {
    console.error("❌ ERROR: Missing DUITKU_MERCHANT_CODE or DUITKU_API_KEY");
    process.exit(1);
}

function sendRequest(label, payload) {
    return new Promise((resolve) => {
        const bodyString = JSON.stringify(payload);
        const options = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(bodyString)
            }
        };

        const req = https.request(endpoint, options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                const status = res.statusCode;
                let msg = '';
                try {
                    const json = JSON.parse(data);
                    msg = json.statusMessage || json.Message || data;
                } catch (e) { msg = data; }

                const icon = status === 200 ? '✅' : '❌';
                console.log(`${icon} [${label}] HTTP ${status} | ${msg.substring(0, 100)}`);
                resolve();
            });
        });

        req.on('error', (e) => {
            console.log(`❌ [${label}] Network Error: ${e.message}`);
            resolve();
        });

        req.write(bodyString);
        req.end();
    });
}

function createSignature(orderId, amount) {
    return crypto.createHash('md5').update(`${merchantCode}${orderId}${amount}${apiKey}`).digest('hex');
}

async function runTests() {
    console.log(`\n🚀 FINAL CHECK for NusaPay (SQ)...`);

    // 1. EXACT DUPLICATE of duitku.js logic
    const oid1 = 'EXACT-MATCH-' + Date.now();
    const amount1 = 10000;
    const sig1 = createSignature(oid1, amount1);

    // Based on discord-bot/utils/duitku.js
    const payloadExact = {
        merchantCode: merchantCode,
        paymentAmount: amount1,
        paymentMethod: 'SQ',
        merchantOrderId: oid1,
        productDetails: 'Test Item Name',
        additionalParam: '',
        merchantUserInfo: '',
        customerVaName: 'User Test',
        email: 'customer@discord.com',
        phoneNumber: '08123456789',
        itemDetails: [{
            name: 'Test Item Name',
            price: amount1,
            quantity: 1
        }],
        customerDetail: {
            firstName: 'User',
            lastName: 'Test',
            email: 'customer@discord.com',
            phoneNumber: '08123456789'
        },
        callbackUrl: 'https://tokoroblox.id/api/payment/duitku/callback',
        returnUrl: 'https://discord.com/channels/@me',
        signature: sig1,
        expiryPeriod: 10 // Changed from 3 to 10 to match docs default
    };

    await sendRequest('Exact Match Logic', payloadExact);

    // 2. MINIMAL payload (Removing optional fields)
    // Docs say itemDetails/customerDetail are optional for most methods
    const oid2 = 'MINIMAL-' + Date.now();
    const sig2 = createSignature(oid2, amount1);

    const payloadMinimal = {
        merchantCode: merchantCode,
        paymentAmount: amount1,
        paymentMethod: 'SQ',
        merchantOrderId: oid2,
        productDetails: 'Test Minimal',
        email: 'customer@discord.com',
        phoneNumber: '08123456789', // Usually required
        customerVaName: 'User Test',
        callbackUrl: 'https://tokoroblox.id/api/payment/duitku/callback',
        returnUrl: 'https://discord.com/channels/@me',
        signature: sig2,
        expiryPeriod: 10
    };

    await sendRequest('Minimal Payload', payloadMinimal);

    // 3. MANDIRI VA (Control)
    const oid3 = 'CONTROL-M2-' + Date.now();
    const sig3 = createSignature(oid3, amount1);

    const payloadControl = {
        merchantCode: merchantCode,
        paymentAmount: amount1,
        paymentMethod: 'M2',
        merchantOrderId: oid3,
        productDetails: 'Test Control',
        email: 'customer@discord.com',
        phoneNumber: '08123456789',
        customerVaName: 'User Test',
        callbackUrl: 'https://tokoroblox.id/api/payment/duitku/callback',
        returnUrl: 'https://discord.com/channels/@me',
        signature: sig3,
        expiryPeriod: 60
    };

    await sendRequest('Mandiri VA Control', payloadControl);
}

runTests();
