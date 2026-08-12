/**
 * Phryco Design System - Legal Re-Agreement Modal (legal_reagreement_modal.js)
 * Enforces mandatory acceptance of updated ToS, Privacy Policy, and Ethical Source License.
 * Prompts existing users to re-agree when terms update, or proceed with account deletion upon decline.
 */

import { apiFetch } from '../api/client.js';

export async function checkAndPromptLegalReagreement(userData) {
    if (!userData || !userData.legal_reagreement_required) return;

    if (typeof document === 'undefined') return;

    // Inject Styles
    if (!document.getElementById('legal-reagreement-styles')) {
        const style = document.createElement('style');
        style.id = 'legal-reagreement-styles';
        style.textContent = `
            .legal-reagree-overlay {
                position: fixed;
                inset: 0;
                z-index: 9999999;
                background: rgba(15, 23, 42, 0.94);
                backdrop-filter: blur(16px);
                display: flex;
                align-items: center;
                justify-content: center;
                padding: 1.5rem;
            }
            .legal-reagree-card {
                background: linear-gradient(145deg, rgba(30, 41, 59, 0.98), rgba(15, 23, 42, 0.99));
                border: 1px solid rgba(239, 68, 68, 0.4);
                box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.8), 0 0 35px rgba(239, 68, 68, 0.2);
                border-radius: 20px;
                padding: 2.25rem;
                max-width: 640px;
                width: 100%;
                color: #f8fafc;
                font-family: system-ui, -apple-system, sans-serif;
            }
            .legal-tab-btn {
                padding: 0.5rem 1rem;
                border-radius: 8px;
                background: rgba(255, 255, 255, 0.08);
                border: 1px solid rgba(255, 255, 255, 0.15);
                color: #cbd5e1;
                font-weight: 600;
                font-size: 0.85rem;
                cursor: pointer;
            }
            .legal-tab-btn.active {
                background: #6366f1;
                border-color: #6366f1;
                color: #ffffff;
            }
        `;
        document.head.appendChild(style);
    }

    // Fetch Legal Documents
    let docs = { version: "2026.1.0", tos: "", privacy_policy: "", ethical_license: "" };
    try {
        docs = await apiFetch('/api/legal/documents');
    } catch (e) {
        console.warn("Failed to fetch legal documents:", e);
    }

    let overlay = document.getElementById('legal-reagreement-overlay');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'legal-reagreement-overlay';
        overlay.className = 'legal-reagree-overlay';
        overlay.innerHTML = `
            <div class="legal-reagree-card">
                <div style="display: flex; align-items: center; gap: 0.75rem; margin-bottom: 0.75rem;">
                    <span style="font-size: 1.8rem;">📜</span>
                    <div>
                        <h2 style="margin: 0; font-size: 1.4rem; font-weight: 800; color: #ffffff;">Updated Legal Terms Required</h2>
                        <div style="font-size: 0.82rem; color: #ef4444; font-weight: 600;">Action Required: Version ${docs.version}</div>
                    </div>
                </div>
                <p style="color: #cbd5e1; font-size: 0.9rem; line-height: 1.5; margin: 0 0 1.25rem;">
                    Phryco has updated its <strong>Terms of Service</strong>, <strong>Privacy Policy</strong>, and <strong>Ethical Source License</strong>. To continue using Phryco, you must read and accept the updated terms. If you decline, your account will be deleted per system policy.
                </p>

                <!-- Document Tabs -->
                <div style="display: flex; gap: 0.5rem; margin-bottom: 0.75rem;">
                    <button class="legal-tab-btn active" data-tab="tos">Terms of Service</button>
                    <button class="legal-tab-btn" data-tab="privacy">Privacy Policy</button>
                    <button class="legal-tab-btn" data-tab="license">Ethical License</button>
                </div>

                <!-- Text Display Box -->
                <div id="legal-doc-content-box" style="background: rgba(0,0,0,0.4); border: 1px solid rgba(255,255,255,0.12); border-radius: 12px; padding: 1rem; height: 180px; overflow-y: auto; font-size: 0.85rem; color: #e2e8f0; line-height: 1.5; white-space: pre-wrap; margin-bottom: 1.5rem;">${docs.tos}</div>

                <div style="display: flex; gap: 0.75rem;">
                    <button id="btn-accept-updated-legal" style="flex: 1; padding: 0.85rem 1.25rem; background: linear-gradient(135deg, #10b981, #059669); color: #ffffff; border: none; border-radius: 12px; font-weight: 800; font-size: 0.95rem; cursor: pointer; box-shadow: 0 4px 14px rgba(16, 185, 129, 0.4);">
                        I Agree & Accept Terms
                    </button>
                    <button id="btn-decline-updated-legal" style="padding: 0.85rem 1.25rem; background: rgba(239, 68, 68, 0.15); color: #ef4444; border: 1px solid rgba(239, 68, 68, 0.4); border-radius: 12px; font-weight: 700; font-size: 0.9rem; cursor: pointer;">
                        I Decline (Delete Account)
                    </button>
                </div>
            </div>
        `;
        document.body.appendChild(overlay);

        // Tab Switching
        const tabs = overlay.querySelectorAll('.legal-tab-btn');
        const contentBox = document.getElementById('legal-doc-content-box');
        tabs.forEach(tab => {
            tab.onclick = () => {
                tabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                const target = tab.getAttribute('data-tab');
                if (target === 'tos') contentBox.innerHTML = docs.tos;
                else if (target === 'privacy') contentBox.innerHTML = docs.privacy_policy;
                else if (target === 'license') contentBox.innerHTML = docs.ethical_license;
            };
        });

        // Accept Handler
        document.getElementById('btn-accept-updated-legal').onclick = async () => {
            try {
                await apiFetch('/api/legal/accept', { method: 'POST' });
                overlay.remove();
                window.location.reload();
            } catch (err) {
                alert("Failed to update agreement status: " + err.message);
            }
        };

        // Decline Handler
        document.getElementById('btn-decline-updated-legal').onclick = async () => {
            if (confirm("ARE YOU SURE?\nDeclining the updated legal terms will PERMANENTLY DELETE your Phryco account and balance. This action cannot be undone.")) {
                try {
                    await apiFetch('/api/legal/decline', { method: 'POST' });
                    localStorage.clear();
                    alert("Your account has been deleted as requested.");
                    window.location.href = '/pages/login/';
                } catch (err) {
                    alert("Account deletion failed: " + err.message);
                }
            }
        };
    }
}

if (typeof window !== 'undefined') {
    window.checkAndPromptLegalReagreement = checkAndPromptLegalReagreement;
}
