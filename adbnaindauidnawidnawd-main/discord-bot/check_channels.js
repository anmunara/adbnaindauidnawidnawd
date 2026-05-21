require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const crypto = require('crypto');
const https = require('https');

const merchantCode = process.env.DUITKU_MERCHANT_CODE;
const apiKey = process.env.DUITKU_API_KEY;
const endpoint = 'https://passport.duitku.com/webapi/api/merchant/paymentmethod/getpaymentmethod';

if (!merchantCode || !apiKey) {
    console.error("❌ ERROR: Missing DUITKU_MERCHANT_CODE or DUITKU_API_KEY");
    process.exit(1);
}

function getFormattedDate() {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

async function checkChannels() {
    const datetime = getFormattedDate();
    const amount = 10000;

    // IMPORTANT: getPaymentMethod uses SHA256, not MD5
    const signature = crypto.createHash('sha256')
        .update(`${merchantCode}${amount}${datetime}${apiKey}`)
        .digest('hex');

    const payload = {
        merchantcode: merchantCode,
        amount: amount,
        datetime: datetime,
        signature: signature
    };

    const bodyString = JSON.stringify(payload);
    const options = {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(bodyString)
        }
    };

    console.log(`\n🚀 CHECKING ACTIVE CHANNELS (Production)...`);
    console.log(`Endpoint: ${endpoint}`);
    console.log(`Merchant: ${merchantCode}`);
    console.log(`Time: ${datetime}`);

    const req = https.request(endpoint, options, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
            console.log(`\n📥 HTTP STATUS: ${res.statusCode}`);
            try {
                const json = JSON.parse(data);
                if (json.responseCode === '00') {
                    console.log(`\n✅ ACTIVE CHANNELS FOUND:`);
                    const channels = json.paymentFee || [];
                    let nusapayFound = false;

                    channels.forEach(ch => {
                        const isNusaPay = ch.paymentMethod === 'SQ';
                        if (isNusaPay) nusapayFound = true;
                        console.log(`- [${ch.paymentMethod}] ${ch.paymentName} ${isNusaPay ? ' <--- NUSAPAY IS HERE!' : ''}`);
                    });

                    console.log('\n---------------------------------------------------');
                    if (nusapayFound) {
                        console.log("ℹ️ NusaPay (SQ) IS LISTED as active. The 500 error is definitely a server-side failure.");
                    } else {
                        console.log("⚠️ NusaPay (SQ) IS NOT LISTED! You need to activate it in Duitku Dashboard or contact Support.");
                    }
                } else {
                    console.log(`❌ ERROR: ${json.responseMessage}`);
                }
            } catch (e) {
                console.log(`❌ FAILED TO PARSE JSON: ${data}`);
            }
        });
    });

    req.on('error', (e) => {
        console.error(`❌ NETWORK ERROR: ${e.message}`);
    });

    req.write(bodyString);
    req.end();
}

checkChannels();
