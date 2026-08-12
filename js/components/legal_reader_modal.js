/**
 * Phryco Design System - Legal Document Reader Modal (legal_reader_modal.js)
 * Provides pop-up modal document viewer for Terms of Service, Privacy Policy, and Ethical Source License.
 */

import { apiFetch } from '../api/client.js';

let cachedLegalDocs = null;

export async function fetchLegalDocs() {
    if (cachedLegalDocs) return cachedLegalDocs;
    try {
        cachedLegalDocs = await apiFetch('/api/legal/documents');
    } catch (e) {
        cachedLegalDocs = {
            version: "v2026.sha_default",
            tos: "# Terms of Service\n\nFailed to load Terms of Service from server.",
            privacy_policy: "# Privacy Policy\n\nFailed to load Privacy Policy from server.",
            ethical_license: "# Ethical Source License\n\nFailed to load Ethical Source License from server."
        };
    }
    return cachedLegalDocs;
}

export async function openLegalDocModal(initialDoc = 'tos') {
    if (typeof document === 'undefined') return;

    // Inject Styles
    if (!document.getElementById('legal-reader-modal-styles')) {
        const style = document.createElement('style');
        style.id = 'legal-reader-modal-styles';
        style.textContent = `
            .legal-reader-overlay {
                position: fixed;
                inset: 0;
                z-index: 9999999;
                background: rgba(15, 23, 42, 0.9);
                backdrop-filter: blur(14px);
                display: flex;
                align-items: center;
                justify-content: center;
                padding: 1.5rem;
                opacity: 0;
                pointer-events: none;
                transition: opacity 0.25s ease;
            }
            .legal-reader-overlay.active {
                opacity: 1;
                pointer-events: auto;
            }
            .legal-reader-card {
                background: linear-gradient(145deg, rgba(30, 41, 59, 0.98), rgba(15, 23, 42, 0.99));
                border: 1px solid rgba(99, 102, 241, 0.35);
                box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.8), 0 0 35px rgba(99, 102, 241, 0.2);
                border-radius: 20px;
                padding: 2rem;
                max-width: 680px;
                width: 100%;
                color: #f8fafc;
                font-family: system-ui, -apple-system, sans-serif;
                transform: scale(0.94);
                transition: transform 0.25s ease;
                max-height: 88vh;
                display: flex;
                flex-direction: column;
            }
            .legal-reader-overlay.active .legal-reader-card {
                transform: scale(1);
            }
            .legal-reader-tab {
                padding: 0.5rem 1rem;
                border-radius: 8px;
                background: rgba(255, 255, 255, 0.06);
                border: 1px solid rgba(255, 255, 255, 0.12);
                color: #cbd5e1;
                font-weight: 600;
                font-size: 0.85rem;
                cursor: pointer;
                transition: all 0.2s ease;
            }
            .legal-reader-tab.active {
                background: #6366f1;
                border-color: #6366f1;
                color: #ffffff;
                box-shadow: 0 0 12px rgba(99, 102, 241, 0.4);
            }
            .legal-reader-btn-close {
                background: rgba(255, 255, 255, 0.1);
                color: #ffffff;
                border: 1px solid rgba(255, 255, 255, 0.2);
                padding: 0.65rem 1.5rem;
                border-radius: 9999px;
                font-weight: 700;
                cursor: pointer;
                transition: all 0.2s ease;
            }
            .legal-reader-btn-close:hover {
                background: #6366f1;
                border-color: #6366f1;
            }
        `;
        document.head.appendChild(style);
    }

    const docs = await fetchLegalDocs();

    let overlay = document.getElementById('legal-reader-modal-overlay');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'legal-reader-modal-overlay';
        overlay.className = 'legal-reader-overlay';
        overlay.innerHTML = `
            <div class="legal-reader-card">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                    <div style="display: flex; align-items: center; gap: 0.6rem;">
                        <span style="font-size: 1.5rem;">📜</span>
                        <h2 id="legal-reader-title" style="margin: 0; font-size: 1.35rem; font-weight: 800; color: #ffffff;">Platform Legal Agreement</h2>
                    </div>
                    <button id="legal-reader-x-btn" style="background: none; border: none; color: #94a3b8; font-size: 1.3rem; cursor: pointer; padding: 0.25rem 0.5rem;">✕</button>
                </div>

                <div style="display: flex; gap: 0.5rem; margin-bottom: 1rem;">
                    <button class="legal-reader-tab" data-tab="tos">Terms of Service</button>
                    <button class="legal-reader-tab" data-tab="privacy">Privacy Policy</button>
                    <button class="legal-reader-tab" data-tab="license">Ethical License</button>
                </div>

                <!-- Document Content Viewport -->
                <div id="legal-reader-body" style="flex: 1; background: rgba(0, 0, 0, 0.4); border: 1px solid rgba(255, 255, 255, 0.12); border-radius: 12px; padding: 1.25rem; overflow-y: auto; font-size: 0.88rem; color: #e2e8f0; line-height: 1.6; white-space: pre-wrap; margin-bottom: 1.25rem;"></div>

                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <span id="legal-reader-version-tag" style="font-size: 0.78rem; color: #64748b; font-family: monospace;">Version: ${docs.version}</span>
                    <button id="legal-reader-close-btn" class="legal-reader-btn-close">Close Document</button>
                </div>
            </div>
        `;
        document.body.appendChild(overlay);

        const closeFn = () => overlay.classList.remove('active');
        document.getElementById('legal-reader-x-btn').onclick = closeFn;
        document.getElementById('legal-reader-close-btn').onclick = closeFn;
        overlay.onclick = (e) => { if (e.target === overlay) closeFn(); };
    }

    const tabs = overlay.querySelectorAll('.legal-reader-tab');
    const titleEl = document.getElementById('legal-reader-title');
    const bodyEl = document.getElementById('legal-reader-body');

    const renderTab = (tabName) => {
        tabs.forEach(t => {
            if (t.getAttribute('data-tab') === tabName) t.classList.add('active');
            else t.classList.remove('active');
        });

        if (tabName === 'privacy') {
            titleEl.textContent = "Phryco Privacy Policy";
            bodyEl.innerHTML = docs.privacy_policy;
        } else if (tabName === 'license') {
            titleEl.textContent = "Phryco Ethical Source License";
            bodyEl.innerHTML = docs.ethical_license;
        } else {
            titleEl.textContent = "Phryco Terms of Service";
            bodyEl.innerHTML = docs.tos;
        }
    };

    tabs.forEach(tab => {
        tab.onclick = () => renderTab(tab.getAttribute('data-tab'));
    });

    renderTab(initialDoc);
    overlay.classList.add('active');
}

export function initLegalDocTriggers() {
    if (typeof document === 'undefined') return;
    document.addEventListener('click', (e) => {
        const target = e.target.closest('.legal-doc-trigger, [data-doc]');
        if (target) {
            e.preventDefault();
            const docKey = target.getAttribute('data-doc') || 'tos';
            openLegalDocModal(docKey);
        }
    });
}

if (typeof window !== 'undefined') {
    window.openLegalDocModal = openLegalDocModal;
    window.initLegalDocTriggers = initLegalDocTriggers;
    document.addEventListener('DOMContentLoaded', () => {
        initLegalDocTriggers();
    });
}
