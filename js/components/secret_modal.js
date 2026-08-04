/**
 * Custom modern modal component for safely viewing and copying OAuth client secrets.
 * Replaces cumbersome browser alerts with a polished, accessible clipboard interaction.
 */

let modalElement = null;

function createModalDOM() {
    const overlay = document.createElement('div');
    overlay.id = 'secret-modal-overlay';
    overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        background: rgba(15, 23, 42, 0.75);
        backdrop-filter: blur(6px);
        display: none;
        align-items: center;
        justify-content: center;
        z-index: 9999;
        opacity: 0;
        transition: opacity 0.2s cubic-bezier(0.16, 1, 0.3, 1);
        padding: 20px;
        box-sizing: border-box;
    `;

    const modal = document.createElement('div');
    modal.style.cssText = `
        background: #ffffff;
        color: #202124;
        width: 100%;
        max-width: 520px;
        border-radius: 16px;
        box-shadow: 0 24px 48px rgba(0, 0, 0, 0.25), 0 4px 12px rgba(26, 115, 232, 0.1);
        border: 1px solid #dadce0;
        overflow: hidden;
        transform: translateY(20px) scale(0.95);
        transition: transform 0.2s cubic-bezier(0.16, 1, 0.3, 1);
        font-family: "Google Sans", Roboto, Arial, sans-serif;
    `;

    modal.innerHTML = `
        <div style="background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%); color: #ffffff; padding: 24px 28px; position: relative;">
            <div style="display: flex; align-items: center; gap: 12px;">
                <span style="font-size: 24px; background: rgba(255,255,255,0.15); width: 44px; height: 44px; display: flex; align-items: center; justify-content: center; border-radius: 12px;">🔑</span>
                <div>
                    <h3 style="margin: 0; font-size: 20px; font-weight: 600; color: #ffffff;">Client Secret</h3>
                    <p style="margin: 4px 0 0 0; font-size: 13px; opacity: 0.9; color: #e2e8f0;">OAuth 2.0 Application Credentials</p>
                </div>
            </div>
            <button id="close-modal-x" style="position: absolute; top: 20px; right: 20px; background: transparent; border: none; color: #ffffff; font-size: 22px; cursor: pointer; opacity: 0.8; line-height: 1;">&times;</button>
        </div>

        <div style="padding: 28px;">
            <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 12px 16px; border-radius: 4px; margin-bottom: 24px;">
                <div style="font-size: 13px; color: #92400e; line-height: 1.5;">
                    <strong>Security Warning:</strong> Treat this secret like a password. Never commit it to public version control, client-side scripts, or share it in unencrypted channels.
                </div>
            </div>

            <label style="display: block; font-size: 13px; font-weight: 600; color: #475569; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.5px;">Client Secret Token</label>
            <div style="display: flex; gap: 10px; align-items: stretch;">
                <input type="text" id="secret-display-input" readonly value="" style="
                    flex: 1;
                    padding: 12px 14px;
                    font-family: 'Courier New', Courier, monospace;
                    font-size: 15px;
                    font-weight: 600;
                    color: #1e293b;
                    background: #f8fafc;
                    border: 1.5px solid #cbd5e1;
                    border-radius: 8px;
                    outline: none;
                    transition: border-color 0.2s;
                    user-select: all;
                " />
                <button id="copy-secret-btn" style="
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    padding: 0 20px;
                    background: #2563eb;
                    color: #ffffff;
                    border: none;
                    border-radius: 8px;
                    font-size: 14px;
                    font-weight: 600;
                    cursor: pointer;
                    box-shadow: 0 2px 4px rgba(37, 99, 235, 0.2);
                    transition: all 0.2s;
                    white-space: nowrap;
                ">
                    <span>Copy Secret</span>
                </button>
            </div>
            <div id="copy-feedback" style="height: 20px; font-size: 12px; color: #10b981; font-weight: 600; margin-top: 6px; opacity: 0; transition: opacity 0.2s;">✓ Copied to clipboard successfully!</div>

            <div style="margin-top: 24px; display: flex; justify-content: flex-end;">
                <button id="close-secret-btn" style="
                    padding: 10px 24px;
                    background: #f1f5f9;
                    color: #334155;
                    border: 1px solid #e2e8f0;
                    border-radius: 8px;
                    font-size: 14px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: background 0.2s;
                ">Done</button>
            </div>
        </div>
    `;

    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    const closeModal = () => {
        overlay.style.opacity = '0';
        modal.style.transform = 'translateY(20px) scale(0.95)';
        setTimeout(() => {
            overlay.style.display = 'none';
        }, 200);
    };

    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) closeModal();
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && overlay.style.display === 'flex') closeModal();
    });

    overlay.querySelector('#close-modal-x').addEventListener('click', closeModal);
    overlay.querySelector('#close-secret-btn').addEventListener('click', closeModal);

    const copyBtn = overlay.querySelector('#copy-secret-btn');
    const inputField = overlay.querySelector('#secret-display-input');
    const feedback = overlay.querySelector('#copy-feedback');

    copyBtn.addEventListener('click', async () => {
        try {
            await navigator.clipboard.writeText(inputField.value);
            copyBtn.style.background = '#10b981';
            copyBtn.innerHTML = '<span>Copied! ✓</span>';
            feedback.style.opacity = '1';
            inputField.select();

            setTimeout(() => {
                copyBtn.style.background = '#2563eb';
                copyBtn.innerHTML = '<span>Copy Secret</span>';
                feedback.style.opacity = '0';
            }, 2500);
        } catch (err) {
            console.error('Fallback clipboard copy required', err);
            inputField.select();
            document.execCommand('copy');
            feedback.textContent = '✓ Copied!';
            feedback.style.opacity = '1';
        }
    });

    return overlay;
}

/**
 * Displays the custom modal with the specified client secret.
 */
export function showSecretModal(secret) {
    if (!modalElement) {
        modalElement = createModalDOM();
    }
    
    const inputField = modalElement.querySelector('#secret-display-input');
    inputField.value = secret;

    modalElement.style.display = 'flex';
    // Forced reflow for animation transition
    modalElement.getBoundingClientRect();
    modalElement.style.opacity = '1';
    
    const modalContent = modalElement.children[0];
    modalContent.style.transform = 'translateY(0) scale(1)';

    setTimeout(() => {
        inputField.focus();
        inputField.select();
    }, 100);
}
