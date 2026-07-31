import { apiFetch } from '../api/client.js';
import { API_BASE_URL } from '../utils/config.js';
import { escapeHTML } from '../utils/security.js';

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

function initThemeSwitcher() {
    const navLinks = document.querySelector('nav.nav-links');
    if (!navLinks) return;
    if (document.getElementById('theme-switcher')) return;
    
    const themeBtn = document.createElement('a');
    themeBtn.href = '#';
    themeBtn.id = 'theme-switcher';
    themeBtn.innerHTML = '<i data-lucide="moon"></i>';
    themeBtn.style.cursor = 'pointer';
    themeBtn.setAttribute('data-tooltip', 'Toggle Theme');
    
    const userMenu = document.querySelector('.user-menu-container');
    if (userMenu) {
        navLinks.insertBefore(themeBtn, userMenu);
    } else {
        navLinks.appendChild(themeBtn);
    }
    
    const currentTheme = localStorage.getItem('phryco_theme') || 'dark';
    if (currentTheme === 'light') {
        document.documentElement.setAttribute('data-theme', 'light');
        themeBtn.innerHTML = '<i data-lucide="sun"></i>';
    }
    
    themeBtn.addEventListener('click', (e) => {
        e.preventDefault();
        const theme = document.documentElement.getAttribute('data-theme');
        if (theme === 'light') {
            document.documentElement.removeAttribute('data-theme');
            localStorage.setItem('phryco_theme', 'dark');
            themeBtn.innerHTML = '<i data-lucide="moon"></i>';
        } else {
            document.documentElement.setAttribute('data-theme', 'light');
            localStorage.setItem('phryco_theme', 'light');
            themeBtn.innerHTML = '<i data-lucide="sun"></i>';
        }
        if (window.lucide) window.lucide.createIcons();
    });
}

document.addEventListener('DOMContentLoaded', () => {
    initHeader();
    initMobileMenu();
    initThemeSwitcher();
    initSearchBar();
    // We also need to run createIcons initially in case the main HTML hasn't.
    if (window.lucide) window.lucide.createIcons();
});
