import { API_BASE_URL } from './config.js';

// Cache video IDs known to be legacy MP4 (where HLS master.m3u8 returns 404)
const legacyMp4Cache = new Set();

/**
 * Attaches hover preview playback logic to a video card.
 * Handles both HLS (.m3u8 via Hls.js or native Safari) and legacy MP4 streams gracefully
 * to eliminate NotSupportedError and prevent memory leaks.
 */
export function setupVideoCardPreview(card, videoId) {
    let hoverTimer;
    let hlsInstance = null;

    card.addEventListener('mouseenter', () => {
        hoverTimer = setTimeout(() => {
            const preview = card.querySelector('.video-preview');
            const img = card.querySelector('.thumbnail-img');
            if (!preview) return;

            // Attach onplaying handler directly to the video element so that whether HLS succeeds
            // or we fall back asynchronously to legacy MP4, the visual transition is guaranteed to run!
            preview.onplaying = () => {
                preview.style.opacity = '1';
                if (img) img.style.opacity = '0';
            };

            const token = localStorage.getItem('phryco_token');
            const tokenParam = token ? `?token=${token}` : '';
            const hlsUrl = `${API_BASE_URL}/api/videos/${videoId}/hls/master.m3u8${tokenParam}`;
            const mp4Url = `${API_BASE_URL}/api/videos/${videoId}/stream${tokenParam}`;

            // If we already know this video lacks HLS manifests (legacy MP4), bypass HLS entirely
            if (legacyMp4Cache.has(videoId)) {
                preview.src = mp4Url;
                preview.play().catch(() => {});
                return;
            }

            if (typeof Hls !== 'undefined' && Hls.isSupported()) {
                if (!hlsInstance) {
                    hlsInstance = new Hls({
                        capLevelToPlayerSize: true,
                        autoStartLoad: true,
                        xhrSetup: (xhr, url) => {
                            const tok = localStorage.getItem('phryco_token');
                            if (tok) {
                                xhr.setRequestHeader('Authorization', `Bearer ${tok}`);
                            }
                        }
                    });
                    hlsInstance.loadSource(hlsUrl);
                    hlsInstance.attachMedia(preview);
                    hlsInstance.on(Hls.Events.ERROR, (event, data) => {
                        if (data.fatal) {
                            // Fallback to standard MP4/stream if HLS master playlist not found or errors
                            legacyMp4Cache.add(videoId);
                            if (hlsInstance) {
                                hlsInstance.destroy();
                                hlsInstance = null;
                            }
                            preview.src = mp4Url;
                            preview.play().catch(() => {});
                        }
                    });
                }
            } else if (preview.canPlayType('application/vnd.apple.mpegurl')) {
                // Native HLS support (Safari/iOS)
                if (!preview.src || !preview.src.includes('hls')) {
                    preview.src = hlsUrl;
                }
                preview.onerror = () => {
                    legacyMp4Cache.add(videoId);
                    preview.src = mp4Url;
                    preview.play().catch(() => {});
                };
            } else {
                // Direct stream fallback
                if (!preview.src) {
                    preview.src = mp4Url;
                }
            }

            preview.play().catch(e => {
                // If autoplay was blocked or source threw NotSupportedError, fallback cleanly without console spam
                if (e.name === 'NotSupportedError' && !preview.src.includes('/stream')) {
                    legacyMp4Cache.add(videoId);
                    if (hlsInstance) {
                        hlsInstance.destroy();
                        hlsInstance = null;
                    }
                    preview.src = mp4Url;
                    preview.play().catch(() => {});
                }
            });
        }, 500);
    });

    card.addEventListener('mouseleave', () => {
        clearTimeout(hoverTimer);
        const preview = card.querySelector('.video-preview');
        const img = card.querySelector('.thumbnail-img');
        if (preview) {
            preview.onplaying = null;
            preview.onerror = null;
            preview.pause();
            preview.currentTime = 0;
            preview.removeAttribute('src');
            preview.load(); // Reset decoder state
            preview.style.opacity = '0';
        }
        if (hlsInstance) {
            hlsInstance.destroy();
            hlsInstance = null;
        }
        if (img) img.style.opacity = '1';
    });
}
