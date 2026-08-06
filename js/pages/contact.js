import { apiFetch } from '../api/client.js';

document.addEventListener('DOMContentLoaded', async () => {
    const slotsDisplay = document.getElementById('slots-remaining-display');
    const statusBox = document.getElementById('user-eligibility-status');
    const statusMsg = document.getElementById('status-message');
    const actionLink = document.getElementById('action-link');
    const formContainer = document.getElementById('commission-form-container');
    const lockedNotice = document.getElementById('commission-locked-notice');
    const myOrdersContainer = document.getElementById('my-orders-container');
    const myOrdersList = document.getElementById('my-orders-list');
    const applicationForm = document.getElementById('commission-application-form');
    const formFeedback = document.getElementById('form-submit-feedback');

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

    let slotsAvailable = 0;
    try {
        const slotData = await apiFetch('/api/commissions/slots');
        if (slotData && typeof slotData.remaining_slots !== 'undefined') {
            slotsAvailable = slotData.remaining_slots;
            if (slotsDisplay) {
                slotsDisplay.textContent = `${slotData.remaining_slots} / ${slotData.max_slots} Slots Available`;
                if (slotsAvailable <= 0) {
                    slotsDisplay.style.color = '#ef4444';
                }
            }
        }
    } catch (e) {
        console.error('Failed to load annual custom intake quota:', e);
    }

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
        if (lockedNotice) {
            lockedNotice.style.display = 'block';
            lockedNotice.textContent = 'Please log in with an active Supporter membership to unlock the application dashboard.';
        }
        return;
    }

    try {
        const user = await apiFetch('/api/users/me');
        const isEligible = user.role === 'SUPPORTER' || user.role === 'ADMIN' || user.role === 'OWNER';
        
        if (statusBox && statusMsg) {
            if (isEligible) {
                statusBox.className = 'user-status-bar status-authorized';
                statusMsg.textContent = `✅ Eligibility Verified: Welcome, ${user.username}! Your ${user.role} status grants you access to submit design applications.`;
                if (actionLink) actionLink.style.display = 'none';
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

        if (isEligible && slotsAvailable > 0) {
            if (formContainer) formContainer.style.display = 'block';
            if (lockedNotice) lockedNotice.style.display = 'none';
        } else {
            if (formContainer) formContainer.style.display = 'none';
            if (lockedNotice) {
                lockedNotice.style.display = 'block';
                if (!isEligible) {
                    lockedNotice.textContent = 'On-Demand application submission is restricted to active Supporters.';
                } else {
                    lockedNotice.textContent = 'Annual custom design intake quota has been reached for this year. Please check back later!';
                }
            }
        }

        // Fetch user's existing commission orders
        await loadMyOrders();

    } catch (e) {
        console.error('Error verifying Supporter eligibility:', e);
        if (statusBox && statusMsg) {
            statusBox.className = 'user-status-bar status-unauthorized';
            statusMsg.textContent = 'Could not confirm role eligibility with server. Please refresh.';
        }
    }

    async function loadMyOrders() {
        try {
            const data = await apiFetch('/api/commissions/my');
            if (data && data.orders && data.orders.length > 0) {
                if (myOrdersContainer) myOrdersContainer.style.display = 'block';
                if (myOrdersList) {
                    myOrdersList.innerHTML = data.orders.map(o => {
                        const badgeColor = getStatusBadgeColor(o.status);
                        const quoteText = o.price_quote ? `<strong>Real-Currency Quote:</strong> <span style="color:#10b981;">${o.price_quote}</span>` : `<span style="color: #94a3b8;">Quote Pending Designer Review</span>`;
                        const lockBadge = o.is_locked ? `<span style="margin-left:8px; color: #fca5a5; font-size: 0.8rem;">🔒 Locked</span>` : '';
                        
                        return `
                        <div class="order-summary-card">
                            <div>
                                <div style="display:flex; align-items:center; gap: 0.75rem; margin-bottom: 0.4rem;">
                                    <span class="badge-status" style="background: ${badgeColor.bg}; color: ${badgeColor.fg};">${o.status}</span>
                                    <span style="color: var(--text-secondary); font-size: 0.85rem;">${o.service_type}</span>
                                    ${lockBadge}
                                </div>
                                <h4 style="color: white; font-size: 1.1rem; margin: 0 0 0.4rem 0;">${o.title}</h4>
                                <div style="font-size: 0.9rem;">${quoteText}</div>
                            </div>
                            <a href="../../pages/contact/thread.html?id=${o.id}" class="btn-outline" style="padding: 0.6rem 1.2rem; font-weight: 600; text-decoration:none; white-space:nowrap; border-color: var(--neon-cyan); color: var(--neon-cyan); display: flex; align-items: center; gap: 0.4rem;">
                                <i data-lucide="message-square-more" style="width:16px; height:16px;"></i> Open Thread
                            </a>
                        </div>
                        `;
                    }).join('');
                    if (typeof lucide !== 'undefined') lucide.createIcons();
                }
            } else {
                if (myOrdersContainer) myOrdersContainer.style.display = 'none';
            }
        } catch (e) {
            console.error('Error loading user commission orders:', e);
        }
    }

    function getStatusBadgeColor(status) {
        const s = status.toUpperCase();
        if (s.includes('PAID') || s === 'COMPLETED' || s === 'ACCEPTED') return { bg: 'rgba(16, 185, 129, 0.2)', fg: '#10b981' };
        if (s === 'IN_PROGRESS') return { bg: 'rgba(59, 130, 246, 0.2)', fg: '#3b82f6' };
        if (s === 'REJECTED' || s === 'CANCELLED') return { bg: 'rgba(239, 68, 68, 0.2)', fg: '#ef4444' };
        if (s.includes('LOCKED')) return { bg: 'rgba(245, 158, 11, 0.2)', fg: '#f59e0b' };
        return { bg: 'rgba(148, 163, 184, 0.2)', fg: '#cbd5e1' };
    }

    if (applicationForm) {
        applicationForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const submitBtn = document.getElementById('submit-commission-btn');
            const serviceType = document.getElementById('form-service-type')?.value;
            const title = document.getElementById('form-project-title')?.value;
            const requirements = document.getElementById('form-requirements')?.value;

            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.innerHTML = '<i data-lucide="loader" class="spinner"></i> Submitting Request...';
                if (typeof lucide !== 'undefined') lucide.createIcons();
            }

            try {
                const res = await apiFetch('/api/commissions', {
                    method: 'POST',
                    body: JSON.stringify({
                        service_type: serviceType,
                        title: title,
                        requirements: requirements
                    })
                });

                if (formFeedback) {
                    formFeedback.style.color = '#10b981';
                    formFeedback.textContent = '✅ Application submitted! Redirecting to your private order thread...';
                }

                setTimeout(() => {
                    window.location.href = `../../pages/contact/thread.html?id=${res.order_id}`;
                }, 1500);
            } catch (err) {
                console.error('Error submitting application:', err);
                if (formFeedback) {
                    formFeedback.style.color = '#ef4444';
                    formFeedback.textContent = err.message || 'Error submitting commission application. Please try again.';
                }
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = '<i data-lucide="sparkles"></i> Submit Application & Open Order Thread';
                    if (typeof lucide !== 'undefined') lucide.createIcons();
                }
            }
        });
    }
});
