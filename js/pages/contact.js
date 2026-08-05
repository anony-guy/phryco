import { apiFetch } from '../api/client.js';

document.addEventListener('DOMContentLoaded', async () => {
    const copyBtn = document.getElementById('copy-discord-btn');
    const copyFeedback = document.getElementById('copy-feedback');
    const statusBox = document.getElementById('user-eligibility-status');
    const statusMsg = document.getElementById('status-message');
    const actionLink = document.getElementById('action-link');
    
    // Interactive Discord Copy Mechanism
    if (copyBtn) {
        copyBtn.addEventListener('click', async () => {
            const discordHandle = document.getElementById('discord-handle')?.textContent || 'painsel';
            try {
                await navigator.clipboard.writeText(discordHandle);
                if (copyFeedback) {
                    copyFeedback.textContent = '✅ Copied! Open Discord and direct message painsel with your channel theme specifications.';
                    copyFeedback.style.color = '#10b981';
                    copyFeedback.style.fontWeight = '600';
                    
                    setTimeout(() => {
                        copyFeedback.textContent = 'Click to copy Discord handle to clipboard';
                        copyFeedback.style.color = 'var(--text-secondary)';
                        copyFeedback.style.fontWeight = 'normal';
                    }, 4000);
                }
            } catch (err) {
                console.error('Failed to copy Discord handle:', err);
                if (copyFeedback) {
                    copyFeedback.textContent = '❌ Could not auto-copy. Please manually add Discord username: painsel';
                    copyFeedback.style.color = '#ef4444';
                }
            }
        });
    }

    // Interactive Service Card Tilt Effect for premium feel
    const cards = document.querySelectorAll('.service-card');
    cards.forEach(card => {
        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;
            
            const rotateX = ((y - centerY) / centerY) * -5;
            const rotateY = ((x - centerX) / centerX) * 5;
            
            card.style.transform = `perspective(1000px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg) translateY(-4px)`;
        });
        
        card.addEventListener('mouseleave', () => {
            card.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) translateY(0)';
        });
    });

    // Check Authentication & Supporter Eligibility Status
    const token = localStorage.getItem('phryco_token');
    if (!token) {
        if (statusBox && statusMsg) {
            statusBox.className = 'user-status-bar status-unauthorized';
            statusMsg.textContent = 'You are not logged in. On-Demand custom channel themes require an active Supporter membership.';
            if (actionLink) {
                actionLink.style.display = 'inline-block';
                actionLink.textContent = 'Log In to Verify';
                actionLink.href = '../../pages/login/index.html';
            }
        }
        return;
    }

    try {
        const user = await apiFetch('/api/users/me');
        if (statusBox && statusMsg) {
            const isEligible = user.role === 'SUPPORTER' || user.role === 'ADMIN' || user.role === 'OWNER';
            
            if (isEligible) {
                statusBox.className = 'user-status-bar status-authorized';
                statusMsg.textContent = `✅ Eligibility Verified: Welcome, ${user.username}! Your ${user.role} status grants you immediate access to submit design orders.`;
                if (actionLink) {
                    actionLink.style.display = 'none';
                }
            } else {
                statusBox.className = 'user-status-bar status-unauthorized';
                statusMsg.textContent = `⚠️ Notice (${user.username} - Standard User): Custom design commissions and webring installations are restricted to active Supporters.`;
                if (actionLink) {
                    actionLink.style.display = 'inline-block';
                    actionLink.textContent = 'Upgrade to Supporter';
                    actionLink.href = '../../pages/shop/index.html';
                }
            }
        }
    } catch (e) {
        console.error('Error fetching user profile for custom theme eligibility check:', e);
        if (statusBox && statusMsg) {
            statusBox.className = 'user-status-bar status-unauthorized';
            statusMsg.textContent = 'Could not communicate with server to confirm role eligibility. Please refresh or try again later.';
        }
    }
});
