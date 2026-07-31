// Base URL for the Phryco API
// In local testing, this is localhost:8000
// When using Zrok, update this to the Zrok public URL
// If window.PHRYCO_API_URL is set (e.g. by CI or a script tag), use it.
// If the app is hosted on the same domain as the backend, fallback to window.location.origin.
// Otherwise, use the default Cloudflare Tunnel URL.
export const API_BASE_URL = window.PHRYCO_API_URL || 
    (window.location.origin.includes('localhost') || window.location.origin.includes('trycloudflare') ? 'https://convertible-nuts-champagne-handheld.trycloudflare.com' : window.location.origin);









































