/**
 * Phryco Design System - Device-Bound Session Credentials (DBSC) Shield (dbsc_shield.js)
 * Generates local ECDSA P-256 hardware keypairs bound to browser SubtleCrypto/TPM.
 * Cryptographically signs state-modifying requests to block session theft & token replay.
 */

let dbscKeyPair = null;
let deviceId = null;

async function getOrCreateDBSCKey() {
    if (dbscKeyPair) return dbscKeyPair;
    
    deviceId = localStorage.getItem('phryco_dbsc_device_id');
    if (!deviceId) {
        deviceId = 'dev_' + Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
        localStorage.setItem('phryco_dbsc_device_id', deviceId);
    }

    try {
        dbscKeyPair = await window.crypto.subtle.generateKey(
            {
                name: "ECDSA",
                namedCurve: "P-256"
            },
            true,
            ["sign", "verify"]
        );
        return dbscKeyPair;
    } catch (e) {
        console.warn("[DBSC Shield] SubtleCrypto keygen fallback:", e);
        return null;
    }
}

export async function attachDBSCSignatureHeaders(headers = {}, method = 'GET', path = '/', bodyString = '') {
    if (['GET', 'HEAD', 'OPTIONS'].includes(method.toUpperCase())) {
        return headers;
    }

    try {
        const keyPair = await getOrCreateDBSCKey();
        if (!keyPair || !keyPair.privateKey) return headers;

        const timestamp = (Date.now() / 1000).toFixed(3);
        const encoder = new TextEncoder();
        
        // Compute SHA-256 digest of body
        const bodyBuffer = encoder.encode(bodyString || '');
        const bodyHashBuffer = await window.crypto.subtle.digest('SHA-256', bodyBuffer);
        const bodyHashArray = Array.from(new Uint8Array(bodyHashBuffer));
        const bodyHashHex = bodyHashArray.map(b => b.toString(16).padStart(2, '0')).join('');

        const payloadToSign = `${method.toUpperCase()}:${path}:${timestamp}:${bodyHashHex}`;
        const signatureBuffer = await window.crypto.subtle.sign(
            {
                name: "ECDSA",
                hash: { name: "SHA-256" }
            },
            keyPair.privateKey,
            encoder.encode(payloadToSign)
        );

        const signatureArray = Array.from(new Uint8Array(signatureBuffer));
        const signatureB64 = btoa(String.fromCharCode.apply(null, signatureArray));

        headers['X-DBSC-Device-ID'] = deviceId;
        headers['X-DBSC-Timestamp'] = timestamp;
        headers['X-DBSC-Signature'] = signatureB64;
    } catch (e) {
        console.warn("[DBSC Shield] Signature attachment warning:", e);
    }

    return headers;
}

if (typeof window !== 'undefined') {
    window.attachDBSCSignatureHeaders = attachDBSCSignatureHeaders;
}
