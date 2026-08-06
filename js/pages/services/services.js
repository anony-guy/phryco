import { apiFetch } from '../../api/client.js';
import { showToast } from '../../utils/toast.js';

let currentSlide = 0;
const totalSlides = 4;

const slideTitles = [
    "Next: Custom Themes ➔",
    "Next: PB Economy & Shop ➔",
    "Next: VIP Promos & Q&A ➔",
    "✨ Enter Services Hub"
];

function initOnboardingModal() {
    const modal = document.getElementById('onboarding-modal');
    const openBtn = document.getElementById('btn-open-guide');
    const closeBtn = document.getElementById('btn-close-modal');
    const prevBtn = document.getElementById('btn-modal-prev');
    const nextBtn = document.getElementById('btn-modal-next');
    const slides = document.querySelectorAll('.slide-content');
    const dots = document.querySelectorAll('.dot-indicator');

    if (!modal) return;

    function showSlide(index) {
        currentSlide = index;
        slides.forEach((slide, idx) => {
            slide.classList.toggle('active', idx === currentSlide);
        });
        dots.forEach((dot, idx) => {
            dot.classList.toggle('active', idx === currentSlide);
        });

        if (prevBtn) prevBtn.style.visibility = currentSlide > 0 ? 'visible' : 'hidden';
        if (nextBtn) {
            nextBtn.textContent = slideTitles[currentSlide] || "Next";
        }
    }

    function openModal() {
        showSlide(0);
        modal.classList.add('active');
        if (window.lucide) window.lucide.createIcons();
    }

    function closeModal() {
        modal.classList.remove('active');
        localStorage.setItem('phryco_services_onboarded', 'true');
    }

    if (openBtn) openBtn.addEventListener('click', openModal);
    if (closeBtn) closeBtn.addEventListener('click', closeModal);

    if (prevBtn) {
        prevBtn.addEventListener('click', () => {
            if (currentSlide > 0) showSlide(currentSlide - 1);
        });
    }

    if (nextBtn) {
        nextBtn.addEventListener('click', () => {
            if (currentSlide < totalSlides - 1) {
                showSlide(currentSlide + 1);
            } else {
                closeModal();
                showToast("Ecosystem walkthrough completed! Welcome to the Services Hub.", "success");
            }
        });
    }

    dots.forEach((dot, idx) => {
        dot.addEventListener('click', () => showSlide(idx));
    });

    // Auto-launch modal if user has never completed the walkthrough
    const isOnboarded = localStorage.getItem('phryco_services_onboarded');
    if (!isOnboarded) {
        setTimeout(openModal, 500);
    }
}

async function syncUserBalance() {
    const pbDisplay = document.getElementById('pb-balance');
    const token = localStorage.getItem('phryco_token');
    if (!token || !pbDisplay) return;

    try {
        const user = await apiFetch('/api/users/me');
        if (user && user.phrybucks_balance !== undefined) {
            pbDisplay.textContent = `${parseFloat(user.phrybucks_balance).toFixed(0)} PB`;
        }
    } catch (err) {
        console.warn("Could not sync Phrybucks balance for Services Hub:", err);
    }
}

function initPromoRedemption() {
    const form = document.getElementById('portal-promo-form');
    const input = document.getElementById('portal-promo-input');
    const submitBtn = document.getElementById('portal-promo-submit');

    if (!form || !input || !submitBtn) return;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const token = localStorage.getItem('phryco_token');
        if (!token) {
            showToast("Please sign in to redeem VIP promo codes and claim PB drops.", "error");
            window.location.href = '../../pages/login/index.html';
            return;
        }

        const code = input.value.trim().toUpperCase();
        if (!code) {
            showToast("Please enter a valid VIP promo code.", "warning");
            return;
        }

        const origHTML = submitBtn.innerHTML;
        submitBtn.disabled = true;
        submitBtn.innerHTML = `<i data-lucide="loader" class="animate-spin" style="width:18px;height:18px;"></i><span>Verifying Code...</span>`;
        if (window.lucide) window.lucide.createIcons();

        try {
            const res = await apiFetch('/api/promo/redeem', {
                method: 'POST',
                body: { code: code }
            });
            showToast(res.message || "🎉 VIP Promo Code redeemed successfully! Rewards unlocked.", "success");
            input.value = '';
            await syncUserBalance();
        } catch (err) {
            showToast(err.message || "Failed to redeem promo code. Please verify and try again.", "error");
        } finally {
            submitBtn.disabled = false;
            submitBtn.innerHTML = origHTML;
            if (window.lucide) window.lucide.createIcons();
        }
    });
}

document.addEventListener('DOMContentLoaded', () => {
    initOnboardingModal();
    initPromoRedemption();
    syncUserBalance();
    if (window.lucide) window.lucide.createIcons();
});
