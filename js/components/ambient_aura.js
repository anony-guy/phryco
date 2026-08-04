/**
 * Phryco Ambient Aura Module
 * Enforces separation of concerns by isolating the real-time background canvas video sampling
 * without adding complexity or lines to the main video streaming handler.
 */

export function initAmbientAura(playerEl) {
    if (!playerEl) return;
    
    // Check if wrapper exists, if not, wrap the video container
    let wrapper = document.querySelector('.player-aura-wrapper');
    const container = playerEl.closest('.video-player-container');
    
    if (!container) return;

    if (!wrapper && container.parentNode) {
        wrapper = document.createElement('div');
        wrapper.className = 'player-aura-wrapper';
        container.parentNode.insertBefore(wrapper, container);
        wrapper.appendChild(container);
    }
    
    // Create background canvas if not exists
    let canvas = wrapper.querySelector('.ambient-aura-canvas');
    if (!canvas) {
        canvas = document.createElement('canvas');
        canvas.className = 'ambient-aura-canvas';
        // Small dimensions for maximum rendering efficiency & natural blur
        canvas.width = 48;
        canvas.height = 27;
        wrapper.insertBefore(canvas, container);
    }
    
    const ctx = canvas.getContext('2d', { alpha: false });
    let animId = null;
    let lastRenderTime = 0;

    function sampleFrame(timestamp) {
        if (playerEl.paused || playerEl.ended) {
            animId = null;
            return;
        }

        // Throttle sampling to ~15fps (every 66ms) to conserve CPU/GPU
        if (timestamp - lastRenderTime >= 66) {
            try {
                if (playerEl.readyState >= 2 && playerEl.videoWidth > 0) {
                    ctx.drawImage(playerEl, 0, 0, canvas.width, canvas.height);
                }
            } catch (e) {
                // Cross-origin or stream decoding block, abort gracefully
            }
            lastRenderTime = timestamp;
        }

        animId = requestAnimationFrame(sampleFrame);
    }

    playerEl.addEventListener('play', () => {
        if (!animId && document.documentElement.getAttribute('data-glow') !== 'off') {
            animId = requestAnimationFrame(sampleFrame);
        }
    });

    playerEl.addEventListener('pause', () => {
        if (animId) {
            cancelAnimationFrame(animId);
            animId = null;
        }
    });

    playerEl.addEventListener('seeked', () => {
        try {
            if (playerEl.readyState >= 2 && playerEl.videoWidth > 0) {
                ctx.drawImage(playerEl, 0, 0, canvas.width, canvas.height);
            }
        } catch (e) {
            // Ignore seek sample error
        }
    });
}
