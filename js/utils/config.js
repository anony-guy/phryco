// Base URL for the Phryco API
// In local testing, this is localhost:8000
// When using Zrok, update this to the Zrok public URL
// If window.PHRYCO_API_URL is set (e.g. by CI or a script tag), use it.
// If the app is hosted on the same domain as the backend, fallback to window.location.origin.
// Otherwise, use the default Cloudflare Tunnel URL.
let baseUrl = window.location.origin;

if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || window.location.hostname === '0.0.0.0' || window.location.hostname.startsWith('192.168.') || window.location.hostname.startsWith('10.')) {
    baseUrl = `${window.location.protocol}//${window.location.hostname}:8000`;
} else if (window.location.origin.includes('vercel.app') || window.location.origin.includes('github.io')) {
    baseUrl = 'https://begins-recall-affecting-insight.trycloudflare.com';
}

export const API_BASE_URL = window.PHRYCO_API_URL || baseUrl;
export const VAULTGUARD_SERVER_URL = window.VAULTGUARD_API_URL || (API_BASE_URL.includes(':8000') ? API_BASE_URL.replace(':8000', ':8002') + '/api/vaultguard' : `${API_BASE_URL}/api/vaultguard`);
















































































