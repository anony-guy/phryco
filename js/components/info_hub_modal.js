/**
 * Phryco Design System - Info & Security Hub Modal Component (info_hub_modal.js)
 * Provides an interactive modal with search, Open Source GitHub view, and Security Verification reports.
 */

export function initInfoHubModal() {
    if (typeof document === 'undefined') return;

    // 1. Inject Styles
    if (!document.getElementById('phryco-info-hub-styles')) {
        const style = document.createElement('style');
        style.id = 'phryco-info-hub-styles';
        style.textContent = `
            .hub-modal-overlay {
                position: fixed;
                inset: 0;
                z-index: 999999;
                background: rgba(15, 23, 42, 0.85);
                backdrop-filter: blur(12px);
                display: flex;
                align-items: center;
                justify-content: center;
                padding: 1.5rem;
                opacity: 0;
                pointer-events: none;
                transition: opacity 0.3s cubic-bezier(0.16, 1, 0.3, 1);
            }
            .hub-modal-overlay.active {
                opacity: 1;
                pointer-events: auto;
            }
            .hub-modal-card {
                background: linear-gradient(145deg, rgba(30, 41, 59, 0.96), rgba(15, 23, 42, 0.98));
                border: 1px solid rgba(255, 255, 255, 0.15);
                box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.7), 0 0 35px rgba(99, 102, 241, 0.25);
                border-radius: 20px;
                padding: 2rem;
                max-width: 580px;
                width: 100%;
                color: #f8fafc;
                font-family: system-ui, -apple-system, sans-serif;
                transform: scale(0.92) translateY(10px);
                transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);
                max-height: 90vh;
                overflow-y: auto;
            }
            .hub-modal-overlay.active .hub-modal-card {
                transform: scale(1) translateY(0);
            }
            .hub-btn-pill {
                padding: 0.65rem 1.25rem;
                border-radius: 9999px;
                font-weight: 700;
                font-size: 0.9rem;
                cursor: pointer;
                border: 1px solid rgba(255, 255, 255, 0.2);
                display: inline-flex;
                align-items: center;
                justify-content: center;
                gap: 0.5rem;
                transition: all 0.2s ease;
                text-decoration: none;
            }
            .hub-btn-os {
                background: rgba(255, 255, 255, 0.08);
                color: #ffffff;
                border-color: rgba(255, 255, 255, 0.25);
            }
            .hub-btn-os:hover {
                background: rgba(255, 255, 255, 0.18);
                border-color: #ffffff;
                transform: translateY(-2px);
                box-shadow: 0 6px 16px rgba(255, 255, 255, 0.2);
            }
            .hub-btn-secure {
                background: linear-gradient(135deg, rgba(16, 185, 129, 0.2), rgba(5, 150, 105, 0.2));
                color: #34d399;
                border-color: rgba(16, 185, 129, 0.4);
                box-shadow: 0 0 14px rgba(16, 185, 129, 0.2);
            }
            .hub-btn-secure:hover {
                background: linear-gradient(135deg, rgba(16, 185, 129, 0.35), rgba(5, 150, 105, 0.35));
                border-color: rgba(16, 185, 129, 0.7);
                transform: translateY(-2px);
                box-shadow: 0 0 22px rgba(16, 185, 129, 0.4);
                color: #ffffff;
            }
            .brand-verification-card {
                display: flex;
                align-items: center;
                gap: 1.25rem;
                background: rgba(255, 255, 255, 0.04);
                border: 1px solid rgba(255, 255, 255, 0.12);
                border-radius: 14px;
                padding: 1rem 1.25rem;
                margin-bottom: 1rem;
                text-decoration: none;
                color: #ffffff;
                transition: all 0.2s ease;
            }
            .brand-verification-card:hover {
                background: rgba(255, 255, 255, 0.1);
                border-color: rgba(16, 185, 129, 0.5);
                transform: translateY(-2px);
                box-shadow: 0 8px 20px rgba(0, 0, 0, 0.4), 0 0 15px rgba(16, 185, 129, 0.25);
            }
            .brand-logo-img {
                width: 52px;
                height: 52px;
                object-fit: contain;
                border-radius: 10px;
                background: #ffffff;
                padding: 6px;
                flex-shrink: 0;
            }
        `;
        document.head.appendChild(style);
    }

    // 2. Create Main Info Hub Modal Element
    let mainModal = document.getElementById('phryco-info-hub-modal');
    if (!mainModal) {
        mainModal = document.createElement('div');
        mainModal.id = 'phryco-info-hub-modal';
        mainModal.className = 'hub-modal-overlay';
        mainModal.innerHTML = `
            <div class="hub-modal-card">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                    <div style="display: flex; align-items: center; gap: 0.6rem;">
                        <span style="font-size: 1.5rem;">ℹ️</span>
                        <h2 style="margin: 0; font-size: 1.4rem; font-weight: 800; color: #ffffff;">Phryco Platform & Security Hub</h2>
                    </div>
                    <button id="close-info-hub-btn" style="background: none; border: none; color: #94a3b8; font-size: 1.2rem; cursor: pointer; padding: 0.25rem 0.5rem;">✕</button>
                </div>

                <!-- Live Search Bar -->
                <div style="position: relative; margin-bottom: 1.25rem;">
                    <input type="text" id="info-hub-search-input" placeholder="Search features, documentation, security..." style="width: 100%; padding: 0.75rem 1rem; border-radius: 12px; border: 1px solid rgba(255, 255, 255, 0.2); background: rgba(0, 0, 0, 0.35); color: #ffffff; font-size: 0.9rem; outline: none;">
                </div>

                <!-- Quick Action Buttons -->
                <div style="display: flex; gap: 0.75rem; margin-bottom: 1.5rem;">
                    <button id="btn-trigger-open-source" class="hub-btn-pill hub-btn-os" style="flex: 1;">
                        <img src="https://miro.medium.com/1*dDNpLKu_oTLzStsDTnkJ-g.png" alt="GitHub Logo" style="width: 18px; height: 18px; border-radius: 50%;">
                        <span>Open Source</span>
                    </button>
                    <button id="btn-trigger-secure" class="hub-btn-pill hub-btn-secure" style="flex: 1;">
                        <span>🛡️</span>
                        <span>Secure Verification</span>
                    </button>
                </div>

                <!-- Dynamic Search Topics -->
                <div id="info-hub-topics-container" style="display: flex; flex-direction: column; gap: 0.75rem;">
                    <div class="topic-item" data-keywords="open source github code repository experimental" style="background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); border-radius: 12px; padding: 0.85rem 1rem;">
                        <div style="font-weight: 700; color: #6366f1; margin-bottom: 0.25rem;">Open Source Codebase</div>
                        <div style="font-size: 0.85rem; color: #cbd5e1;">100% open-source under active development. Inspect models, routes, and Rust edge nodes on GitHub.</div>
                    </div>
                    <div class="topic-item" data-keywords="secure verifications virustotal metadefender clean scan" style="background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); border-radius: 12px; padding: 0.85rem 1rem;">
                        <div style="font-weight: 700; color: #34d399; margin-bottom: 0.25rem;">Verified Anti-Malware Clean</div>
                        <div style="font-size: 0.85rem; color: #cbd5e1;">Independently scanned and verified 100% clean by VirusTotal and OPSWAT MetaDefender Cloud.</div>
                    </div>
                    <div class="topic-item" data-keywords="zero trust dbsc e2ee security wasm vaultguard" style="background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); border-radius: 12px; padding: 0.85rem 1rem;">
                        <div style="font-weight: 700; color: #3b82f6; margin-bottom: 0.25rem;">Hardware DBSC & E2EE Privacy</div>
                        <div style="font-size: 0.85rem; color: #cbd5e1;">Device-bound ECDSA P-256 signatures, VaultGuard WASM DOM protection, and AES-GCM payload encryption.</div>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(mainModal);

        // Search Filter Logic
        const searchInput = document.getElementById('info-hub-search-input');
        searchInput.addEventListener('input', (e) => {
            const query = e.target.value.toLowerCase().trim();
            const topics = document.querySelectorAll('.topic-item');
            topics.forEach(t => {
                const kw = t.getAttribute('data-keywords') || '';
                if (!query || kw.includes(query) || t.textContent.toLowerCase().includes(query)) {
                    t.style.display = 'block';
                } else {
                    t.style.display = 'none';
                }
            });
        });

        document.getElementById('close-info-hub-btn').addEventListener('click', () => {
            mainModal.classList.remove('active');
        });
        mainModal.addEventListener('click', (e) => {
            if (e.target === mainModal) mainModal.classList.remove('active');
        });
    }

    // 3. Create Open Source Modal Element
    let osModal = document.getElementById('phryco-os-sub-modal');
    if (!osModal) {
        osModal = document.createElement('div');
        osModal.id = 'phryco-os-sub-modal';
        osModal.className = 'hub-modal-overlay';
        osModal.innerHTML = `
            <div class="hub-modal-card" style="text-align: center; max-width: 500px;">
                <div style="display: flex; align-items: center; justify-content: center; gap: 0.5rem; margin-bottom: 0.5rem;">
                    <img src="https://miro.medium.com/1*dDNpLKu_oTLzStsDTnkJ-g.png" alt="GitHub Logo" style="width: 32px; height: 32px; border-radius: 50%;">
                    <h2 style="margin: 0; font-size: 1.5rem; font-weight: 800; color: #ffffff;">Phryco Open Source</h2>
                </div>
                <p style="color: #94a3b8; font-size: 0.9rem; margin-bottom: 1.25rem;">
                    Phryco is an experimental open-source video streaming & community platform hosted on GitHub.
                </p>

                <a href="https://github.com/anony-guy/phryco" target="_blank" rel="noopener noreferrer" class="brand-verification-card" style="justify-content: center; flex-direction: column; text-align: center; padding: 1.5rem; background: rgba(99, 102, 241, 0.08); border-color: rgba(99, 102, 241, 0.3);">
                    <img src="https://miro.medium.com/1*dDNpLKu_oTLzStsDTnkJ-g.png" alt="GitHub Repository" style="width: 64px; height: 64px; border-radius: 50%; box-shadow: 0 0 16px rgba(255,255,255,0.2);">
                    <div style="font-weight: 800; font-size: 1.2rem; color: #6366f1; margin-top: 0.5rem;">anony-guy/phryco</div>
                    <div style="font-size: 0.85rem; color: #cbd5e1; margin-top: 0.25rem;">Click to inspect source code & commit trajectory</div>
                </a>

                <div style="display: flex; gap: 0.75rem; margin-top: 1.25rem;">
                    <a href="https://github.com/anony-guy/phryco" target="_blank" rel="noopener noreferrer" class="hub-btn-pill hub-btn-os" style="flex: 1; background: #6366f1; border-color: #6366f1;">
                        <span>View Repository</span>
                        <span>➔</span>
                    </a>
                    <button id="close-os-sub-btn" class="hub-btn-pill" style="background: rgba(255,255,255,0.1); color: #fff;">Close</button>
                </div>
            </div>
        `;
        document.body.appendChild(osModal);

        document.getElementById('close-os-sub-btn').onclick = () => osModal.classList.remove('active');
        osModal.onclick = (e) => { if (e.target === osModal) osModal.classList.remove('active'); };
    }

    // 4. Create Security Verification Modal Element
    let secureModal = document.getElementById('phryco-secure-modal');
    if (!secureModal) {
        secureModal = document.createElement('div');
        secureModal.id = 'phryco-secure-modal';
        secureModal.className = 'hub-modal-overlay';
        secureModal.innerHTML = `
            <div class="hub-modal-card" style="max-width: 540px;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem;">
                    <div style="display: flex; align-items: center; gap: 0.6rem;">
                        <span style="font-size: 1.6rem;">🛡️</span>
                        <h2 style="margin: 0; font-size: 1.4rem; font-weight: 800; color: #34d399;">Verified Clean & Secure</h2>
                    </div>
                    <button id="close-secure-modal-btn" style="background: none; border: none; color: #94a3b8; font-size: 1.2rem; cursor: pointer;">✕</button>
                </div>
                <p style="color: #cbd5e1; font-size: 0.88rem; line-height: 1.5; margin: 0 0 1.25rem;">
                    Phryco's domain, binary assets, and WASM engines have been independently scanned and verified 100% clean by leading security providers:
                </p>

                <!-- Clickable VirusTotal Brand Card -->
                <a href="https://www.virustotal.com/gui/url/18982104ae09ed05cc8e3cc2f8ab4aee367a10bd65e6c1ed28b9651e91f93026?nocache=1" target="_blank" rel="noopener noreferrer" class="brand-verification-card">
                    <img src="https://upload.wikimedia.org/wikipedia/commons/e/e0/Virustotal_logo_pixelalign.png" alt="VirusTotal Brand" class="brand-logo-img">
                    <div style="flex: 1;">
                        <div style="font-weight: 800; font-size: 1.05rem; color: #ffffff; display: flex; justify-content: space-between; align-items: center;">
                            <span>VirusTotal Verification</span>
                            <span style="font-size: 0.75rem; background: rgba(16, 185, 129, 0.2); color: #34d399; padding: 2px 8px; border-radius: 999px; border: 1px solid rgba(16, 185, 129, 0.4);">0 / 90 Clean</span>
                        </div>
                        <div style="font-size: 0.82rem; color: #94a3b8; margin-top: 0.25rem;">Click to view live VirusTotal URL & security analysis report</div>
                    </div>
                </a>

                <!-- Clickable MetaDefender Cloud Brand Card -->
                <a href="https://metadefender.com/results/file/bzI2MDgxMnNmeVJhdnUwRjE0d1ZMREpkZzFU_mdaas/overview" target="_blank" rel="noopener noreferrer" class="brand-verification-card">
                    <img src="https://metadefender.com/Cloud-logo-black.png" alt="OPSWAT MetaDefender Cloud" class="brand-logo-img">
                    <div style="flex: 1;">
                        <div style="font-weight: 800; font-size: 1.05rem; color: #ffffff; display: flex; justify-content: space-between; align-items: center;">
                            <span>MetaDefender Cloud</span>
                            <span style="font-size: 0.75rem; background: rgba(16, 185, 129, 0.2); color: #34d399; padding: 2px 8px; border-radius: 999px; border: 1px solid rgba(16, 185, 129, 0.4);">0 / 35 Clean</span>
                        </div>
                        <div style="font-size: 0.82rem; color: #94a3b8; margin-top: 0.25rem;">Click to view OPSWAT multi-engine malware analysis report</div>
                    </div>
                </a>

                <div style="text-align: right; margin-top: 1rem;">
                    <button id="btn-close-secure" class="hub-btn-pill" style="background: rgba(255,255,255,0.1); color: #fff;">Close</button>
                </div>
            </div>
        `;
        document.body.appendChild(secureModal);

        document.getElementById('close-secure-modal-btn').onclick = () => secureModal.classList.remove('active');
        document.getElementById('btn-close-secure').onclick = () => secureModal.classList.remove('active');
        secureModal.onclick = (e) => { if (e.target === secureModal) secureModal.classList.remove('active'); };
    }

    // Modal Trigger Connections
    const btnOpenSource = document.getElementById('btn-trigger-open-source');
    if (btnOpenSource) {
        btnOpenSource.onclick = () => {
            mainModal.classList.remove('active');
            osModal.classList.add('active');
        };
    }

    const btnSecure = document.getElementById('btn-trigger-secure');
    if (btnSecure) {
        btnSecure.onclick = () => {
            mainModal.classList.remove('active');
            secureModal.classList.add('active');
        };
    }

    // Attach Click Handlers to all .info-hub-badge buttons
    const infoButtons = document.querySelectorAll('.info-hub-badge, #info-hub-btn');
    infoButtons.forEach(btn => {
        btn.onclick = (e) => {
            e.preventDefault();
            mainModal.classList.add('active');
        };
    });
}

if (typeof window !== 'undefined') {
    window.initInfoHubModal = initInfoHubModal;
    document.addEventListener('DOMContentLoaded', () => {
        initInfoHubModal();
    });
}
