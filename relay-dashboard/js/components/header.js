export function renderHeader(user) {
    const isRelaysPage = window.location.pathname.includes('/index.html') || window.location.pathname.endsWith('/relay-dashboard/') || window.location.pathname.endsWith('/relay-dashboard');
    const isDeveloperPage = window.location.pathname.includes('/developer.html');
    
    // If regular user (not admin), redirect away from relays page
    if (user.role !== 'ADMIN' && user.role !== 'OWNER' && isRelaysPage) {
        window.location.href = '/relay-dashboard/developer.html';
        return;
    }

    let navHtml = '';
    
    // Only show Relays tab to admins/owners
    if (user.role === 'ADMIN' || user.role === 'OWNER') {
        navHtml += `
            <a href="/relay-dashboard/index.html" class="nav-link ${isRelaysPage ? 'active' : ''}">Relays</a>
        `;
    }
    
    navHtml += `
        <a href="/relay-dashboard/developer.html" class="nav-link ${isDeveloperPage ? 'active' : ''}">Developer Portal</a>
    `;

    const header = document.createElement('header');
    header.innerHTML = `
        <div class="logo">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="#1a73e8"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14.5v-9l6 4.5-6 4.5z"/></svg>
            <span>Phryco</span> Network
        </div>
        <nav class="top-nav">
            ${navHtml}
        </nav>
        <div class="header-right">
            <span id="user-greeting" style="margin-right: 16px; font-size: 14px; font-weight: 500;">Hello, ${user.username}</span>
            <button id="logout-btn" class="btn btn-secondary">Logout</button>
        </div>
    `;

    // Insert header at top of body
    document.body.insertBefore(header, document.body.firstChild);
    
    document.getElementById('logout-btn').addEventListener('click', () => {
        localStorage.removeItem('relay_sso_token');
        window.location.href = '/relay-dashboard/login.html';
    });
}
