/**
 * Phryco Design System - Safe Universal Agentic Browser (agentic_browser.js)
 * Provides an isolated, sandboxed AI Agentic Web Assistant for link research and summarization.
 */

import { apiFetch } from '../api/client.js';
import { escapeHTML } from '../utils/security.js';

export function initAgenticBrowserUI() {
    if (typeof document === 'undefined') return;

    // Inject styles
    if (!document.getElementById('agentic-browser-styles')) {
        const style = document.createElement('style');
        style.id = 'agentic-browser-styles';
        style.textContent = `
            .agentic-fab {
                position: fixed;
                bottom: 24px;
                right: 24px;
                z-index: 99990;
                background: linear-gradient(135deg, #6366f1, #8b5cf6);
                color: #ffffff;
                border: 1px solid rgba(255, 255, 255, 0.25);
                box-shadow: 0 10px 25px rgba(99, 102, 241, 0.4);
                border-radius: 9999px;
                padding: 0.75rem 1.25rem;
                font-weight: 700;
                font-size: 0.9rem;
                cursor: pointer;
                display: flex;
                align-items: center;
                gap: 0.5rem;
                transition: transform 0.2s ease, box-shadow 0.2s ease;
            }
            .agentic-fab:hover {
                transform: translateY(-2px) scale(1.03);
                box-shadow: 0 14px 30px rgba(99, 102, 241, 0.6);
            }
            .agentic-drawer {
                position: fixed;
                bottom: 85px;
                right: 24px;
                z-index: 99991;
                width: 380px;
                max-width: calc(100vw - 48px);
                background: linear-gradient(145deg, rgba(30, 41, 59, 0.96), rgba(15, 23, 42, 0.98));
                border: 1px solid rgba(255, 255, 255, 0.18);
                box-shadow: 0 20px 40px rgba(0,0,0,0.6), 0 0 20px rgba(99, 102, 241, 0.25);
                border-radius: 16px;
                padding: 1.25rem;
                display: none;
                flex-direction: column;
                backdrop-filter: blur(12px);
                color: #f8fafc;
                font-family: system-ui, -apple-system, sans-serif;
            }
            .agentic-drawer.active {
                display: flex;
            }
        `;
        document.head.appendChild(style);
    }

    // Inject FAB & Drawer
    let fab = document.getElementById('agentic-browser-fab');
    if (!fab) {
        fab = document.createElement('button');
        fab.id = 'agentic-browser-fab';
        fab.className = 'agentic-fab';
        fab.innerHTML = `<span>🤖 AI Agentic Browser</span>`;
        document.body.appendChild(fab);

        const drawer = document.createElement('div');
        drawer.id = 'agentic-browser-drawer';
        drawer.className = 'agentic-drawer';
        drawer.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 0.5rem;">
                <div style="font-weight: 700; font-size: 1rem; color: #a5b4fc; display: flex; align-items: center; gap: 0.4rem;">
                    <span>🛡️ Safe Sandboxed Agent</span>
                </div>
                <button id="close-agentic-drawer" style="background: none; border: none; color: #94a3b8; cursor: pointer; font-weight: bold;">✕</button>
            </div>
            <p style="font-size: 0.8rem; color: #cbd5e1; margin: 0 0 0.75rem;">
                Paste any external link below. Phryco's isolated SSRF-shielded agent will safely inspect and summarize the content.
            </p>
            <div style="display: flex; gap: 0.5rem; margin-bottom: 0.75rem;">
                <input type="url" id="agentic-url-input" placeholder="https://example.com" style="flex: 1; padding: 0.5rem 0.75rem; border-radius: 8px; border: 1px solid rgba(255,255,255,0.2); background: rgba(0,0,0,0.3); color: #fff; font-size: 0.85rem; outline: none;">
                <button id="btn-run-agentic-browse" style="padding: 0.5rem 0.85rem; background: #6366f1; color: #fff; border: none; border-radius: 8px; font-weight: 700; cursor: pointer; font-size: 0.85rem;">Browse</button>
            </div>
            <div id="agentic-output-box" style="display: none; background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; padding: 0.75rem; font-size: 0.8rem; max-height: 220px; overflow-y: auto; color: #e2e8f0; line-height: 1.4;"></div>
        `;
        document.body.appendChild(drawer);

        fab.onclick = () => drawer.classList.toggle('active');
        document.getElementById('close-agentic-drawer').onclick = () => drawer.classList.remove('active');

        document.getElementById('btn-run-agentic-browse').onclick = async () => {
            const input = document.getElementById('agentic-url-input');
            const outBox = document.getElementById('agentic-output-box');
            const targetUrl = input.value.trim();

            if (!targetUrl) return;

            outBox.style.display = 'block';
            outBox.innerHTML = `<span style="color: #a5b4fc;">⚡ Dispatching SSRF-shielded agentic browser...</span>`;

            try {
                const res = await apiFetch('/api/agentic/browse', {
                    method: 'POST',
                    body: { url: targetUrl }
                });

                outBox.innerHTML = `
                    <div style="color: #10b981; font-weight: 700; margin-bottom: 0.25rem;">[${escapeHTML(res.safety_status)}]</div>
                    <div style="font-weight: 700; color: #ffffff; margin-bottom: 0.35rem;">${escapeHTML(res.title)}</div>
                    <div style="color: #94a3b8; font-size: 0.75rem; margin-bottom: 0.5rem;">${escapeHTML(res.domain)}</div>
                    <div>${escapeHTML(res.content_snippet)}</div>
                `;
            } catch (err) {
                outBox.innerHTML = `<span style="color: #ef4444;">❌ Browse Error: ${escapeHTML(err.message || "Failed to inspect URL")}</span>`;
            }
        };
    }
}

if (typeof window !== 'undefined') {
    window.initAgenticBrowserUI = initAgenticBrowserUI;
    document.addEventListener('DOMContentLoaded', () => {
        initAgenticBrowserUI();
    });
}
