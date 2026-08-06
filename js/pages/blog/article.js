document.addEventListener('DOMContentLoaded', () => {
    const headerBox = document.getElementById('article-header-box');
    const coverImageContainer = document.getElementById('cover-image-container');
    const articleBody = document.getElementById('article-body');
    const authorDossier = document.getElementById('author-dossier');
    const dossierAvatar = document.getElementById('dossier-avatar');
    const dossierName = document.getElementById('dossier-name');
    const relatedSection = document.getElementById('related-section');
    const relatedGrid = document.getElementById('related-grid');
    const progressBar = document.getElementById('reading-progress-bar');

    function escapeHTML(str) {
        if (!str) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    function estimateReadTime(text) {
        const words = (text || '').split(' ').length;
        const min = Math.max(3, Math.ceil(words / 150));
        return `${min} min read`;
    }

    function formatDate(dateString) {
        if (!dateString) return 'Just published';
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
        } catch (e) {
            return 'Recent';
        }
    }

    // Scroll progress handler
    window.addEventListener('scroll', () => {
        const docHeight = document.body.scrollHeight - window.innerHeight;
        if (docHeight > 0) {
            const scrolled = (window.scrollY / docHeight) * 100;
            progressBar.style.width = `${Math.min(100, Math.max(0, scrolled))}%`;
        } else {
            progressBar.style.width = '100%';
        }
    }, { passive: true });

    async function loadDispatch() {
        const params = new URLSearchParams(window.location.search);
        const slug = params.get('slug') || 'phryco-vs-the-world-comparison-with-mainstream-platforms';

        try {
            const response = await fetch(`/api/blog/posts/${encodeURIComponent(slug)}`);
            if (!response.ok) {
                throw new Error(`HTTP error ${response.status}`);
            }

            const post = await response.json();

            // Dynamic SEO Updates
            document.title = `${post.title || 'Dispatch'} - Phryco Editorial`;
            const metaDesc = document.querySelector('meta[name="description"]');
            if (metaDesc && post.summary) {
                metaDesc.setAttribute('content', post.summary);
            }

            const readTime = estimateReadTime(post.content || post.summary);
            const dateFormatted = formatDate(post.created_at);
            const authorName = post.author_name || 'Phryco Core Architecture Team';
            const authorInitials = authorName.split(' ').map(w => w[0]).join('').substring(0, 2);

            // Render Header
            headerBox.innerHTML = `
                <span class="article-category-tag">${escapeHTML(post.category || 'Engineering')}</span>
                <h1 class="article-main-title">${escapeHTML(post.title)}</h1>
                <div class="article-author-meta">
                    <div class="author-info-box">
                        <div class="author-avatar-lg">${escapeHTML(authorInitials)}</div>
                        <div class="author-details-text">
                            <span class="author-name">${escapeHTML(authorName)}</span>
                            <span class="publish-date">${dateFormatted}</span>
                        </div>
                    </div>
                    <div class="read-stats">
                        <span><i data-lucide="clock" style="width: 15px; height: 15px; vertical-align: middle; margin-right: 4px; color: #a78bfa;"></i> ${readTime}</span>
                        <span>•</span>
                        <span><i data-lucide="eye" style="width: 15px; height: 15px; vertical-align: middle; margin-right: 4px; color: #38bdf8;"></i> ${post.views_count || 1} views</span>
                    </div>
                </div>
            `;

            // Render Cover Banner if present
            if (post.cover_image_url) {
                coverImageContainer.innerHTML = `<img src="${escapeHTML(post.cover_image_url)}" alt="${escapeHTML(post.title)}" class="article-cover-banner" loading="eager">`;
            } else {
                coverImageContainer.innerHTML = '';
            }

            // Render Markdown Body safely via Marked & DOMPurify
            if (window.marked && window.DOMPurify) {
                const rawHTML = marked.parse(post.content || '');
                articleBody.innerHTML = DOMPurify.sanitize(rawHTML);
            } else {
                // Fallback text formatting if CDN fails
                articleBody.innerHTML = `<p>${escapeHTML(post.content).replace(/\n\n/g, '</p><p>')}</p>`;
            }

            // Populate Author Dossier
            dossierAvatar.textContent = authorInitials;
            dossierName.textContent = authorName;
            authorDossier.style.display = 'flex';

            // Render Related Articles
            if (post.related_posts && post.related_posts.length > 0) {
                relatedGrid.innerHTML = post.related_posts.map(r => {
                    const rDate = formatDate(r.created_at);
                    const rRead = estimateReadTime(r.summary);
                    return `
                        <a href="article.html?slug=${encodeURIComponent(r.slug)}" class="related-card">
                            <div>
                                <span style="font-size: 0.75rem; font-weight: 700; color: #a78bfa; text-transform: uppercase; letter-spacing: 0.05em;">${escapeHTML(r.category)}</span>
                                <h4>${escapeHTML(r.title)}</h4>
                                <p>${escapeHTML(r.summary)}</p>
                            </div>
                            <div style="display: flex; justify-content: space-between; align-items: center; font-size: 0.8rem; color: #64748b; margin-top: 1rem; border-top: 1px solid rgba(255,255,255,0.06); padding-top: 0.8rem;">
                                <span>${rDate}</span>
                                <span>${rRead}</span>
                            </div>
                        </a>
                    `;
                }).join('');
                relatedSection.style.display = 'block';
            } else {
                relatedSection.style.display = 'none';
            }

            if (window.lucide) {
                window.lucide.createIcons();
            }
        } catch (err) {
            console.error('Error loading article:', err);
            headerBox.innerHTML = `
                <div style="text-align: center; padding: 3rem; color: #ef4444; background: rgba(239,68,68,0.1); border-radius: 16px;">
                    <i data-lucide="alert-triangle" style="width: 38px; height: 38px; margin: 0 auto 1rem; display: block;"></i>
                    <h2>Dispatch Not Available</h2>
                    <p>The requested editorial article could not be retrieved from the Phryco API servers.</p>
                </div>
            `;
            articleBody.innerHTML = '';
            coverImageContainer.innerHTML = '';
            if (window.lucide) window.lucide.createIcons();
        }
    }

    loadDispatch();
});
