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
                let statusIcon = res.statusCode === 200 ? '✅' : '❌';
                let msg = '';
                try {
                    const json = JSON.parse(data);
                    if (res.statusCode === 200 && json.statusCode !== '00') statusIcon = '❌';
                    msg = json.statusMessage || json.Message || data;
                    if (json.qrString) msg += " (QR GENERATED!)";
                } catch (e) { msg = data; }

                console.log(`${statusIcon} [${label}] HTTP ${res.statusCode} | ${msg.substring(0, 150)}`);
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
    console.log(`\n🚀 FINAL "MINIMALIST" CHECK for NusaPay (SQ)...`);

    // TEST: ABSOLUTE MINIMAL (No Expiry, No Optional Fields)
    const oid1 = 'MINIMAL-SQ-' + Date.now();
    const amt1 = 10000;

    // According to docs, only these are REQUIRED (CHECKMARKS):
    // merchantCode, paymentAmount, merchantOrderId, productDetails, email, paymentMethod, customerVaName, returnUrl, callbackUrl, signature

    const payloadMinimal = {
        merchantCode: merchantCode,
        paymentAmount: amt1,
        merchantOrderId: oid1,
        paymentMethod: 'SQ', // NusaPay
        productDetails: 'Test Minimal',
        email: 'customer@discord.com',
        customerVaName: 'User Test',
        callbackUrl: 'https://tokoroblox.id/api/payment/duitku/callback',
        returnUrl: 'https://tokoroblox.id',
        signature: createSignature(oid1, amt1)
        // expiryPeriod REMOVED (Let server decide default)
        // phoneNumber REMOVED (Optional)
        // itemDetails REMOVED (Optional)
        // customerDetail REMOVED (Optional)
    };

    await sendRequest('Absolute Minimal (No Expiry)', payloadMinimal);

    // TEST 2: Minimal with Phone (Some gateways require phone even if stated optional)
    const oid2 = 'MINIMAL-PHONE-' + Date.now();
    const payloadPhone = {
        ...payloadMinimal,
        merchantOrderId: oid2,
        phoneNumber: '08123456789',
        signature: createSignature(oid2, amt1)
    };
    await sendRequest('Minimal + Phone', payloadPhone);
}

runTests();
