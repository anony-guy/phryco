import { apiFetch } from '../api/client.js';

export class InfiniteScroller {
    /**
     * @param {Object} options
     * @param {string} options.endpoint - The API endpoint to fetch data from.
     * @param {HTMLElement} options.container - The DOM element where items will be appended.
     * @param {Function} options.renderCallback - A function that takes the array of fetched items and renders them inside the container.
     * @param {number} [options.limit=20] - Number of items to fetch per request.
     * @param {string} [options.sentinelTagName='div'] - The HTML tag to use for the sentinel element.
     * @param {string} [options.sentinelHTML=''] - Inner HTML of the sentinel.
     * @param {string} [options.emptyHTML='<p style="color: var(--text-secondary); padding: 2rem;">No items found.</p>'] - HTML to display if the first fetch is empty.
     */
    constructor({
        endpoint,
        container,
        renderCallback,
        limit = 20,
        sentinelTagName = 'div',
        sentinelHTML = '<div style="text-align: center; padding: 2rem; color: var(--text-secondary); width: 100%;"><i class="lucide-loader animate-spin" style="width: 24px; height: 24px; display: inline-block;"></i> Loading more...</div>',
        emptyHTML = '<div style="text-align: center; padding: 2rem; color: var(--text-secondary); width: 100%;">No items found.</div>',
        transformResponse = null
    }) {
        this.endpoint = endpoint;
        this.container = container;
        this.renderCallback = renderCallback;
        this.limit = limit;
        this.skip = 0;
        this.isFetching = false;
        this.hasMore = true;
        this.emptyHTML = emptyHTML;
        this.transformResponse = transformResponse;

        // Create the sentinel element
        this.sentinel = document.createElement(sentinelTagName);
        this.sentinel.innerHTML = sentinelHTML;
        this.sentinel.style.display = 'none';
        
        // If container is a tbody, we shouldn't append it outside. 
        // We will append the sentinel right after the container (if it's a grid) or inside it at the bottom.
        // It's safest to append it as a child of the container for grid layouts, or as a sibling row for tables.
        if (sentinelTagName.toLowerCase() === 'tr') {
            this.container.appendChild(this.sentinel);
        } else {
            // For flex/grid, we can just append it
            this.container.appendChild(this.sentinel);
        }

        this.observer = new IntersectionObserver((entries) => {
            if (entries[0].isIntersecting && this.hasMore && !this.isFetching) {
                this.loadMore();
            }
        }, {
            root: null,
            rootMargin: '200px', // Fetch 200px before the user hits the bottom
            threshold: 0
        });

        this.observer.observe(this.sentinel);
    }

    /**
     * Resets the scroller and performs the initial fetch.
     */
    async initialize() {
        this.skip = 0;
        this.hasMore = true;
        this.isFetching = false;
        // Keep the sentinel, but clear everything else
        Array.from(this.container.children).forEach(child => {
            if (child !== this.sentinel) {
                child.remove();
            }
        });
        await this.loadMore();
    }

    async loadMore() {
        if (this.isFetching || !this.hasMore) return;
        this.isFetching = true;
        this.sentinel.style.display = '';

        try {
            // Build the URL with skip and limit
            const url = new URL(this.endpoint, window.location.origin);
            url.searchParams.set('skip', this.skip);
            url.searchParams.set('limit', this.limit);

            // Fetch data
            const response = await apiFetch(url.pathname + url.search);
            const items = this.transformResponse ? this.transformResponse(response) : response;
            
            let count = 0;
            if (Array.isArray(items)) {
                count = items.length;
            } else if (items && typeof items === 'object') {
                count = Object.values(items).reduce((acc, val) => acc + (Array.isArray(val) ? val.length : 0), 0);
            }

            if (!items || count === 0) {
                this.hasMore = false;
                this.sentinel.style.display = 'none';
                
                // If it's the very first load and it's empty
                if (this.skip === 0) {
                    this.sentinel.insertAdjacentHTML('beforebegin', this.emptyHTML);
                } else {
                    // Optional: show "end of list" message
                    this.sentinel.insertAdjacentHTML('beforebegin', `<div style="text-align: center; padding: 2rem; color: var(--text-secondary); width: 100%; font-size: 0.9rem;">You've reached the end.</div>`);
                }
            } else {
                // We need to detach the sentinel temporarily so the renderCallback doesn't get confused, 
                // but actually it's better to just pass the data and let the callback insertBefore the sentinel.
                this.renderCallback(items, this.sentinel);
                
                this.skip += this.limit; // Use limit instead of count for skip because the backend uses limit/offset strictly
                
                if (count < this.limit) {
                    this.hasMore = false;
                    this.sentinel.style.display = 'none';
                    this.sentinel.insertAdjacentHTML('beforebegin', `<div style="text-align: center; padding: 2rem; color: var(--text-secondary); width: 100%; font-size: 0.9rem;">You've reached the end.</div>`);
                }
            }
            if (window.lucide) window.lucide.createIcons();
        } catch (error) {
            console.error('Error fetching paginated data:', error);
            this.sentinel.innerHTML = '<span style="color: var(--danger);">Failed to load data. Please try again.</span>';
        } finally {
            this.isFetching = false;
            if (!this.hasMore) {
                this.observer.disconnect();
            }
        }
    }

    destroy() {
        if (this.observer) {
            this.observer.disconnect();
        }
        if (this.sentinel && this.sentinel.parentNode) {
            this.sentinel.parentNode.removeChild(this.sentinel);
        }
    }
}

/**
 * ManualPager — like InfiniteScroller but the user explicitly clicks
 * "Load more" instead of auto-triggering on scroll. Ideal for comment
 * sections where auto-loading blocks access to content below.
 */
export class ManualPager {
    constructor({
        endpoint,
        container,
        renderCallback,
        limit = 20,
        emptyHTML = '<div style="text-align:center;padding:2rem;color:var(--text-secondary);">No items found.</div>',
        transformResponse = null,
        buttonLabel = 'Load more',
        endLabel = 'All loaded'
    }) {
        this.endpoint = endpoint;
        this.container = container;
        this.renderCallback = renderCallback;
        this.limit = limit;
        this.skip = 0;
        this.isFetching = false;
        this.hasMore = true;
        this.emptyHTML = emptyHTML;
        this.transformResponse = transformResponse;
        this.buttonLabel = buttonLabel;
        this.endLabel = endLabel;

        this._btn = document.createElement('div');
        this._btn.style.cssText = 'text-align:center;padding:1rem 0;';
        this.container.appendChild(this._btn);
    }

    async initialize() {
        this.skip = 0;
        this.hasMore = true;
        this.isFetching = false;
        Array.from(this.container.children).forEach(child => {
            if (child !== this._btn) child.remove();
        });
        await this._fetch();
    }

    async _fetch() {
        if (this.isFetching || !this.hasMore) return;
        this.isFetching = true;
        this._btn.innerHTML = '<span style="color:var(--text-secondary);font-size:0.875rem;">Loading...</span>';

        try {
            const url = new URL(this.endpoint, window.location.origin);
            url.searchParams.set('skip', this.skip);
            url.searchParams.set('limit', this.limit);

            const { apiFetch } = await import('../api/client.js');
            const response = await apiFetch(url.pathname + url.search);
            const items = this.transformResponse ? this.transformResponse(response) : response;
            const count = Array.isArray(items) ? items.length : 0;

            if (!items || count === 0) {
                this.hasMore = false;
                if (this.skip === 0) {
                    this._btn.insertAdjacentHTML('beforebegin', this.emptyHTML);
                }
                this._btn.innerHTML = `<span style="color:var(--text-secondary);font-size:0.8rem;">${this.endLabel}</span>`;
            } else {
                this.renderCallback(items, this._btn);
                this.skip += this.limit;
                if (count < this.limit) {
                    this.hasMore = false;
                    this._btn.innerHTML = `<span style="color:var(--text-secondary);font-size:0.8rem;">${this.endLabel}</span>`;
                } else {
                    this._btn.innerHTML = `<button style="background:var(--bg-secondary);border:1px solid var(--border-color);color:var(--text-primary);padding:0.5rem 1.5rem;border-radius:var(--radius-md);cursor:pointer;font-size:0.875rem;font-weight:600;transition:all 0.2s;" onmouseover="this.style.borderColor='var(--accent-primary)'" onmouseout="this.style.borderColor='var(--border-color)'" onclick="this.closest('[data-pager]')?.__pager?.loadMore()">${this.buttonLabel}</button>`;
                    // Store reference for the button's onclick
                    this.container.setAttribute('data-pager', '1');
                    this.container.__pager = this;
                }
            }
            if (window.lucide) window.lucide.createIcons();
        } catch (err) {
            console.error('ManualPager fetch error:', err);
            this._btn.innerHTML = `<span style="color:var(--danger);font-size:0.875rem;">Failed to load. <button onclick="this.closest('[data-pager]').__pager?.loadMore()" style="color:var(--accent-primary);background:none;border:none;cursor:pointer;">Retry</button></span>`;
        } finally {
            this.isFetching = false;
        }
    }

    loadMore() {
        this._fetch();
    }

    destroy() {
        if (this._btn && this._btn.parentNode) {
            this._btn.parentNode.removeChild(this._btn);
        }
    }
}
