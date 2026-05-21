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
                // ADDING HEADERS OF A "REAL" CLIENT
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(bodyString),
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/92.0.4515.159 Safari/537.36',
                'Referer': 'https://tokoroblox.id/',
                'Origin': 'https://tokoroblox.id'
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
    console.log(`\n🚀 CHECKING BLOCKED HEADERS? (Looking like a real browser)...`);

    const oid1 = 'MIMIC-BROWSER-' + Date.now();
    const amt1 = 10000;

    // Exact payload that is failing, but with BROWSER HEADERS now
    const payload = {
        merchantCode: merchantCode,
        paymentAmount: amt1,
        merchantOrderId: oid1,
        paymentMethod: 'SQ',
        productDetails: 'Test Mimic Browser',
        email: 'customer@discord.com',
        customerVaName: 'User Test',
        callbackUrl: 'https://tokoroblox.id/api/payment/duitku/callback',
        returnUrl: 'https://tokoroblox.id',
        signature: createSignature(oid1, amt1)
    };

    await sendRequest('With Browser User-Agent', payload);
}

runTests();
