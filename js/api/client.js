import { API_BASE_URL } from '../utils/config.js';
import { getAuthHeaders } from '../utils/auth.js';

export async function apiFetch(endpoint, options = {}) {
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
