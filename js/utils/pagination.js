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
