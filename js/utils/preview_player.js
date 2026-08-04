import { API_BASE_URL } from './config.js';

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

            const token = localStorage.getItem('phryco_token');
            const tokenParam = token ? `?token=${token}` : '';
            const hlsUrl = `${API_BASE_URL}/api/videos/${videoId}/hls/master.m3u8${tokenParam}`;
            const mp4Url = `${API_BASE_URL}/api/videos/${videoId}/stream${tokenParam}`;

            if (typeof Hls !== 'undefined' && Hls.isSupported()) {
                if (!hlsInstance) {
                    hlsInstance = new Hls({
                        capLevelToPlayerSize: true,
                        autoStartLoad: true
                    });
                    hlsInstance.loadSource(hlsUrl);
                    hlsInstance.attachMedia(preview);
                    hlsInstance.on(Hls.Events.ERROR, (event, data) => {
                        if (data.fatal && data.type === Hls.ErrorTypes.NETWORK_ERROR) {
                            // Fallback to standard MP4/stream if HLS master playlist not found
                            hlsInstance.destroy();
                            hlsInstance = null;
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
            } else {
                // Direct stream fallback
                if (!preview.src) {
                    preview.src = mp4Url;
                }
            }

            preview.play().then(() => {
                preview.style.opacity = '1';
                if (img) img.style.opacity = '0';
            }).catch(e => {
                // If autoplay was blocked or source threw NotSupportedError, fallback cleanly without console spam
                if (e.name === 'NotSupportedError' && !preview.src.includes('/stream')) {
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
