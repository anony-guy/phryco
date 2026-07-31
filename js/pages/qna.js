import { apiFetch } from '../api/client.js';
import { API_BASE_URL } from '../utils/config.js';
import { escapeHTML } from '../utils/security.js';
import { InfiniteScroller } from '../utils/pagination.js';

let currentUser = null;
let currentDraftId = null;
let scroller;

async function init() {
    try {
        currentUser = await apiFetch('/api/users/me');
    } catch(e) {
        console.log("Not logged in");
    }
    
    // Auth checks
    const askBtn = document.getElementById('ask-btn');
    if (!currentUser) {
        askBtn.style.display = 'none';
    } else {
        askBtn.addEventListener('click', async () => {
            // Create draft
            try {
                const data = await apiFetch('/api/qna/posts/draft', { method: 'POST' });
                currentDraftId = data.id;
                document.getElementById('ask-image-preview').innerHTML = '';
                document.getElementById('ask-title-input').value = '';
                document.getElementById('ask-question-input').value = '';
                document.getElementById('ask-image-upload').value = '';
                document.getElementById('ask-modal').style.display = 'flex';
            } catch(err) {
                alert(err.message || 'Failed to start a draft');
            }
        });
    }
    
    // Image Upload
    document.getElementById('ask-image-upload').addEventListener('change', async (e) => {
        if (!currentDraftId || !e.target.files.length) return;
        const file = e.target.files[0];
        const formData = new FormData();
        formData.append('file', file);
        
        try {
            const token = localStorage.getItem('phryco_token');
            const res = await fetch(`${API_BASE_URL}/api/qna/posts/${currentDraftId}/images`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
                body: formData
            });
            if (!res.ok) throw new Error("Failed to upload image");
            const data = await res.json();
            
            // Show preview
            const img = document.createElement('img');
            img.src = `${API_BASE_URL}/api/qna/images/${data.filename}`;
            img.style.width = '100px';
            img.style.height = '100px';
            img.style.objectFit = 'cover';
            img.style.borderRadius = '8px';
            document.getElementById('ask-image-preview').appendChild(img);
            
            e.target.value = ''; // reset file input
        } catch(err) {
            alert(err.message);
        }
    });
    
    // Modal cancels
    document.getElementById('ask-cancel').addEventListener('click', () => {
        document.getElementById('ask-modal').style.display = 'none';
        currentDraftId = null;
    });
    
    // Modal submits
    document.getElementById('ask-submit').addEventListener('click', submitQuestion);
    
    await loadPosts();
}

function renderPostCard(post) {
    const div = document.createElement('div');
    div.className = 'qna-post-card';
    div.onclick = () => {
        window.location.href = `/pages/qna/post.html?id=${post.id}`;
    };
    
    const pfp = `${API_BASE_URL}/api/users/${post.username}/avatar`;
    const dateStr = new Date(post.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
    
    let statusHtml = '';
    if (post.status === 'RESOLVED') {
        statusHtml = `<span style="float: right; font-size: 0.8rem; background: rgba(34, 197, 94, 0.2); color: #22c55e; padding: 0.25rem 0.5rem; border-radius: 999px; font-weight: bold;">RESOLVED</span>`;
    } else {
        statusHtml = `<span style="float: right; font-size: 0.8rem; color: var(--text-secondary);"><i data-lucide="message-square" style="width:14px;height:14px;vertical-align:middle;"></i> ${post.reply_count} Replies</span>`;
    }
    
    const renderedPreview = window.DOMPurify.sanitize(window.marked.parse(post.question || ''));
    
    div.innerHTML = `
        ${statusHtml}
        <div class="qna-user-info">
            <img src="${pfp}" alt="User" class="qna-user-pfp" onerror="this.src='https://api.dicebear.com/7.x/avataaars/svg?seed=${escapeHTML(post.username)}'">
            <div>
                <div class="qna-username">${escapeHTML(post.username)}</div>
                <div class="qna-date">${dateStr}</div>
            </div>
        </div>
        <h3 style="margin-bottom: 0.5rem; color: var(--text-primary); font-size: 1.25rem;">${escapeHTML(post.title || 'Untitled')}</h3>
        <div class="markdown-preview" style="color: var(--text-secondary); display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">${renderedPreview}</div>
    `;
    return div;
}

async function loadPosts() {
    const container = document.getElementById('posts-container');
    container.innerHTML = '';
    
    scroller = new InfiniteScroller({
        endpoint: '/api/qna/posts',
        container: container,
        emptyHTML: `<div style="color: var(--text-secondary); text-align: center; padding: 3rem;">No questions have been asked yet.</div>`,
        renderCallback: (items, sentinel) => {
            items.forEach(post => {
                const card = renderPostCard(post);
                container.insertBefore(card, sentinel);
            });
            if (window.lucide) window.lucide.createIcons();
        }
    });
    
    try {
        await scroller.initialize();
    } catch(err) {
        console.error("Failed to load QnA posts", err);
    }
}

async function submitQuestion() {
    if (!currentDraftId) return;
    const title = document.getElementById('ask-title-input').value.trim();
    const q = document.getElementById('ask-question-input').value.trim();
    if (!title || !q) {
        alert("Please enter a title and a question.");
        return;
    }
    
    try {
        await apiFetch(`/api/qna/posts/${currentDraftId}`, {
            method: 'PUT',
            body: { title: title, question: q }
        });
        document.getElementById('ask-modal').style.display = 'none';
        currentDraftId = null;
        await loadPosts();
    } catch(err) {
        alert(err.message || 'Failed to publish post');
    }
}

init();
