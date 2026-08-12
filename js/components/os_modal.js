/**
 * Phryco Design System - Open Source Transparency Modal (os_modal.js)
 * Displays an interactive modal informing users about Phryco's open-source architecture on GitHub.
 */

export function initOpenSourceModal() {
    if (typeof document === 'undefined') return;

    // 1. Inject CSS if not present
    if (!document.getElementById('phryco-os-modal-styles')) {
        const style = document.createElement('style');
        style.id = 'phryco-os-modal-styles';
        style.textContent = `
            .os-modal-overlay {
                position: fixed;
                inset: 0;
                z-index: 999999;
                background: rgba(15, 23, 42, 0.82);
                backdrop-filter: blur(12px);
                display: flex;
                align-items: center;
                justify-content: center;
                padding: 1.5rem;
                opacity: 0;
                pointer-events: none;
                transition: opacity 0.3s cubic-bezier(0.16, 1, 0.3, 1);
            }
            .os-modal-overlay.active {
                opacity: 1;
                pointer-events: auto;
            }
            .os-modal-card {
                background: linear-gradient(145deg, rgba(30, 41, 59, 0.95), rgba(15, 23, 42, 0.98));
                border: 1px solid rgba(255, 255, 255, 0.15);
                box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.7), 0 0 30px rgba(99, 102, 241, 0.2);
                border-radius: 20px;
                padding: 2.25rem;
                max-width: 520px;
                width: 100%;
                text-align: center;
                transform: scale(0.92) translateY(10px);
                transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);
                color: #f8fafc;
                font-family: system-ui, -apple-system, sans-serif;
            }
            .os-modal-overlay.active .os-modal-card {
                transform: scale(1) translateY(0);
            }
            .github-banner-card {
                display: block;
                background: rgba(255, 255, 255, 0.05);
                border: 1px solid rgba(255, 255, 255, 0.18);
                border-radius: 14px;
                padding: 1.25rem;
                margin: 1.5rem 0;
                text-decoration: none;
                color: #ffffff;
                transition: all 0.2s ease;
            }
            .github-banner-card:hover {
                background: rgba(255, 255, 255, 0.12);
                border-color: rgba(99, 102, 241, 0.5);
                transform: translateY(-2px);
                box-shadow: 0 10px 25px rgba(0, 0, 0, 0.3), 0 0 15px rgba(99, 102, 241, 0.25);
            }
            .github-brand-img {
                width: 72px;
                height: 72px;
                border-radius: 50%;
                margin: 0 auto 0.75rem;
                display: block;
                box-shadow: 0 0 16px rgba(255, 255, 255, 0.2);
            }
        `;
        document.head.appendChild(style);
    }

    // 2. Inject Modal Element if not present
    let overlay = document.getElementById('phryco-os-modal');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'phryco-os-modal';
        overlay.className = 'os-modal-overlay';
        overlay.innerHTML = `
            <div class="os-modal-card">
                <div style="display: flex; align-items: center; justify-content: center; gap: 0.75rem; margin-bottom: 0.5rem;">
                    <span style="font-size: 1.75rem;">🛡️</span>
                    <h2 style="margin: 0; font-size: 1.6rem; font-weight: 800; background: linear-gradient(135deg, #ffffff, #cbd5e1); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">Experimental & Open Source</h2>
                </div>
                <p style="color: #94a3b8; font-size: 0.95rem; line-height: 1.5; margin: 0 0 1.25rem;">
                    Phryco is an experimental video streaming platform under active development. Our entire codebase is 100% open-source on GitHub!
                </p>

                <a href="https://github.com/anony-guy/phryco" target="_blank" rel="noopener noreferrer" class="github-banner-card">
                    <img src="https://miro.medium.com/1*dDNpLKu_oTLzStsDTnkJ-g.png" alt="GitHub Repository" class="github-brand-img">
                    <div style="font-weight: 700; font-size: 1.1rem; margin-bottom: 0.25rem; color: #6366f1;">anony-guy/phryco</div>
                    <div style="font-size: 0.85rem; color: #cbd5e1;">Click to inspect code, commit history & contribute on GitHub</div>
                </a>

                <div style="display: flex; gap: 0.75rem; justify-content: center; margin-top: 1.5rem;">
                    <a href="https://github.com/anony-guy/phryco" target="_blank" rel="noopener noreferrer" style="flex: 1; padding: 0.75rem 1.25rem; background: linear-gradient(135deg, #6366f1, #4f46e5); color: #ffffff; border-radius: 12px; font-weight: 700; text-decoration: none; font-size: 0.95rem; display: inline-flex; align-items: center; justify-content: center; gap: 0.5rem; box-shadow: 0 4px 14px rgba(99, 102, 241, 0.4);">
                        <span>View Repository</span>
                        <span>➔</span>
                    </a>
                    <button id="close-os-modal-btn" style="padding: 0.75rem 1.5rem; background: rgba(255, 255, 255, 0.1); color: #f8fafc; border: 1px solid rgba(255, 255, 255, 0.2); border-radius: 12px; font-weight: 600; cursor: pointer; font-size: 0.95rem;">
                        Close
                    </button>
                </div>
            </div>
        `;
        document.body.appendChild(overlay);

        document.getElementById('close-os-modal-btn').addEventListener('click', () => {
            overlay.classList.remove('active');
        });

        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                overlay.classList.remove('active');
            }
        });
    }

    // 3. Attach click handler to all .github-os-badge buttons
    const osBadges = document.querySelectorAll('.github-os-badge');
    osBadges.forEach(badge => {
        badge.onclick = (e) => {
            e.preventDefault();
            overlay.classList.add('active');
        };
    });
}

if (typeof window !== 'undefined') {
    window.initOpenSourceModal = initOpenSourceModal;
    document.addEventListener('DOMContentLoaded', () => {
        initOpenSourceModal();
    });
}
