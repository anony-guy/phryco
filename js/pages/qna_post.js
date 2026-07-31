import { apiFetch } from '../api/client.js';
import { API_BASE_URL } from '../utils/config.js';
import { escapeHTML } from '../utils/security.js';

let currentUser = null;
let postData = null;
const urlParams = new URLSearchParams(window.location.search);
const postId = urlParams.get('id');

async function init() {
    if (!postId) {
        document.getElementById('thread-container').innerHTML = '<div style="text-align:center; padding: 2rem;">Post not found.</div>';
        return;
    }
    
    try {
        currentUser = await apiFetch('/api/users/me');
    } catch(e) {
        console.log("Not logged in");
    }
    
    await loadPost();
}

async function loadPost() {
    try {
        postData = await apiFetch(`/api/qna/posts/${postId}`);
        renderThread();
    } catch (err) {
        document.getElementById('thread-container').innerHTML = '<div style="text-align:center; padding: 2rem; color: #ef4444;">Failed to load thread.</div>';
    }
}

function renderThread() {
    const container = document.getElementById('thread-container');
    
    // 1. Original Post
    const pfp = `${API_BASE_URL}/api/users/${postData.username}/avatar`;
    const dateStr = new Date(postData.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute:'2-digit' });
    
    let galleryHtml = '';
    if (postData.images && postData.images.length > 0) {
        galleryHtml = '<div class="op-gallery" style="margin-top: 1rem;">';
        postData.images.forEach(img => {
            galleryHtml += `<a href="${API_BASE_URL}/api/qna/images/${img}" target="_blank"><img src="${API_BASE_URL}/api/qna/images/${img}" alt="Attachment"></a>`;
        });
        galleryHtml += '</div>';
    }
    
    let statusBadge = `<span class="op-status status-${postData.status}">${postData.status}</span>`;
    
        const renderedQuestion = window.DOMPurify.sanitize(window.marked.parse(postData.question || ''));
        
        let html = `
            <div class="original-post">
                <div class="op-header">
                    <img src="${pfp}" alt="OP" class="op-pfp" onerror="this.src='https://api.dicebear.com/7.x/avataaars/svg?seed=${escapeHTML(postData.username)}'">
                    <div>
                        <div class="op-username">${escapeHTML(postData.username)}</div>
                        <div class="op-date">${dateStr}</div>
                    </div>
                    ${statusBadge}
                </div>
                <h1 class="op-title">${escapeHTML(postData.title)}</h1>
                <div class="op-content markdown-body">${renderedQuestion}</div>
                ${galleryHtml}
            </div>
            
            <div class="replies-section">
        `;
    
    // 2. Replies
    postData.replies.forEach(reply => {
        const rpfp = `${API_BASE_URL}/api/users/${reply.username}/avatar`;
        const rdate = new Date(reply.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute:'2-digit' });
        
        const isAccepted = reply.is_accepted;
        const acceptedBadge = isAccepted ? `<div class="accepted-badge"><i data-lucide="check-circle" style="width:16px;height:16px;"></i> Accepted Answer</div>` : '';
        
        let acceptBtn = '';
        if (currentUser && currentUser.id === postData.user_id && postData.status !== 'RESOLVED' && !isAccepted) {
            acceptBtn = `<button class="accept-btn btn-secondary" data-id="${reply.id}" style="margin-top: 0.5rem; font-size: 0.8rem; padding: 0.25rem 0.5rem;">Accept Answer</button>`;
        }
        
        const renderedReply = window.DOMPurify.sanitize(window.marked.parse(reply.message || ''));
        
        html += `
            <div class="reply-card ${isAccepted ? 'accepted' : ''}">
                <img src="${rpfp}" class="reply-pfp" onerror="this.src='https://api.dicebear.com/7.x/avataaars/svg?seed=${escapeHTML(reply.username)}'">
                <div class="reply-content">
                    ${acceptedBadge}
                    <div class="reply-header">
                        <span class="reply-username">${escapeHTML(reply.username)}</span>
                        ${reply.user_role === 'ADMIN' || reply.user_role === 'OWNER' ? `<span class="reply-role">${reply.user_role}</span>` : ''}
                        <span class="reply-date">${rdate}</span>
                    </div>
                    <div class="reply-message markdown-body">${renderedReply}</div>
                    ${acceptBtn}
                </div>
            </div>
        `;
    });
    
    html += `</div>`;
    
    // 3. Reply Input
    if (postData.status === 'RESOLVED') {
        html += `
            <div style="margin-top: 2rem; text-align: center; color: var(--text-secondary); padding: 1rem; border: 1px dashed var(--border-color); border-radius: var(--radius-md);">
                <i data-lucide="lock" style="vertical-align: middle; margin-right: 0.5rem;"></i> This thread has been resolved and is locked.
            </div>
        `;
    } else if (currentUser) {
        html += `
            <div class="reply-input-area">
                <h3>Post a Reply</h3>
                <textarea id="reply-input" class="reply-textarea" placeholder="Write your response..."></textarea>
                <div style="text-align: right;">
                    <button class="btn-primary" id="submit-reply-btn">Reply</button>
                </div>
            </div>
        `;
    } else {
        html += `
            <div style="margin-top: 2rem; text-align: center; color: var(--text-secondary);">
                <a href="../../pages/login/index.html" style="color: var(--accent-primary);">Log in</a> to post a reply.
            </div>
        `;
    }
    
    container.innerHTML = html;
    lucide.createIcons();
    
    // Events
    const submitBtn = document.getElementById('submit-reply-btn');
    if (submitBtn) {
        submitBtn.addEventListener('click', submitReply);
    }
    
    document.querySelectorAll('.accept-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const id = e.currentTarget.dataset.id;
            if (confirm("Are you sure you want to accept this answer? This will resolve and lock the thread.")) {
                await acceptReply(id);
            }
        });
    });
}

async function submitReply() {
    const input = document.getElementById('reply-input');
    const msg = input.value.trim();
    if (!msg) return;
    
    try {
        await apiFetch(`/api/qna/posts/${postId}/replies`, {
            method: 'POST',
            body: { message: msg }
        });
        input.value = '';
        await loadPost();
    } catch(err) {
        alert(err.message || "Failed to post reply");
    }
}

async function acceptReply(replyId) {
    try {
        await apiFetch(`/api/qna/replies/${replyId}/accept`, {
            method: 'PUT'
        });
        await loadPost();
    } catch(err) {
        alert(err.message || "Failed to accept answer");
    }
}

init();
