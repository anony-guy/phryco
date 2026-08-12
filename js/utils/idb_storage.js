/**
 * Phryco Design System - IndexedDB Storage Engine (idb_storage.js)
 * Provides zero-latency local caching for WASM security binaries, HLS video streams, and upload drafts.
 */

const DB_NAME = 'PhrycoWebStorageDB';
const DB_VERSION = 1;

function openIDB() {
    return new Promise((resolve, reject) => {
        const req = indexedDB.open(DB_NAME, DB_VERSION);
        req.onupgradeneeded = (e) => {
            const db = e.target.result;
            if (!db.objectStoreNames.contains('wasm_binaries')) {
                db.createObjectStore('wasm_binaries');
            }
            if (!db.objectStoreNames.contains('video_chunks')) {
                db.createObjectStore('video_chunks');
            }
            if (!db.objectStoreNames.contains('upload_drafts')) {
                db.createObjectStore('upload_drafts');
            }
        };
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
    });
}

export const PhrycoIDB = {
    async set(storeName, key, value) {
        try {
            const db = await openIDB();
            return new Promise((resolve, reject) => {
                const tx = db.transaction(storeName, 'readwrite');
                const store = tx.objectStore(storeName);
                const req = store.put(value, key);
                req.onsuccess = () => resolve(true);
                req.onerror = () => reject(req.error);
            });
        } catch (e) {
            console.warn(`[IDB Storage] Set failed on ${storeName}:`, e);
            return false;
        }
    },

    async get(storeName, key) {
        try {
            const db = await openIDB();
            return new Promise((resolve, reject) => {
                const tx = db.transaction(storeName, 'readonly');
                const store = tx.objectStore(storeName);
                const req = store.get(key);
                req.onsuccess = () => resolve(req.result);
                req.onerror = () => reject(req.error);
            });
        } catch (e) {
            console.warn(`[IDB Storage] Get failed on ${storeName}:`, e);
            return null;
        }
    },

    async delete(storeName, key) {
        try {
            const db = await openIDB();
            return new Promise((resolve, reject) => {
                const tx = db.transaction(storeName, 'readwrite');
                const store = tx.objectStore(storeName);
                const req = store.delete(key);
                req.onsuccess = () => resolve(true);
                req.onerror = () => reject(req.error);
            });
        } catch (e) {
            console.warn(`[IDB Storage] Delete failed on ${storeName}:`, e);
            return false;
        }
    }
};

if (typeof window !== 'undefined') {
    window.PhrycoIDB = PhrycoIDB;
}
