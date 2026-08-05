import { apiFetch } from '../api/client.js';
import { showToast } from '../utils/toast.js';

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('redeem-form');
    const input = document.getElementById('promo-input');
    const submitBtn = document.getElementById('submit-btn');
    const redeemCard = document.getElementById('redeem-card');
    const successCard = document.getElementById('success-card');
    const successDetails = document.getElementById('success-details');

    if (!form) return;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const token = localStorage.getItem('phryco_token');
        if (!token) {
            showToast("Please sign in to redeem VIP promo codes.", "error");
            window.location.href = '../../pages/login/index.html';
            return;
        }

        const code = input.value.trim().toUpperCase();
        if (!code) {
            showToast("Please enter a valid promo code.", "warning");
            return;
        }

        submitBtn.disabled = true;
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<i data-lucide="loader" class="animate-spin" style="width:20px;height:20px;"></i> Verifying Code...';
        if (window.lucide) window.lucide.createIcons();

        try {
            const res = await apiFetch('/api/promo/redeem', {
                method: 'POST',
                body: { code: code }
            });

            // Re-fetch user to refresh balance display in header
            try {
                const freshUser = await apiFetch('/api/users/me');
                localStorage.setItem('phryco_user', JSON.stringify(freshUser));
                const pbBalance = document.getElementById('pb-balance');
                if (pbBalance && freshUser.phrybucks_balance !== undefined) {
                    pbBalance.textContent = `${parseFloat(freshUser.phrybucks_balance).toFixed(0)} PB`;
                }
            } catch (e) {
                console.warn("Could not refresh user header balance after promo redemption", e);
            }

            redeemCard.style.display = 'none';
            successCard.style.display = 'flex';
            successDetails.textContent = res.message || "Your VIP Promo Code has been applied successfully!";
            if (window.lucide) window.lucide.createIcons();

        } catch (error) {
            showToast(error.message || "Failed to redeem promo code.", "error");
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalText;
            if (window.lucide) window.lucide.createIcons();
        }
    });
});
