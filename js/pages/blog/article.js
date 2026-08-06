/**
 * Phryco Editorial Dispatch - Interactive Reader Runtime
 * Executes live Chart.js interactive visualizations, Mermaid diagrams, syntax highlighting,
 * copy-to-clipboard code triggers, inline asset downloads, and creator typography themes.
 */

import { API_BASE_URL } from '../../utils/config.js';

document.addEventListener('DOMContentLoaded', () => {
    initScrollProgressBar();
    loadArticleContent();
});

function initScrollProgressBar() {
    const progressBar = document.getElementById('reading-progress-bar');
    window.addEventListener('scroll', () => {
        const scrollTop = window.scrollY || document.documentElement.scrollTop;
        const scrollHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
        const progress = scrollHeight > 0 ? (scrollTop / scrollHeight) * 100 : 0;
        if (progressBar) {
            progressBar.style.width = `${progress}%`;
        }
    });
}

function getSlugFromUrl() {
    const params = new URLSearchParams(window.location.search);
    return params.get('slug') || 'phrybucks-demo-launch-2026';
}

function formatFileSize(bytes) {
    if (!bytes || bytes === 0) return '0 KB';
    const kb = bytes / 1024;
    if (kb < 1024) {
        return `${Math.round(kb)} KB`;
    }
    const mb = kb / 1024;
    return `${mb.toFixed(2)} MB`;
}

async function loadArticleContent() {
    const slug = getSlugFromUrl();
    const headerBox = document.getElementById('article-header-box');
    const bodyBox = document.getElementById('article-body');
    const coverContainer = document.getElementById('cover-image-container');

    if (window.location.pathname.includes('preview.html')) {
        const cachedDraft = localStorage.getItem('phryco_blog_draft');
        const draft = cachedDraft ? JSON.parse(cachedDraft) : {
            title: "Untitled Studio Preview Draft",
            category: "Preview Mode",
            summary: "Return to the studio editor and begin typing to synchronize your draft here in real time.",
            content: "# Waiting for content...\nStart drafting in the Studio Editor tab to see your live interactive preview here.",
            author_name: "Phryco Inc. (Studio Preview)",
            created_at: new Date().toISOString()
        };
        renderArticle(draft);
        window.addEventListener('storage', (e) => {
            if (e.key === 'phryco_blog_draft' && e.newValue) {
                try {
                    renderArticle(JSON.parse(e.newValue));
                } catch(err) {
                    console.error("Failed to sync live draft", err);
                }
            }
        });
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/api/blog/posts/${encodeURIComponent(slug)}`);
        if (!response.ok) {
            throw new Error(`Failed to load article details (Status: ${response.status})`);
        }
        const post = await response.json();
        renderArticle(post);
    } catch (error) {
        console.error('Error loading editorial dispatch:', error);
        headerBox.innerHTML = `
            <div style="text-align:center; padding:5rem 0; color:#ef4444;">
                <h2 style="font-size:1.8rem; margin-bottom:1rem;">Unable to Load Technical Dispatch</h2>
                <p style="color:#94a3b8;">${error.message}. Please ensure the local Phryco backend is active.</p>
                <a href="index.html" class="btn-back-dispatch" style="margin:2rem auto; width:max-content; display:inline-flex;">Return to Dispatches</a>
            </div>
        `;
    }
}

function renderArticle(post) {
    document.title = `${post.title} - Phryco Editorial`;

    const headerBox = document.getElementById('article-header-box');
    const coverContainer = document.getElementById('cover-image-container');
    const bodyBox = document.getElementById('article-body');
    const authorDossier = document.getElementById('author-dossier');
    const dossierName = document.getElementById('dossier-name');
    const dossierAvatar = document.getElementById('dossier-avatar');
    const relatedSection = document.getElementById('related-section');
    const relatedGrid = document.getElementById('related-grid');
    const attachmentsSection = document.getElementById('attachments-section');
    const attachmentsList = document.getElementById('attachments-list');

    // 1. Calculate reading time
    const wordCount = (post.content || '').split(/\s+/).length;
    const readingMinutes = Math.max(1, Math.ceil(wordCount / 200));
    const dateStr = post.created_at ? new Date(post.created_at).toLocaleDateString('en-US', {
        year: 'numeric', month: 'long', day: 'numeric'
    }) : 'August 2026';

    headerBox.innerHTML = `
        <div class="category-badge"><i data-lucide="sparkles" style="width:14px;height:14px;"></i> ${post.category}</div>
        <h1 class="article-title">${post.title}</h1>
        <p class="article-summary-hero">${post.summary}</p>
        <div class="article-meta-bar">
            <span style="display:flex;align-items:center;gap:0.4rem;color:#e2e8f0;font-weight:700;"><i data-lucide="user" style="width:16px;height:16px;color:#a855f7;"></i> ${post.author_name}</span>
            <span style="display:flex;align-items:center;gap:0.4rem;"><i data-lucide="calendar" style="width:16px;height:16px;"></i> ${dateStr}</span>
            <span style="display:flex;align-items:center;gap:0.4rem;"><i data-lucide="clock" style="width:16px;height:16px;"></i> ${readingMinutes} min read</span>
            <span style="display:flex;align-items:center;gap:0.4rem;"><i data-lucide="eye" style="width:16px;height:16px;"></i> ${post.views_count === 1 ? '1 view' : `${post.views_count || 1} views`}</span>
        </div>
    `;

    appendAdminFeatureButton(post.id, post.is_featured);

    if (post.cover_image_url) {
        coverContainer.innerHTML = `
            <div class="cover-img-frame">
                <img src="${post.cover_image_url}" alt="${post.title}" loading="lazy">
            </div>
        `;
    } else {
        coverContainer.innerHTML = '';
    }

    // 2. Apply Creator Typography Blueprint
    const theme = post.typography_theme || "sans";
    bodyBox.className = `markdown-canvas theme-${theme}`;

    // 3. Render Markdown
    if (window.marked && window.DOMPurify) {
        marked.setOptions({ gfm: true, breaks: true });
        const rawHtml = marked.parse(post.content || '');
        const cleanHtml = DOMPurify.sanitize(rawHtml, {
            ADD_TAGS: ['canvas', 'pre', 'code'],
            ADD_ATTR: ['id', 'class', 'style', 'data-lucide']
        });
        bodyBox.innerHTML = cleanHtml;
    } else {
        bodyBox.innerHTML = `<pre style="white-space:pre-wrap; font-family:'Inter',sans-serif;">${post.content || ''}</pre>`;
    }

    // 4. Execute Interactive Runtime (Charts, Diagrams, Syntax Highlighting, Alerts)
    executeInteractiveRuntime(bodyBox, post.attachments || []);

    // 5. Render Technical Attachments Box
    if (post.attachments && post.attachments.length > 0) {
        attachmentsSection.style.display = 'block';
        attachmentsList.innerHTML = post.attachments.map((att, index) => {
            let iconName = 'file-text';
            if (att.type === 'archive' || att.name.endsWith('.zip')) iconName = 'archive';
            if (att.type === 'code') iconName = 'code';
            return `
                <div class="attachment-card">
                    <div class="attachment-info">
                        <div class="attachment-icon">
                            <i data-lucide="${iconName}" style="width:24px;height:24px;"></i>
                        </div>
                        <div>
                            <div style="font-weight:800; font-size:1.05rem; color:#ffffff; margin-bottom:0.25rem;">${att.name}</div>
                            <div style="font-size:0.85rem; color:#94a3b8; font-family:'Inter',sans-serif;">Technical Artifact • Size: ${formatFileSize(att.size_bytes)}</div>
                        </div>
                    </div>
                    <a href="${API_BASE_URL}${att.url}" target="_blank" download="${att.name}" class="btn-dl-artifact">
                        <i data-lucide="download" style="width:16px;height:16px;"></i> Download Artifact
                    </a>
                </div>
            `;
        }).join('');
    } else {
        attachmentsSection.style.display = 'none';
    }

    // 6. Author Dossier
    authorDossier.style.display = 'flex';
    dossierName.textContent = post.author_name;
    dossierAvatar.textContent = (post.author_name || 'PE').slice(0, 2).toUpperCase();

    // 7. Related Dispatches
    if (post.related_posts && post.related_posts.length > 0) {
        relatedSection.style.display = 'block';
        relatedGrid.innerHTML = post.related_posts.map(r => {
            const relDate = r.created_at ? new Date(r.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '2026';
            return `
                <a href="article.html?slug=${r.slug}" class="related-card">
                    <div>
                        <span style="font-size:0.75rem; color:#a855f7; font-weight:700; text-transform:uppercase;">${r.category}</span>
                        <h4>${r.title}</h4>
                        <p>${r.summary}</p>
                    </div>
                    <div style="font-size:0.85rem; color:#64748b; display:flex; justify-content:space-between; align-items:center; border-top:1px solid rgba(255,255,255,0.06); padding-top:0.8rem; margin-top:1rem;">
                        <span>${relDate}</span>
                        <span style="display:flex;align-items:center;gap:0.3rem;color:#c084fc;font-weight:600;">Read Dispatch <i data-lucide="arrow-right" style="width:14px;height:14px;"></i></span>
                    </div>
                </a>
            `;
        }).join('');
    } else {
        relatedSection.style.display = 'none';
    }

    // Re-initialize Lucide Icons across all generated elements
    if (window.lucide) {
        window.lucide.createIcons();
    }
}

function executeInteractiveRuntime(container, attachments) {
    // A. Process Interactive Chart.js Graphs (```chart)
    const chartCodes = container.querySelectorAll('code.language-chart, code.language-chartjs, code.language-graph');
    chartCodes.forEach((codeEl, i) => {
        const preEl = codeEl.parentElement;
        try {
            const jsonText = codeEl.innerText.trim();
            const data = JSON.parse(jsonText);
            
            const chartDiv = document.createElement('div');
            chartDiv.className = 'interactive-chart-card';
            const canvasId = `interactive-canvas-${Date.now()}-${i}`;
            chartDiv.innerHTML = `
                <div class="chart-badge"><i data-lucide="bar-chart-2" style="width:14px;height:14px;"></i> Live Interactive Visualization</div>
                <div style="height: 320px; width: 100%;">
                    <canvas id="${canvasId}"></canvas>
                </div>
            `;
            preEl.parentNode.replaceChild(chartDiv, preEl);

            if (window.Chart) {
                setTimeout(() => {
                    const ctx = document.getElementById(canvasId);
                    if (ctx) {
                        new Chart(ctx, {
                            type: data.type || 'bar',
                            data: {
                                labels: data.labels || [],
                                datasets: (data.datasets || []).map(ds => ({
                                    label: ds.label || 'Metric Data',
                                    data: ds.data || [],
                                    backgroundColor: ds.color || '#a855f7',
                                    borderColor: '#ffffff',
                                    borderWidth: 1,
                                    borderRadius: 8
                                }))
                            },
                            options: {
                                responsive: true,
                                maintainAspectRatio: false,
                                plugins: {
                                    legend: { labels: { color: '#e2e8f0', font: { family: 'Inter', weight: 'bold' } } },
                                    title: { display: !!data.title, text: data.title || '', color: '#ffffff', font: { size: 18, family: 'Inter', weight: '800' } }
                                },
                                scales: {
                                    x: { ticks: { color: '#cbd5e1' }, grid: { color: 'rgba(255,255,255,0.06)' } },
                                    y: { ticks: { color: '#cbd5e1' }, grid: { color: 'rgba(255,255,255,0.06)' } }
                                }
                            }
                        });
                    }
                }, 100);
            }
        } catch (err) {
            console.warn('Chart JSON parse error, retaining code snippet:', err);
        }
    });

    // B. Process Mermaid Architecture Diagrams
    const mermaidCodes = container.querySelectorAll('code.language-mermaid');
    mermaidCodes.forEach((codeEl) => {
        const preEl = codeEl.parentElement;
        const mermaidDiv = document.createElement('div');
        mermaidDiv.className = 'interactive-chart-card';
        mermaidDiv.style.textAlign = 'center';
        mermaidDiv.innerHTML = `
            <div class="chart-badge" style="background:rgba(6,182,212,0.15);color:#22d3ee;border-color:rgba(6,182,212,0.3);"><i data-lucide="git-merge" style="width:14px;height:14px;"></i> Architecture Blueprint</div>
            <div class="mermaid" style="margin-top:1rem; overflow-x:auto;">${codeEl.innerText.trim()}</div>
        `;
        preEl.parentNode.replaceChild(mermaidDiv, preEl);
    });
    if (window.mermaid) {
        window.mermaid.initialize({ startOnLoad: false, theme: 'dark' });
        setTimeout(() => window.mermaid.run({ nodes: container.querySelectorAll('.mermaid') }), 150);
    }

    // C. Process GitHub-Style Alert Badges
    const blockquotes = container.querySelectorAll('blockquote');
    blockquotes.forEach((bq) => {
        const text = bq.innerText.trim();
        let alertType = '';
        let iconName = 'info';
        let titleText = 'NOTE';

        if (text.startsWith('[!NOTE]')) { alertType = 'note'; iconName = 'info'; titleText = 'Note'; }
        else if (text.startsWith('[!TIP]')) { alertType = 'tip'; iconName = 'lightbulb'; titleText = 'Tip & Best Practice'; }
        else if (text.startsWith('[!IMPORTANT]')) { alertType = 'important'; iconName = 'flame'; titleText = 'Important Architecture Fact'; }
        else if (text.startsWith('[!WARNING]')) { alertType = 'warning'; iconName = 'alert-triangle'; titleText = 'Warning'; }
        else if (text.startsWith('[!CAUTION]')) { alertType = 'warning'; iconName = 'shield-alert'; titleText = 'Caution'; }

        if (alertType) {
            const content = text.replace(/\[!.*?\]\n?/, '').trim();
            const div = document.createElement('div');
            div.className = `github-alert ${alertType}`;
            div.innerHTML = `
                <div class="alert-title"><i data-lucide="${iconName}" style="width:16px;height:16px;"></i> ${titleText}</div>
                <p>${content}</p>
            `;
            bq.parentNode.replaceChild(div, bq);
        }
    });

    // D. Process Syntax Highlighting & Copy-to-Clipboard Buttons
    const codeBlocks = container.querySelectorAll('pre code');
    codeBlocks.forEach((codeEl) => {
        if (codeEl.closest('.interactive-chart-card')) return;

        if (window.hljs) {
            window.hljs.highlightElement(codeEl);
        }

        const preEl = codeEl.parentElement;
        if (preEl.parentElement && preEl.parentElement.classList.contains('code-wrapper')) return;

        const wrapper = document.createElement('div');
        wrapper.className = 'code-wrapper';
        preEl.parentNode.insertBefore(wrapper, preEl);
        wrapper.appendChild(preEl);

        const copyBtn = document.createElement('button');
        copyBtn.className = 'btn-copy-code';
        copyBtn.innerHTML = `<i data-lucide="clipboard" style="width:14px;height:14px;"></i> Copy Code`;
        copyBtn.addEventListener('click', () => {
            navigator.clipboard.writeText(codeEl.innerText || '').then(() => {
                copyBtn.innerHTML = `<i data-lucide="check" style="width:14px;height:14px;color:#10b981;"></i> Copied!`;
                setTimeout(() => {
                    copyBtn.innerHTML = `<i data-lucide="clipboard" style="width:14px;height:14px;"></i> Copy Code`;
                    if (window.lucide) window.lucide.createIcons();
                }, 2000);
                if (window.lucide) window.lucide.createIcons();
            });
        });
        wrapper.appendChild(copyBtn);
    });

    // E. Process Inline Attachment Shortcodes ([ATTACH: filename.zip])
    const allParagraphs = container.querySelectorAll('p, li, div');
    allParagraphs.forEach(el => {
        if (el.innerHTML.includes('[ATTACH:')) {
            el.innerHTML = el.innerHTML.replace(/\[ATTACH:\s*([^\]]+)\]/g, (match, fname) => {
                const cleanName = fname.trim();
                const matchedAtt = attachments.find(a => a.name.toLowerCase() === cleanName.toLowerCase()) || {
                    name: cleanName,
                    url: `/api/blog/attachments/${cleanName}`,
                    size_bytes: 512000,
                    type: 'archive'
                };
                return `
                    <span class="attachment-card" style="display:inline-flex; width:auto; margin:0.75rem 0; padding:0.8rem 1.25rem;">
                        <span class="attachment-info" style="gap:0.8rem;">
                            <span class="attachment-icon" style="width:36px;height:36px;"><i data-lucide="archive" style="width:18px;height:18px;"></i></span>
                            <span style="font-weight:700; color:white; margin-right:1rem;">${matchedAtt.name}</span>
                        </span>
                        <a href="${API_BASE_URL}${matchedAtt.url}" target="_blank" download="${matchedAtt.name}" class="btn-dl-artifact" style="padding:0.45rem 0.9rem; font-size:0.8rem;">
                            <i data-lucide="download" style="width:14px;height:14px;"></i> Download Inline
                        </a>
                    </span>
                `;
            });
        }
    });
}

async function appendAdminFeatureButton(postId, isFeatured) {
    if (!postId || window.location.pathname.includes('preview.html')) return;
    try {
        let u = JSON.parse(localStorage.getItem('phryco_user') || 'null');
        const token = localStorage.getItem('phryco_token');
        if (!u && token) {
            const res = await fetch(`${API_BASE_URL}/api/users/me`, { headers: { 'Authorization': `Bearer ${token}` } });
            if (res.ok) u = await res.json();
        }
        if (u && (u.role === 'ADMIN' || u.role === 'OWNER' || u.username === 'Phryco Inc.')) {
            const metaBar = document.querySelector('.article-meta-bar');
            if (metaBar && !document.getElementById('btn-feature-article')) {
                const btn = document.createElement('button');
                btn.id = 'btn-feature-article';
                btn.className = 'btn-feature-dispatch';
                btn.style.cssText = `background: ${isFeatured ? 'rgba(234, 179, 8, 0.2)' : 'rgba(255,255,255,0.08)'}; color: ${isFeatured ? '#facc15' : '#e2e8f0'}; border: 1px solid ${isFeatured ? '#facc15' : 'rgba(255,255,255,0.2)'}; padding: 0.35rem 0.85rem; border-radius: 8px; font-size: 0.8rem; font-weight: 700; cursor: pointer; display: inline-flex; align-items: center; gap: 0.4rem; margin-left: auto; transition: all 0.2s ease;`;
                btn.innerHTML = `<i data-lucide="star" style="width:14px;height:14px;fill: ${isFeatured ? '#facc15' : 'none'};color: ${isFeatured ? '#facc15' : '#e2e8f0'};"></i> ${isFeatured ? 'Featured Dispatch ★' : 'Set as Featured'}`;
                btn.onclick = async () => {
                    btn.disabled = true;
                    btn.innerHTML = `<i data-lucide="loader" class="animate-spin" style="width:14px;height:14px;"></i> Updating...`;
                    if (window.lucide) window.lucide.createIcons();
                    try {
                        const r = await fetch(`${API_BASE_URL}/api/blog/posts/${postId}/feature`, {
                            method: 'PUT',
                            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
                        });
                        if (!r.ok) throw new Error("Failed to designate as featured dispatch.");
                        alert("Article successfully designated as the Featured Dispatch!");
                        window.location.reload();
                    } catch (e) {
                        alert(e.message);
                        btn.disabled = false;
                        btn.innerHTML = `<i data-lucide="star" style="width:14px;height:14px;"></i> Set as Featured`;
                        if (window.lucide) window.lucide.createIcons();
                    }
                };
                metaBar.appendChild(btn);
                if (window.lucide) window.lucide.createIcons();
            }
        }
    } catch (err) {
        console.warn("Could not check admin governance role:", err);
    }
}
