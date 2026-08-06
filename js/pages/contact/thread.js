import { auth } from '../../utils/auth.js';
import { API_BASE_URL } from '../../config/api_config.js';
import { showToast } from '../../utils/ui.js';

const urlParams = new URLSearchParams(window.location.search);
const orderId = urlParams.get('id');

let currentOrderData = null;
let currentUserId = null;
let userUsedStorageBytes = 0;
let maxStorageBytes = 10 * 1024 * 1024; // 10 MB total allowance per-user
let selectedAttachmentFile = null;

document.addEventListener('DOMContentLoaded', async () => {
    if (!orderId) {
        alert("No order ID provided.");
        window.location.href = '../../pages/contact/index.html';
        return;
    }

    const user = auth.getUser();
    if (!user) {
        window.location.href = '../../pages/auth/login.html';
        return;
    }
    currentUserId = user.id;

    setupMarkdownToolbar();
    setupAttachmentPicker();
    setupLightbox();
    await loadOrderThread();

    const chatForm = document.getElementById('chat-form');
    if (chatForm) {
        chatForm.addEventListener('submit', handleSendMessage);
    }

    const adminForm = document.getElementById('admin-status-form');
    if (adminForm) {
        adminForm.addEventListener('submit', handleAdminStatusUpdate);
    }
});

function formatBytes(bytes) {
    if (!bytes || bytes === 0) return '0 KB';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

async function loadOrderThread() {
    const chatStream = document.getElementById('chat-stream');
    try {
        const response = await fetch(`${API_BASE_URL}/api/commissions/${orderId}`, {
            headers: {
                ...auth.getAuthHeader()
            }
        });

        if (!response.ok) {
            if (response.status === 403 || response.status === 404) {
                alert("You do not have permission to view this collaborative canvas or it does not exist.");
                window.location.href = '../../pages/contact/index.html';
                return;
            }
            throw new Error("Failed to load order discussion canvas.");
        }

        const data = await response.json();
        currentOrderData = data.order;
        const messages = data.messages || [];
        const isAdmin = data.is_admin;
        userUsedStorageBytes = data.user_attachment_bytes || 0;
        maxStorageBytes = data.attachment_limit_bytes || (10 * 1024 * 1024);

        renderDossier(currentOrderData, isAdmin);
        renderStorageBar();
        renderMessages(messages, isAdmin, currentOrderData);

    } catch (error) {
        console.error("Error loading order thread:", error);
        if (chatStream) {
            chatStream.innerHTML = `<div style="text-align:center; padding:3rem; color:#f87171;">Error synchronizing canvas: ${error.message}</div>`;
        }
    }
}

function renderDossier(order, isAdmin) {
    document.getElementById('thread-header-tag').innerText = `Canvas #${order.id}: ${order.title}`;
    document.getElementById('dossier-service').innerText = order.service_type || "Custom Design";
    document.getElementById('dossier-title').innerText = order.title || "Untitled Commission";
    
    const dateObj = order.created_at ? new Date(order.created_at) : new Date();
    document.getElementById('dossier-date').innerText = dateObj.toLocaleDateString();
    document.getElementById('dossier-designer').innerText = order.designer_username || "Pending Assignment";
    document.getElementById('dossier-requirements').innerText = order.requirements || "(No specification details provided)";

    // Status badge formatting
    const badgeContainer = document.getElementById('dossier-status-badge');
    let color = "#3b82f6";
    let bg = "rgba(59, 130, 246, 0.15)";
    const st = (order.status || "PENDING").toUpperCase();
    if (st.includes("ACCEPTED")) { color = "#10b981"; bg = "rgba(16, 185, 129, 0.15)"; }
    else if (st.includes("PROGRESS")) { color = "#f59e0b"; bg = "rgba(245, 158, 11, 0.15)"; }
    else if (st.includes("PAID") || st.includes("COMPLETED")) { color = "#a855f7"; bg = "rgba(168, 85, 247, 0.15)"; }
    else if (st.includes("REJECTED") || st.includes("CANCELLED")) { color = "#ef4444"; bg = "rgba(239, 68, 68, 0.15)"; }
    
    badgeContainer.innerHTML = `<span style="padding:0.4rem 1.1rem; border-radius:999px; background:${bg}; color:${color}; font-size:0.85rem; font-weight:800; border: 1px solid ${color}40; display:inline-block;">${order.status}</span>`;

    // Real-money Quote & Payment Gateway
    const quoteEl = document.getElementById('dossier-quote');
    const gatewayBtn = document.getElementById('btn-payment-gateway');
    if (order.price_quote) {
        quoteEl.innerText = order.price_quote;
        if (order.payment_url && !order.status.includes("PAID")) {
            gatewayBtn.href = order.payment_url;
            gatewayBtn.style.display = "flex";
        } else {
            gatewayBtn.style.display = "none";
        }
    } else {
        quoteEl.innerText = "Pending Valuation";
        gatewayBtn.style.display = "none";
    }

    // Admin Control Panel
    const adminPanel = document.getElementById('admin-control-panel');
    if (isAdmin) {
        adminPanel.classList.add('visible');
        document.getElementById('admin-status-select').value = order.status || "PENDING";
        document.getElementById('admin-price-input').value = order.price_quote || "";
        document.getElementById('admin-payment-input').value = order.payment_url || "";
        document.getElementById('admin-lock-checkbox').checked = !!order.is_locked;
    }
}

function renderStorageBar() {
    const fillEl = document.getElementById('storage-bar-fill');
    const textEl = document.getElementById('storage-used-text');
    if (!fillEl || !textEl) return;

    const usedMB = (userUsedStorageBytes / (1024 * 1024)).toFixed(2);
    const maxMB = (maxStorageBytes / (1024 * 1024)).toFixed(0);
    const percent = Math.min(100, Math.max(0, (userUsedStorageBytes / maxStorageBytes) * 100));

    textEl.innerText = `${usedMB} MB / ${maxMB} MB`;
    fillEl.style.width = `${percent}%`;

    if (percent >= 90) {
        fillEl.style.background = "#ef4444"; // Red alert when near quota
    }
}

function renderMessages(messages, isAdmin, order) {
    const stream = document.getElementById('chat-stream');
    const inputArea = document.getElementById('chat-input-area');
    const lockedBanner = document.getElementById('locked-banner');

    if (!stream) return;
    stream.innerHTML = "";

    if (messages.length === 0) {
        stream.innerHTML = `<div style="text-align:center; padding:4rem; color:var(--text-secondary); font-size:1rem;">No collaborative notes yet. Be the first to initiate discussion!</div>`;
    } else {
        messages.forEach(msg => {
            if (msg.is_system) {
                const sysDiv = document.createElement('div');
                sysDiv.className = 'msg-system-wrap';
                sysDiv.innerHTML = `<strong>⚡ SYSTEM AUDIT NOTE:</strong> ${msg.content}`;
                stream.appendChild(sysDiv);
                return;
            }

            const isOwn = (msg.sender_id === currentUserId);
            const wrapper = document.createElement('div');
            wrapper.className = `msg-bubble-wrapper ${isOwn ? 'own-msg' : ''}`;

            const avatar = document.createElement('div');
            avatar.className = 'msg-avatar';
            if (msg.sender_avatar && !msg.sender_avatar.includes("default")) {
                avatar.style.backgroundImage = `url(${API_BASE_URL}/${msg.sender_avatar})`;
                avatar.style.backgroundSize = "cover";
                avatar.style.backgroundPosition = "center";
                avatar.innerText = "";
            } else {
                avatar.innerText = (msg.sender_username || "U").charAt(0).toUpperCase();
            }

            const box = document.createElement('div');
            box.className = 'msg-content-box';

            let roleBadge = "";
            if (msg.sender_role === "OWNER" || msg.sender_role === "ADMIN") {
                roleBadge = `<span style="background:rgba(244, 63, 94, 0.2); color:#fb7185; font-size:0.7rem; font-weight:800; padding:0.15rem 0.5rem; border-radius:6px; margin-left:0.5rem;">DESIGNER / OWNER</span>`;
            }

            // Parse Markdown & Sanitize
            let renderedMarkdown = msg.content || "";
            if (typeof marked !== 'undefined' && typeof DOMPurify !== 'undefined') {
                renderedMarkdown = DOMPurify.sanitize(marked.parse(msg.content));
            }

            // Attachment rendering
            let attachmentHtml = "";
            if (msg.attachment_url) {
                const fullUrl = `${API_BASE_URL}${msg.attachment_url}`;
                if (msg.attachment_type === 'image') {
                    attachmentHtml = `
                        <div style="margin-top: 0.75rem;">
                            <img src="${fullUrl}" alt="Attachment Preview" class="attachment-thumb" data-full="${fullUrl}" style="max-width: 100%; max-height: 380px; border-radius: 12px; border: 1px solid rgba(255,255,255,0.15); cursor: pointer; box-shadow: 0 4px 15px rgba(0,0,0,0.3); transition: transform 0.2s;" title="Click to open full size">
                            <div style="font-size:0.75rem; color:var(--text-secondary); margin-top:0.3rem; display:flex; justify-content:space-between;">
                                <span>📷 Image Attachment (${formatBytes(msg.attachment_size)})</span>
                                <a href="${fullUrl}" download style="color:var(--neon-cyan); text-decoration:none;">Download ⬇️</a>
                            </div>
                        </div>
                    `;
                } else {
                    attachmentHtml = `
                        <div style="margin-top: 0.75rem;">
                            <video src="${fullUrl}" controls style="max-width: 100%; max-height: 400px; border-radius: 12px; border: 1px solid rgba(255,255,255,0.15); background:black;"></video>
                            <div style="font-size:0.75rem; color:var(--text-secondary); margin-top:0.3rem; display:flex; justify-content:space-between;">
                                <span>🎥 Video Attachment (${formatBytes(msg.attachment_size)})</span>
                                <a href="${fullUrl}" download style="color:var(--neon-cyan); text-decoration:none;">Download ⬇️</a>
                            </div>
                        </div>
                    `;
                }
            }

            box.innerHTML = `
                <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:0.6rem; font-size:0.8rem; border-bottom:1px solid rgba(255,255,255,0.06); padding-bottom:0.4rem;">
                    <div>
                        <strong style="color:white; font-size:0.9rem;">${msg.sender_username}</strong>
                        ${roleBadge}
                    </div>
                    <span style="color:var(--text-secondary);">${msg.created_at ? new Date(msg.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : ''}</span>
                </div>
                <div class="markdown-body">${renderedMarkdown}</div>
                ${attachmentHtml}
            `;

            wrapper.appendChild(avatar);
            wrapper.appendChild(box);
            stream.appendChild(wrapper);
        });
    }

    // Attach click handlers to thumbnail images for Lightbox
    document.querySelectorAll('.attachment-thumb').forEach(img => {
        img.addEventListener('click', () => {
            openLightbox(img.getAttribute('data-full'));
        });
    });

    // Auto scroll to latest message
    stream.scrollTop = stream.scrollHeight;

    // Handle locked thread logic
    if (order.is_locked && !isAdmin) {
        if (inputArea) inputArea.style.display = "none";
        if (lockedBanner) lockedBanner.style.display = "block";
    } else {
        if (inputArea) inputArea.style.display = "block";
        if (lockedBanner) lockedBanner.style.display = "none";
    }

    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
}

function setupMarkdownToolbar() {
    const textarea = document.getElementById('message-textarea');
    const buttons = document.querySelectorAll('.toolbar-btn[data-md]');

    if (!textarea) return;

    buttons.forEach(btn => {
        btn.addEventListener('click', () => {
            const mdType = btn.getAttribute('data-md');
            const start = textarea.selectionStart;
            const end = textarea.selectionEnd;
            const selected = textarea.value.substring(start, end);
            let replacement = "";
            let cursorOffset = 0;

            if (mdType === "bold") {
                replacement = `**${selected || "bold text"}**`;
                cursorOffset = selected ? replacement.length : 2;
            } else if (mdType === "italic") {
                replacement = `*${selected || "italic text"}*`;
                cursorOffset = selected ? replacement.length : 1;
            } else if (mdType === "code") {
                replacement = `\`\`\`\n${selected || "codeblock"}\n\`\`\``;
                cursorOffset = selected ? replacement.length : 4;
            } else if (mdType === "link") {
                replacement = `[${selected || "link text"}](https://example.com)`;
                cursorOffset = selected ? replacement.length : 1;
            } else if (mdType === "list") {
                replacement = `\n- ${selected || "item 1"}\n- item 2\n`;
                cursorOffset = replacement.length;
            }

            textarea.setRangeText(replacement, start, end, 'end');
            textarea.focus();
        });
    });
}

function setupAttachmentPicker() {
    const triggerBtn = document.getElementById('btn-attach-trigger');
    const fileInput = document.getElementById('media-file-input');
    const previewBox = document.getElementById('attachment-preview');
    const removeBtn = document.getElementById('btn-remove-attachment');

    if (!triggerBtn || !fileInput || !previewBox) return;

    triggerBtn.addEventListener('click', () => fileInput.click());

    fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Verify against 10 MB per-user limit!
        if (userUsedStorageBytes + file.size > maxStorageBytes) {
            const rem = Math.max(0, maxStorageBytes - userUsedStorageBytes);
            alert(`⚠️ Attachment file exceeds your remaining quota! You have ${formatBytes(rem)} left of your 10 MB total allowance.`);
            fileInput.value = "";
            selectedAttachmentFile = null;
            previewBox.style.display = "none";
            return;
        }

        selectedAttachmentFile = file;
        document.getElementById('preview-filename').innerText = file.name;
        document.getElementById('preview-filesize').innerText = formatBytes(file.size);
        previewBox.style.display = "flex";
        if (typeof lucide !== 'undefined') lucide.createIcons();
    });

    if (removeBtn) {
        removeBtn.addEventListener('click', () => {
            fileInput.value = "";
            selectedAttachmentFile = null;
            previewBox.style.display = "none";
        });
    }
}

function setupLightbox() {
    const modal = document.getElementById('lightbox');
    const closeBtn = document.getElementById('btn-close-lightbox');
    if (!modal) return;

    closeBtn.addEventListener('click', () => modal.classList.remove('active'));
    modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.classList.remove('active');
    });
}

function openLightbox(url) {
    const modal = document.getElementById('lightbox');
    const img = document.getElementById('lightbox-img');
    if (modal && img) {
        img.src = url;
        modal.classList.add('active');
    }
}

async function handleSendMessage(e) {
    e.preventDefault();
    const textarea = document.getElementById('message-textarea');
    const btnSend = document.getElementById('btn-send-message');
    const content = textarea ? textarea.value.trim() : "";

    if (!content && !selectedAttachmentFile) {
        showToast("Please enter a message or select a media attachment to send.", "error");
        return;
    }

    if (btnSend) {
        btnSend.disabled = true;
        btnSend.innerHTML = `<span>Sending...</span><i data-lucide="loader" class="spinner" style="width:18px;height:18px;"></i>`;
        if (typeof lucide !== 'undefined') lucide.createIcons();
    }

    try {
        const formData = new FormData();
        formData.append("content", content);
        if (selectedAttachmentFile) {
            formData.append("attachment", selectedAttachmentFile);
        }

        const response = await fetch(`${API_BASE_URL}/api/commissions/${orderId}/messages`, {
            method: "POST",
            headers: {
                ...auth.getAuthHeader()
            },
            body: formData
        });

        if (!response.ok) {
            const errData = await response.json();
            throw new Error(errData.detail || "Failed to send message and attachment.");
        }

        if (textarea) textarea.value = "";
        const removeBtn = document.getElementById('btn-remove-attachment');
        if (removeBtn) removeBtn.click();

        showToast("Discussion reply posted to canvas!", "success");
        await loadOrderThread();

    } catch (error) {
        console.error("SendMessage error:", error);
        alert(`Failed to post message: ${error.message}`);
    } finally {
        if (btnSend) {
            btnSend.disabled = false;
            btnSend.innerHTML = `<span>Send</span><i data-lucide="send" style="width:18px;height:18px;"></i>`;
            if (typeof lucide !== 'undefined') lucide.createIcons();
        }
    }
}

async function handleAdminStatusUpdate(e) {
    e.preventDefault();
    const status = document.getElementById('admin-status-select').value;
    const quote = document.getElementById('admin-price-input').value.trim();
    const payment = document.getElementById('admin-payment-input').value.trim();
    const locked = document.getElementById('admin-lock-checkbox').checked;
    const note = document.getElementById('admin-note-input').value.trim();

    try {
        const response = await fetch(`${API_BASE_URL}/api/commissions/${orderId}/status`, {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json",
                ...auth.getAuthHeader()
            },
            body: JSON.stringify({
                status: status,
                price_quote: quote || null,
                payment_url: payment || null,
                is_locked: locked,
                system_note: note || null
            })
        });

        if (!response.ok) {
            const errData = await response.json();
            throw new Error(errData.detail || "Failed to update commission specifications.");
        }

        showToast("Commission order specifications and real-money quote updated!", "success");
        document.getElementById('admin-note-input').value = "";
        await loadOrderThread();

    } catch (error) {
        console.error("Admin status update error:", error);
        alert(`Update failed: ${error.message}`);
    }
}
