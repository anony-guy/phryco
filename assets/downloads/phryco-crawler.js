const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const http = require('http');
const https = require('https');

// Get arguments
const args = process.argv.slice(2);
const clientId = args[0];
const clientSecret = args[1];

if (!clientId || !clientSecret) {
    console.error("Usage: node phryco-crawler.js <CLIENT_ID> <CLIENT_SECRET>");
    process.exit(1);
}

const MALICIOUS_PATTERNS = [
    /eval\s*\(/i,
    /atob\s*\(/i,
    /document\.cookie/i,
    /window\.localStorage/i
];

let filesScanned = 0;
let maliciousFound = 0;

function scanDirectory(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            if (file !== 'node_modules' && file !== '.git') {
                scanDirectory(fullPath);
            }
        } else {
            if (fullPath.endsWith('.js') || fullPath.endsWith('.php') || fullPath.endsWith('.html')) {
                filesScanned++;
                const content = fs.readFileSync(fullPath, 'utf8');
                let fileIsClean = true;
                for (const pattern of MALICIOUS_PATTERNS) {
                    if (pattern.test(content)) {
                        maliciousFound++;
                        console.warn(`WARNING: Potential malicious pattern found in ${fullPath}`);
                        fileIsClean = false;
                        break;
                    }
                }
            }
        }
    }
}

console.log("Starting Phryco Verification Scan...");
scanDirectory(process.cwd());

console.log(`Scan complete. Files scanned: ${filesScanned}, Malicious hits: ${maliciousFound}`);

const timestamp = Math.floor(Date.now() / 1000);
const dataToSign = `${clientId}:${timestamp}:${maliciousFound}`;
const signature = crypto.createHmac('sha256', clientSecret).update(dataToSign).digest('hex');

const payload = JSON.stringify({
    timestamp,
    malicious_found: maliciousFound,
    signature
});

const options = {
    hostname: 'api.phryco.com',
    port: 443,
    path: `/api/sso/clients/${clientId}/verify-scan`,
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload)
    }
};

// In local dev we use http to localhost:8000, let's allow an env override
const apiHost = process.env.PHRYCO_API_HOST || 'api.phryco.com';
const apiProtocol = apiHost.includes('localhost') || apiHost.includes('127.0.0.1') ? http : https;

options.hostname = apiHost.split(':')[0];
options.port = apiHost.includes(':') ? parseInt(apiHost.split(':')[1]) : (apiProtocol === https ? 443 : 80);

console.log(`Submitting results to ${apiHost}...`);

const req = apiProtocol.request(options, (res) => {
    let data = '';
    res.on('data', (chunk) => data += chunk);
    res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
            console.log("Verification Successful! Your app has been upgraded to VERIFIED status.");
            console.log("IMPORTANT: Please make sure this script (phryco-crawler.js) remains accessible at your Redirect URI path for continuous presence checks.");
        } else {
            console.error("Verification Failed:", data);
        }
    });
});

req.on('error', (e) => {
    console.error("Error submitting results:", e.message);
});

req.write(payload);
req.end();
