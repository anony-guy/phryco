/**
 * Phryco Design System - Storage Buckets & Quota Manager (storage_buckets.js)
 * Manages isolated storage buckets (video-cache, upload-drafts, telemetry) and persistence.
 */

export async function initStorageBuckets() {
    // 1. Request persistent storage for video cache & security WASM
    if (navigator.storage && navigator.storage.persist) {
        try {
            const isPersisted = await navigator.storage.persisted();
            if (!isPersisted) {
                const granted = await navigator.storage.persist();
                console.log(`[Storage Persistence] Granted: ${granted}`);
            }
        } catch (e) {
            console.warn("[Storage Persistence] Quota request warning:", e);
        }
    }

    // 2. Storage Buckets API initialization if supported
    if ('storage' in navigator && 'open' in navigator.storage) {
        try {
            const videoBucket = await navigator.storage.open('phryco-video-cache');
            console.log("[Storage Buckets] Initialized bucket: phryco-video-cache");
            return videoBucket;
        } catch (e) {
            console.warn("[Storage Buckets] Experimental Storage Buckets API unavailable:", e);
        }
    }
    return null;
}

if (typeof window !== 'undefined') {
    window.initStorageBuckets = initStorageBuckets;
    document.addEventListener('DOMContentLoaded', () => {
        initStorageBuckets().catch(() => {});
    });
}
