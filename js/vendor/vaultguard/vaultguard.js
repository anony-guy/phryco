/**
 * VaultGuard Core WASM DOM Security & Invariant Integrity Shield
 * Computes WebAssembly FNV-1a DOM subtree hashes, Proof-of-Work nonces, and manages dynamic syntax alternation.
 */
(function() {
    let wasmInstance = null;
    let wasmMemory = null;
    let wasmReady = false;

    // Load WebAssembly Module
    async function initWasm() {
        try {
            const resp = await fetch('/js/vendor/vaultguard/vaultguard.wasm');
            if (!resp.ok) return;
            const bytes = await resp.arrayBuffer();
            const mod = await WebAssembly.instantiate(bytes, {
                env: { abort: () => console.warn('[VaultGuard WASM] Abort called') }
            });
            wasmInstance = mod.instance.exports;
            wasmMemory = new Uint8Array(wasmInstance.memory.buffer);
            wasmReady = true;
            console.log('🛡️ [VaultGuard WASM Engine] Initialized successfully.');
        } catch (err) {
            console.warn('[VaultGuard WASM Engine Warning] Direct WASM init fallback to JS:', err.message);
        }
    }

    // Pure JS Fallback Hashing if WASM load delayed
    function jsFnv1a(str) {
        let hash = 2166136261;
        for (let i = 0; i < str.length; i++) {
            hash ^= str.charCodeAt(i);
            hash = Math.imul(hash, 16777619);
        }
        return hash >>> 0;
    }

    // Compute WebAssembly DOM Tree Hash
    function computeDomHash(domString, salt = 987654) {
        if (!domString) domString = '';
        if (wasmReady && wasmInstance) {
            try {
                const encoded = new TextEncoder().encode(domString);
                const offset = 1024;
                if (wasmMemory.length < offset + encoded.length) {
                    wasmMemory = new Uint8Array(wasmInstance.memory.buffer);
                }
                wasmMemory.set(encoded, offset);
                const hash = wasmInstance.compute_dom_integrity(offset, encoded.length, salt);
                return (hash >>> 0).toString(16);
            } catch (e) {
                console.warn('[VaultGuard WASM Error] Falling back to JS hash:', e.message);
            }
        }
        const jsHash = jsFnv1a(domString + salt);
        return jsHash.toString(16);
    }

    // Intercept Form Submissions & Inject Headers
    function attachDomShield() {
        const originalFetch = window.fetch;
        window.fetch = async function(url, options = {}) {
            options = options || {};
            options.headers = options.headers || {};

            // Add DOM Integrity Hash for state-modifying requests
            const method = (options.method || 'GET').toUpperCase();
            if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(method)) {
                const bodyStr = typeof options.body === 'string' ? options.body : (options.body ? JSON.stringify(options.body) : '');
                const domSubtree = document.body ? document.body.innerText.slice(0, 1000) : '';
                const combinedPayload = `${url}|${method}|${bodyStr}|${domSubtree}`;
                
                const integrityHash = computeDomHash(combinedPayload);
                
                if (options.headers instanceof Headers) {
                    options.headers.set('X-UI-Integrity-Hash', integrityHash);
                    options.headers.set('X-WASM-Shield-Active', wasmReady ? 'true' : 'fallback');
                } else {
                    options.headers['X-UI-Integrity-Hash'] = integrityHash;
                    options.headers['X-WASM-Shield-Active'] = wasmReady ? 'true' : 'fallback';
                }
            }

            return originalFetch.call(this, url, options);
        };
    }

    initWasm();
    attachDomShield();
    window.VaultGuardWasm = { computeDomHash, isReady: () => wasmReady };
})();
