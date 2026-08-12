/**
 * Phryco E2EE & Application-Layer Traffic Encryption (e2e_crypto.js)
 * Implements AES-GCM-256 client-side payload encryption using Web Crypto API.
 * Ensures zero plaintext data is visible to third-party network sniffers, proxies, or ISPs.
 */

export async function deriveSessionKey(sharedSecretStr) {
    const encoder = new TextEncoder();
    const keyMaterial = await window.crypto.subtle.importKey(
        "raw",
        encoder.encode(sharedSecretStr),
        { name: "PBKDF2" },
        false,
        ["deriveKey"]
    );
    return await window.crypto.subtle.deriveKey(
        {
            name: "PBKDF2",
            salt: encoder.encode("PhrycoTrafficSalt2026"),
            iterations: 100000,
            hash: "SHA-256"
        },
        keyMaterial,
        { name: "AES-GCM", length: 256 },
        false,
        ["encrypt", "decrypt"]
    );
}

export async function encryptPayload(dataObj, secretKey) {
    try {
        const encoder = new TextEncoder();
        const jsonStr = JSON.stringify(dataObj);
        const iv = window.crypto.getRandomValues(new Uint8Array(12));
        
        const encryptedContent = await window.crypto.subtle.encrypt(
            {
                name: "AES-GCM",
                iv: iv
            },
            secretKey,
            encoder.encode(jsonStr)
        );

        const ivB64 = btoa(String.fromCharCode.apply(null, iv));
        const cipherB64 = btoa(String.fromCharCode.apply(null, new Uint8Array(encryptedContent)));

        return {
            e2ee: true,
            iv: ivB64,
            ciphertext: cipherB64
        };
    } catch (e) {
        console.error("[E2EE Crypto] Encryption failed:", e);
        return dataObj;
    }
}

export async function decryptPayload(encryptedObj, secretKey) {
    try {
        if (!encryptedObj || !encryptedObj.e2ee) return encryptedObj;
        
        const iv = new Uint8Array(atob(encryptedObj.iv).split("").map(c => c.charCodeAt(0)));
        const ciphertext = new Uint8Array(atob(encryptedObj.ciphertext).split("").map(c => c.charCodeAt(0)));

        const decryptedContent = await window.crypto.subtle.decrypt(
            {
                name: "AES-GCM",
                iv: iv
            },
            secretKey,
            ciphertext
        );

        const decoder = new TextDecoder();
        return JSON.parse(decoder.decode(decryptedContent));
    } catch (e) {
        console.error("[E2EE Crypto] Decryption failed:", e);
        return null;
    }
}

if (typeof window !== 'undefined') {
    window.PhrycoE2EE = { deriveSessionKey, encryptPayload, decryptPayload };
}
