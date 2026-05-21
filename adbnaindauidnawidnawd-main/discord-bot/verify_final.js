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
    console.log(`\n🚀 FINAL "BRUTE FORCE" CHECK for NusaPay...`);

    // TEST 1: Numeric Order ID (Maybe they hate hyphens?)
    const oid1 = Date.now().toString(); // Pure numeric
    const amt1 = 20000;
    await sendRequest('Numeric OrderID', {
        merchantCode,
        paymentAmount: amt1,
        paymentMethod: 'SQ',
        merchantOrderId: oid1,
        productDetails: 'Test Numeric',
        email: 'test@examples.com',
        phoneNumber: '08123456789',
        customerVaName: 'User Test',
        callbackUrl: 'https://tokoroblox.id/api/payment/duitku/callback',
        returnUrl: 'https://tokoroblox.id',
        signature: createSignature(oid1, amt1),
        expiryPeriod: 10
    });

    // TEST 2: Amount as STRING (Some weird APIs require this)
    const oid2 = 'STR-AMT-' + Date.now();
    await sendRequest('Amount as String', {
        merchantCode,
        paymentAmount: "20000", // String!
        paymentMethod: 'SQ',
        merchantOrderId: oid2,
        productDetails: 'Test String Amount',
        email: 'test@examples.com',
        phoneNumber: '08123456789',
        customerVaName: 'User Test',
        callbackUrl: 'https://tokoroblox.id/api/payment/duitku/callback',
        returnUrl: 'https://tokoroblox.id',
        signature: createSignature(oid2, 20000), // Signature uses value
        expiryPeriod: 10
    });

    // TEST 3: Strict Valid Phone (+62) & Real Email
    const oid3 = 'VALID-DATA-' + Date.now();
    await sendRequest('Strict Data', {
        merchantCode,
        paymentAmount: 20000,
        paymentMethod: 'SQ',
        merchantOrderId: oid3,
        productDetails: 'Test Valid Data',
        email: 'myrealemail@gmail.com', // Real looking
        phoneNumber: '6281234567890', // 62 format
        customerVaName: 'Budi Santoso', // Real name
        callbackUrl: 'https://tokoroblox.id/api/payment/duitku/callback',
        returnUrl: 'https://tokoroblox.id',
        signature: createSignature(oid3, 20000),
        expiryPeriod: 15
    });

    // TEST 4: The Control (Mandiri VA) AGAIN
    const oid4 = 'M2-CONTROL-' + Date.now();
    await sendRequest('Mandiri VA (M2)', {
        merchantCode,
        paymentAmount: 20000,
        paymentMethod: 'M2',
        merchantOrderId: oid4,
        productDetails: 'Test Control',
        email: 'test@examples.com',
        phoneNumber: '08123456789',
        customerVaName: 'User Test',
        callbackUrl: 'https://tokoroblox.id/api/payment/duitku/callback',
        returnUrl: 'https://tokoroblox.id',
        signature: createSignature(oid4, 20000),
        expiryPeriod: 60
    });
}

runTests();
