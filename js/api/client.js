import { API_BASE_URL } from '../utils/config.js';
import { getAuthHeaders } from '../utils/auth.js';

// Instant Offline Protection
function handleConnectionChange() {
    if (typeof window === 'undefined') return;
    if (!navigator.onLine && !window.location.pathname.endsWith('/offline.html')) {
        console.warn("No internet connection detected. Redirecting to offline arcade...");
        localStorage.setItem('phryco_return_url', window.location.href);
        window.location.href = '/offline.html';
    }
}

if (typeof window !== 'undefined') {
    window.addEventListener('offline', handleConnectionChange);
    // Verify connection status immediately upon script evaluation
    if (!navigator.onLine) {
        handleConnectionChange();
    }
}

// Server Offline Warning Overlay
export function showServerOfflineOverlay(detail = "Backend API is unreachable") {
    if (typeof document === 'undefined' || !document.body) return;
    if (!navigator.onLine) {
        handleConnectionChange();
        return;
    }
    if (document.getElementById('phryco-server-offline-overlay')) {
        return; // Overlay is already open
    }

    const overlay = document.createElement('div');
    overlay.id = 'phryco-server-offline-overlay';
    overlay.style.cssText = 'position: fixed; inset: 0; z-index: 99999; background: rgba(15, 23, 42, 0.88); backdrop-filter: blur(8px); display: flex; align-items: center; justify-content: center; padding: 1rem; opacity: 0; transition: opacity 0.3s ease;';
    
    const safeDetail = String(detail).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
    
    overlay.innerHTML = `
        <div style="background: linear-gradient(145deg, rgba(30, 41, 59, 0.95), rgba(15, 23, 42, 0.98)); border: 1px solid rgba(239, 68, 68, 0.4); box-shadow: 0 20px 40px rgba(0, 0, 0, 0.6), 0 0 20px rgba(239, 68, 68, 0.2); border-radius: 16px; padding: 2.5rem; max-width: 480px; width: 100%; text-align: center; position: relative; font-family: system-ui, -apple-system, sans-serif;">
            <div style="width: 72px; height: 72px; border-radius: 50%; background: rgba(239, 68, 68, 0.15); border: 2px solid rgba(239, 68, 68, 0.5); display: flex; align-items: center; justify-content: center; margin: 0 auto 1.5rem; color: #ef4444;">
                <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <rect width="20" height="8" x="2" y="2" rx="2" ry="2"/>
                    <rect width="20" height="8" x="2" y="14" rx="2" ry="2"/>
                    <line x1="6" x2="6.01" y1="6" y2="6"/>
                    <line x1="6" x2="6.01" y1="18" y2="18"/>
                    <line x1="2" x2="22" y1="2" y2="22"/>
                </svg>
            </div>
            <h2 style="color: #f8fafc; font-size: 1.5rem; margin: 0 0 0.75rem; font-weight: 700;">Server Temporarily Offline</h2>
            <p style="color: #94a3b8; font-size: 0.95rem; line-height: 1.5; margin: 0 0 1.5rem;">
                Your device is connected to the internet (<span style="color: #10b981; font-weight: 600;">Online</span>), but the Phryco backend server appears unreachable or undergoing maintenance (${safeDetail}).
            </p>
            <div style="display: flex; flex-direction: column; gap: 0.75rem;">
                <button id="server-retry-btn" style="background: linear-gradient(135deg, #6366f1, #4f46e5); color: white; border: none; padding: 0.875rem 1.5rem; border-radius: 10px; font-weight: 600; font-size: 0.95rem; cursor: pointer; transition: filter 0.2s ease; box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);">
                    🔄 Retry Connection
                </button>
                <button id="server-offline-arcade-btn" style="background: rgba(251, 191, 36, 0.15); border: 1px solid rgba(251, 191, 36, 0.5); color: #f59e0b; padding: 0.875rem 1.5rem; border-radius: 10px; font-weight: 600; font-size: 0.95rem; cursor: pointer; transition: background 0.2s ease;">
                    🎮 Go to Offline Arcade Page
                </button>
                <button id="server-dismiss-btn" style="background: transparent; border: none; color: #64748b; font-size: 0.85rem; padding: 0.5rem; cursor: pointer; text-decoration: underline; margin-top: 0.25rem;">
                    Dismiss warning and stay on page
                </button>
            </div>
        </div>
    `;

    document.body.appendChild(overlay);
    requestAnimationFrame(() => { overlay.style.opacity = '1'; });

    const retryBtn = document.getElementById('server-retry-btn');
    const arcadeBtn = document.getElementById('server-offline-arcade-btn');
    const dismissBtn = document.getElementById('server-dismiss-btn');

    if (retryBtn) {
        retryBtn.addEventListener('click', () => {
            retryBtn.style.filter = 'brightness(0.8)';
            retryBtn.textContent = '⏳ Checking Server...';
            window.location.reload();
        });
    }

    if (arcadeBtn) {
        arcadeBtn.addEventListener('click', () => {
            localStorage.setItem('phryco_return_url', window.location.href);
            window.location.href = '/offline.html';
        });
    }

    if (dismissBtn) {
        dismissBtn.addEventListener('click', () => {
            overlay.style.opacity = '0';
            setTimeout(() => overlay.remove(), 300);
        });
    }
}

export async function apiFetch(endpoint, options = {}) {
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
        handleConnectionChange();
        throw new Error("No internet connection.");
    }

    const url = `${API_BASE_URL}${endpoint}`;
    const headers = {
        ...getAuthHeaders(),
        ...options.headers
    };

    // If body is present and not FormData, ensure Content-Type is application/json and stringify if object
    if (options.body && !(options.body instanceof FormData)) {
        if (typeof options.body === 'object') {
            options.body = JSON.stringify(options.body);
        }
        headers['Content-Type'] = headers['Content-Type'] || 'application/json';
    }

    const config = {
        ...options,
        headers
    };

    try {
        const response = await fetch(url, config);
        
        // Handle Gateway/Server offline codes (502, 503, 504)
        if (response.status === 502 || response.status === 503 || response.status === 504) {
            showServerOfflineOverlay(`HTTP ${response.status} ${response.statusText}`);
            throw new Error(`Server Offline (${response.status})`);
        }

        // Handle 401 Unauthorized globally
        if (response.status === 401) {
            console.warn("Unauthorized access. Token may be expired.");
            localStorage.removeItem('phryco_token');
            window.location.href = '../../pages/login/index.html';
        }
        
        let data;
        // some endpoints might return empty body
        try {
            data = await response.json();
        } catch (e) {
            data = null;
        }

        if (!response.ok) {
            let errorMsg = response.statusText;
            if (data && data.detail) {
                if (Array.isArray(data.detail)) {
                    errorMsg = data.detail.map(err => `${err.loc ? err.loc.join('.') + ': ' : ''}${err.msg}`).join(' | ');
                } else if (typeof data.detail === 'object') {
                    errorMsg = JSON.stringify(data.detail);
                } else {
                    errorMsg = data.detail;
                }
            }
            throw new Error(errorMsg);
        }

        return data;
    } catch (error) {
        console.error(`API Error on ${endpoint}:`, error);
        if (typeof navigator !== 'undefined') {
            if (!navigator.onLine) {
                handleConnectionChange();
            } else if (error instanceof TypeError || error.message.includes('Failed to fetch') || error.message.includes('NetworkError') || error.message.includes('Load failed')) {
                showServerOfflineOverlay(error.message);
            }
        }
        throw error;
    }
}

// Register Service Worker for PWA and Aggressive Caching
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        // Must use absolute path to the root sw.js to grant it scope over the entire site
        navigator.serviceWorker.register('/sw.js').then(registration => {
            console.log('ServiceWorker registration successful with scope: ', registration.scope);
        }).catch(err => {
            console.warn('ServiceWorker registration failed: ', err);
        });
    });
}
