const https = require('https');

const callbackUrl = 'https://tokoroblox.id/api/payment/duitku/callback';

async function checkCallback() {
    console.log(`\n🚀 CHECKING CALLBACK URL: ${callbackUrl}`);

    const options = {
        method: 'POST', // Duitku sends POST
        headers: {
            'Content-Type': 'application/json'
        }
    };

    const req = https.request(callbackUrl, options, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
            console.log(`\n📥 HTTP STATUS: ${res.statusCode}`);
            // 400 or 405 or 401 is GOOD (means route exists). 404 is BAD (means route missing).
            if (res.statusCode === 404) {
                console.log("❌ CRITCAL ERROR: CALLBACK RETURNED 404 (Not Found)!");
                console.log("👉 This confirms the Duitku integration code is NOT live on the website.");
                console.log("👉 Please re-deploy: git pull -> npm run build -> pm2 restart all");
            } else if (res.statusCode === 500) {
                console.log("❌ CALLBACK RETURNED 500 (Server Error)!");
                console.log("👉 Check server logs: maybe Firebase Admin is failing?");
            } else {
                console.log(`✅ CALLBACK IS LIVE! (Status ${res.statusCode} is expected for empty request)`);
            }
            console.log(`Response Body: ${data.substring(0, 200)}`);
        });
    });

    req.on('error', (e) => {
        console.error(`❌ NETWORK ERROR: ${e.message}`);
    });

    // Send empty body as test
    req.write(JSON.stringify({}));
    req.end();
}

checkCallback();
