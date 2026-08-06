import { apiFetch } from '../api/client.js';
import { API_BASE_URL } from '../utils/config.js';
import { escapeHTML } from '../utils/security.js';
import { customizer } from './ui_customizer.js';

function initBrandingAndAnimations() {
    const logoEl = document.querySelector('header .logo');
    if (logoEl) {
        const logoPath = '/assets/phryco-logo-animated.svg';
        logoEl.innerHTML = `
            <img src="${logoPath}" alt="Phryco" style="height: 42px; width: auto; object-fit: contain; background: transparent; filter: drop-shadow(0 2px 10px rgba(99,102,241,0.4)); transition: transform 0.25s ease;">
        `;
        logoEl.onmouseover = () => { const img = logoEl.querySelector('img'); if(img) img.style.transform = 'scale(1.05)'; };
        logoEl.onmouseout = () => { const img = logoEl.querySelector('img'); if(img) img.style.transform = 'scale(1)'; };
    }

    const pbBadge = document.getElementById('phrybucks-display');
    if (pbBadge && !pbBadge.querySelector('.coin-anim')) {
        const iconContainer = document.createElement('span');
        iconContainer.className = 'coin-anim';
        iconContainer.style.cssText = 'display: inline-flex; align-items: center; justify-content: center; width: 22px; height: 22px; filter: drop-shadow(0 0 8px rgba(251, 191, 36, 0.7)); margin-right: 4px;';
        iconContainer.innerHTML = `
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="12" cy="12" r="10" fill="url(#coin-radial)" stroke="#f59e0b" stroke-width="1.5">
                    <animate attributeName="opacity" values="0.9;1;0.9" dur="2s" repeatCount="indefinite" />
                </circle>
                <path d="M12 6.5V17.5M8.5 10H14.5C15.5 10 16 10.8 16 11.8C16 12.8 15.5 13.5 14.5 13.5H9.5C8.5 13.5 8 14.2 8 15.2C8 16.2 8.5 17 9.5 17H15.5" stroke="#78350f" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <defs>
                    <radialGradient id="coin-radial" cx="30%" cy="30%" r="70%">
                        <stop offset="0%" stop-color="#fef08a" />
                        <stop offset="50%" stop-color="#f59e0b" />
                        <stop offset="100%" stop-color="#92400e" />
                    </radialGradient>
                </defs>
            </svg>
        `;
        const oldIcon = pbBadge.querySelector('i[data-lucide="coins"]');
        if (oldIcon) oldIcon.replaceWith(iconContainer);
        else pbBadge.insertBefore(iconContainer, pbBadge.firstChild);
    }
}

// Setup User Dropdown
async function initHeader() {
    const userBtn = document.getElementById('user-menu-btn');
    const dropdown = document.getElementById('user-dropdown');
    
    if (!userBtn || !dropdown) return;
    
    let isDropdownOpen = false;
    
    userBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        isDropdownOpen = !isDropdownOpen;
        dropdown.style.display = isDropdownOpen ? 'flex' : 'none';
    });
    
    document.addEventListener('click', (e) => {
        if (isDropdownOpen && !dropdown.contains(e.target)) {
            isDropdownOpen = false;
            dropdown.style.display = 'none';
        }
    });
    
    const token = localStorage.getItem('phryco_token');
    
    if (token) {
        try {
            const user = await apiFetch('/api/users/me');
            localStorage.setItem('phryco_user', JSON.stringify(user));
            
            // Update Phrybucks badge
            const pbBalance = document.getElementById('pb-balance');
            if (pbBalance && user.phrybucks_balance !== undefined) {
                pbBalance.textContent = `${user.phrybucks_balance} PB`;
            }
            
            // Render logged-in dropdown state
            const avatarUrl = `${API_BASE_URL}/api/users/${user.username}/avatar`;
            
            // Update the top icon to the avatar
            userBtn.innerHTML = `<img src="${avatarUrl}" style="width: 100%; height: 100%; object-fit: cover;" onerror="this.outerHTML='<i data-lucide=\\'user\\' style=\\'color: var(--text-secondary);\\'></i>'">`;
            
            let adminLink = '';
            if (user.role === 'ADMIN' || user.role === 'OWNER') {
                adminLink = `<a href="../../pages/dashboard/index.html" class="dropdown-item" style="color: var(--phrybucks-gold);"><i data-lucide="shield" style="width: 16px; height: 16px;"></i> Admin Dashboard</a>`;
            }
            
            dropdown.innerHTML = `
                <div class="dropdown-header">
                    <img src="${avatarUrl}" onerror="this.src=''; this.style.display='none';" class="dropdown-avatar">
                    <div class="dropdown-user-info">
                        <strong>${escapeHTML(user.username)}</strong>
                    </div>
                </div>
                <div class="dropdown-divider"></div>
                <a href="../../pages/studio/index.html" class="dropdown-item"><i data-lucide="video" style="width: 16px; height: 16px;"></i> Studio</a>
                <a href="../../pages/services/index.html" class="dropdown-item"><i data-lucide="layers" style="width: 16px; height: 16px; color: #ec4899;"></i> Services Hub</a>
                <a href="#" id="dropdown-settings-btn" class="dropdown-item"><i data-lucide="settings" style="width: 16px; height: 16px;"></i> Settings</a>
                ${adminLink}
                <div class="dropdown-divider"></div>
                <a href="#" id="dropdown-logout-btn" class="dropdown-item"><i data-lucide="log-out" style="width: 16px; height: 16px;"></i> Sign Out</a>
            `;
            
            // Bind settings button
            document.getElementById('dropdown-settings-btn').addEventListener('click', (e) => {
                e.preventDefault();
                window.location.href = '../../pages/settings/index.html';
                dropdown.style.display = 'none';
                isDropdownOpen = false;
            });
            
            // Bind logout button
            document.getElementById('dropdown-logout-btn').addEventListener('click', (e) => {
                e.preventDefault();
                localStorage.removeItem('phryco_token');
                window.location.reload();
            });
            
        } catch (error) {
            // Token invalid or network error
            renderLoggedOutDropdown(dropdown);
        }
    } else {
        renderLoggedOutDropdown(dropdown);
    }
    
    if (window.lucide) {
        window.lucide.createIcons();
    }
}

function renderLoggedOutDropdown(dropdown) {
    dropdown.innerHTML = `
        <a href="../../pages/login/index.html" class="dropdown-item"><i data-lucide="log-in" style="width: 16px; height: 16px;"></i> Sign In</a>
        <a href="../../pages/signup/index.html" class="dropdown-item"><i data-lucide="user-plus" style="width: 16px; height: 16px;"></i> Sign Up</a>
    `;
}



function initSearchBar() {
    const searchInputs = document.querySelectorAll('.search-bar input');
    searchInputs.forEach(input => {
        const container = input.parentElement;
        container.style.position = 'relative';
        
        const typeahead = document.createElement('div');
        typeahead.className = 'typeahead-dropdown';
        typeahead.style.cssText = 'position:absolute; top:100%; left:0; right:0; background:var(--bg-secondary); border:1px solid var(--border-color); border-radius:var(--radius-md); box-shadow:var(--shadow-glass); z-index:1000; display:none; flex-direction:column; margin-top:4px; max-height:300px; overflow-y:auto;';
        container.appendChild(typeahead);
        
        let debounceTimer;
        
        input.addEventListener('input', (e) => {
            clearTimeout(debounceTimer);
            const query = e.target.value.trim();
            
            if (!query) {
                typeahead.style.display = 'none';
                return;
            }
            
            debounceTimer = setTimeout(async () => {
                try {
                    const data = await apiFetch(`/api/videos?search=${encodeURIComponent(query)}&limit=5`);
                    if (data && data.length > 0) {
                        typeahead.innerHTML = '';
                        data.forEach(video => {
                            const item = document.createElement('a');
                            item.href = `/pages/watch/index.html?v=${video.id}`;
                            item.style.cssText = 'padding: 0.75rem 1rem; color: var(--text-primary); text-decoration: none; border-bottom: 1px solid var(--border-color); display:flex; align-items:center; gap:0.5rem; transition: background var(--transition-fast);';
                            item.onmouseover = () => item.style.background = 'rgba(255,255,255,0.05)';
                            item.onmouseout = () => item.style.background = 'transparent';
                            item.innerHTML = `<i data-lucide="search" style="width:14px; height:14px; color:var(--text-secondary);"></i> <span style="white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${escapeHTML(video.title)}</span>`;
                            typeahead.appendChild(item);
                        });
                        typeahead.style.display = 'flex';
                        if (window.lucide) window.lucide.createIcons();
                    } else {
                        typeahead.style.display = 'none';
                    }
                } catch (err) {
                    typeahead.style.display = 'none';
                }
            }, 300);
        });
        
        document.addEventListener('click', (e) => {
            if (!container.contains(e.target)) {
                typeahead.style.display = 'none';
            }
        });
        
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                const query = e.target.value.trim();
                if (query) {
                    window.location.href = `/pages/search/index.html?q=${encodeURIComponent(query)}`;
                }
            }
        });
    });
}

function initMobileMenu() {
    const header = document.querySelector('header');
    if (!header) return;
    
    // Check if it's already there
    if (document.getElementById('mobile-menu-btn')) return;
    
    const menuBtn = document.createElement('button');
    menuBtn.id = 'mobile-menu-btn';
    menuBtn.innerHTML = '<i data-lucide="menu"></i>';
    header.insertBefore(menuBtn, header.firstChild);
    
    const sidebar = document.querySelector('aside.sidebar');
    if (sidebar) {
        const overlay = document.createElement('div');
        overlay.className = 'sidebar-overlay';
        document.body.appendChild(overlay);
        
        menuBtn.addEventListener('click', () => {
            sidebar.classList.toggle('mobile-open');
            overlay.classList.toggle('active');
        });
        
        overlay.addEventListener('click', () => {
            sidebar.classList.remove('mobile-open');
            overlay.classList.remove('active');
        });
    }
}

function initMobileSearch() {
    const header = document.querySelector('header');
    const searchBar = document.querySelector('.search-bar-container') || document.querySelector('.search-bar');
    const navLinks = document.querySelector('nav.nav-links');
    
    if (!header || !searchBar || !navLinks || document.getElementById('mobile-search-toggle')) return;

    const toggleBtn = document.createElement('a');
    toggleBtn.href = '#';
    toggleBtn.id = 'mobile-search-toggle';
    toggleBtn.className = 'icon-btn mobile-search-btn';
    toggleBtn.title = 'Toggle Search';
    toggleBtn.innerHTML = '<i data-lucide="search" style="width: 18px; height: 18px;"></i>';

    toggleBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        searchBar.classList.toggle('mobile-active');
        const input = searchBar.querySelector('input');
        if (searchBar.classList.contains('mobile-active') && input) {
            input.focus();
        }
    });

    document.addEventListener('click', (e) => {
        if (searchBar.classList.contains('mobile-active') && !searchBar.contains(e.target) && !toggleBtn.contains(e.target)) {
            searchBar.classList.remove('mobile-active');
        }
    });

    navLinks.insertBefore(toggleBtn, navLinks.firstChild);
}

function initThemeSwitcher() {
    const navLinks = document.querySelector('nav.nav-links');
    if (!navLinks) return;
    const userMenu = document.querySelector('.user-menu-container');
    customizer.initTrigger(navLinks, userMenu);
}

function initResponsiveLayout() {
    const sidebar = document.querySelector('aside.sidebar');
    const navLinks = document.querySelector('nav.nav-links');
    if (!sidebar || !navLinks) return;

    function handleResize() {
        const userMenu = document.querySelector('.user-menu-container');
        const themesBtn = document.getElementById('ui-customizer-btn');
        const isMobile = window.innerWidth <= 768;
        const sidebarFooter = sidebar.querySelector('.sidebar-footer');

        if (isMobile) {
            if (themesBtn && themesBtn.parentElement !== sidebar) {
                if (sidebarFooter) {
                    sidebar.insertBefore(themesBtn, sidebarFooter);
                } else {
                    sidebar.appendChild(themesBtn);
                }
                themesBtn.style.margin = '1rem';
                themesBtn.style.display = 'flex';
                themesBtn.style.justifyContent = 'flex-start';
                themesBtn.style.width = 'calc(100% - 2rem)';
            }
            if (userMenu && userMenu.parentElement !== sidebar) {
                if (sidebarFooter) {
                    sidebar.insertBefore(userMenu, sidebarFooter);
                } else {
                    sidebar.appendChild(userMenu);
                }
                userMenu.style.margin = '0.5rem 1rem';
                userMenu.style.display = 'flex';
                userMenu.style.justifyContent = 'flex-start';
                userMenu.style.width = 'calc(100% - 2rem)';
            }
        } else {
            if (userMenu && userMenu.parentElement !== navLinks) {
                navLinks.appendChild(userMenu);
                userMenu.style = '';
            }
            if (themesBtn && themesBtn.parentElement !== navLinks) {
                if (userMenu) {
                    navLinks.insertBefore(themesBtn, userMenu);
                } else {
                    navLinks.appendChild(themesBtn);
                }
                themesBtn.style = '';
            }
        }
    }

    // Call once initially and add event listener
    handleResize();
    window.addEventListener('resize', handleResize);
}

document.addEventListener('DOMContentLoaded', () => {
    initBrandingAndAnimations();
    initHeader();
    initMobileMenu();
    initMobileSearch();
    initThemeSwitcher();
    initSearchBar();
    initResponsiveLayout();
    if (window.lucide) window.lucide.createIcons();
});
