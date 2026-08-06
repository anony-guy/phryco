import { API_BASE_URL } from '../../utils/config.js';

document.addEventListener('DOMContentLoaded', () => {
    let currentCategory = 'All';
    const featuredSection = document.getElementById('featured-section');
    const articlesGrid = document.getElementById('articles-grid');
    const filterPills = document.querySelectorAll('.filter-pill');

    function escapeHTML(str) {
        if (!str) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    function estimateReadTime(summary, title) {
        const words = (summary || '').split(' ').length + (title || '').split(' ').length;
        // Assume longer underlying content for deep technical dispatches
        const baseMin = Math.max(4, Math.ceil(words / 15) + 2);
        return `${baseMin} min read`;
    }

    function formatDate(dateString) {
        if (!dateString) return 'Just published';
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        } catch (e) {
            return 'Recent';
        }
    }

    function renderFeaturedHero(post) {
        if (!post) {
            featuredSection.innerHTML = '';
            return;
        }

        const readTime = estimateReadTime(post.summary, post.title);
        const dateFormatted = formatDate(post.created_at);
        const authorInitials = (post.author_name || 'PE').split(' ').map(w => w[0]).join('').substring(0, 2);
        const imageUrl = post.cover_image_url || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80';

        featuredSection.innerHTML = `
            <a href="article.html?slug=${encodeURIComponent(post.slug)}" class="hero-featured-card">
                <div class="featured-img-container">
                    <img src="${escapeHTML(imageUrl)}" alt="${escapeHTML(post.title)}" class="featured-img">
                    <div class="featured-badge-overlay">
                        <i data-lucide="zap" style="width: 14px; height: 14px; color: #a78bfa;"></i> Featured Dispatch
                    </div>
                </div>
                <div class="featured-content">
                    <div class="meta-tags">
                        <span>${escapeHTML(post.category)}</span>
                        <span>•</span>
                        <span>${readTime}</span>
                        <span>•</span>
                        <span>${dateFormatted}</span>
                    </div>
                    <h2 class="featured-title">${escapeHTML(post.title)}</h2>
                    <p class="featured-summary">${escapeHTML(post.summary)}</p>
                    <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 1rem;">
                        <div class="meta-author">
                            <div class="author-avatar">${escapeHTML(authorInitials)}</div>
                            <span>${escapeHTML(post.author_name || 'Phryco Editorial Engine')}</span>
                        </div>
                        <span class="read-action-btn">
                            Read Technical Dispatch <i data-lucide="arrow-right" style="width: 16px; height: 16px;"></i>
                        </span>
                    </div>
                </div>
            </a>
        `;
        if (window.lucide) window.lucide.createIcons();
    }

    function renderArticlesGrid(posts) {
        if (!posts || posts.length === 0) {
            articlesGrid.innerHTML = `
                <div style="grid-column: 1 / -1; text-align: center; padding: 4rem; background: rgba(255,255,255,0.02); border-radius: 16px; border: 1px dashed rgba(255,255,255,0.1);">
                    <i data-lucide="folder-open" style="width: 48px; height: 48px; color: #64748b; margin-bottom: 1rem; display: block; margin: 0 auto;"></i>
                    <h3 style="color: #cbd5e1; margin-top: 1rem;">No dispatches found in this category yet.</h3>
                    <p style="color: #64748b;">Our architecture team is writing new briefings. Check back soon!</p>
                </div>
            `;
            if (window.lucide) window.lucide.createIcons();
            return;
        }

        articlesGrid.innerHTML = posts.map(post => {
            const readTime = estimateReadTime(post.summary, post.title);
            const dateFormatted = formatDate(post.created_at);
            const authorInitials = (post.author_name || 'PE').split(' ').map(w => w[0]).join('').substring(0, 2);
            const imageUrl = post.cover_image_url || 'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?auto=format&fit=crop&w=800&q=80';

            return `
                <a href="article.html?slug=${encodeURIComponent(post.slug)}" class="article-card">
                    <div class="card-img-wrapper">
                        <img src="${escapeHTML(imageUrl)}" alt="${escapeHTML(post.title)}" class="card-img" loading="lazy">
                        <span class="card-category-badge">${escapeHTML(post.category)}</span>
                    </div>
                    <div class="card-body">
                        <div class="card-meta">
                            <span>${dateFormatted}</span>
                            <span>${readTime} • ${post.views_count || 0} views</span>
                        </div>
                        <h3 class="card-title">${escapeHTML(post.title)}</h3>
                        <p class="card-summary">${escapeHTML(post.summary)}</p>
                        <div class="card-footer">
                            <div class="footer-author">
                                <div class="author-avatar" style="width: 24px; height: 24px; font-size: 0.65rem;">${escapeHTML(authorInitials)}</div>
                                <span>${escapeHTML(post.author_name || 'Phryco Staff')}</span>
                            </div>
                            <span class="read-link">Read Dispatch ➔</span>
                        </div>
                    </div>
                </a>
            `;
        }).join('');

        if (window.lucide) window.lucide.createIcons();
    }

    async function fetchAndRenderPosts() {
        featuredSection.style.opacity = '0.5';
        articlesGrid.style.opacity = '0.5';

        try {
            const url = currentCategory === 'All' 
                ? `${API_BASE_URL}/api/blog/posts?limit=50` 
                : `${API_BASE_URL}/api/blog/posts?category=${encodeURIComponent(currentCategory)}&limit=50`;
                
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`HTTP error ${response.status}`);
            }

            const json = await response.json();
            const posts = json.data || [];

            if (currentCategory === 'All' && posts.length > 0) {
                // In 'All' view, promote the first article to Featured Hero
                renderFeaturedHero(posts[0]);
                renderArticlesGrid(posts.slice(1));
                featuredSection.style.display = 'block';
            } else {
                // In category views, show everything in the grid
                featuredSection.style.display = 'none';
                renderArticlesGrid(posts);
            }

            featuredSection.style.opacity = '1';
            articlesGrid.style.opacity = '1';
        } catch (err) {
            console.error('Failed to fetch blog dispatches:', err);
            featuredSection.innerHTML = `
                <div style="text-align: center; padding: 3rem; color: #ef4444; background: rgba(239,68,68,0.1); border-radius: 16px;">
                    <i data-lucide="alert-circle" style="width: 36px; height: 36px; margin: 0 auto 1rem; display: block;"></i>
                    <p>Failed to load Phryco editorial dispatches. Ensure the local API service is operational.</p>
                </div>
            `;
            articlesGrid.innerHTML = '';
            if (window.lucide) window.lucide.createIcons();
        }
    }

    // Filter pill events
    filterPills.forEach(pill => {
        pill.addEventListener('click', () => {
            filterPills.forEach(p => p.classList.remove('active'));
            pill.classList.add('active');
            currentCategory = pill.getAttribute('data-category') || 'All';
            fetchAndRenderPosts();
        });
    });

    fetchAndRenderPosts();
});
