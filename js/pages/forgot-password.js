import { API_BASE_URL } from '../utils/config.js';

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('forgot-password-form');
    const submitBtn = document.getElementById('submit-btn');
    const errorMsg = document.getElementById('error-msg');

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('email').value.trim();
        
        submitBtn.disabled = true;
        submitBtn.textContent = 'Sending...';
        errorMsg.style.display = 'none';

        try {
            const res = await fetch(`${API_BASE_URL}/api/auth/forgot-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email })
            });

            const data = await res.json();
            
            if (!res.ok) {
                throw new Error(data.detail || 'Failed to send recovery email');
            }

            // Store email in session storage for the verify step
            sessionStorage.setItem('recoveryEmail', email);
            
            // Redirect to verify code page
            window.location.href = '../verify-recovery/index.html';
        } catch (error) {
            errorMsg.textContent = error.message;
            errorMsg.style.display = 'block';
            submitBtn.disabled = false;
            submitBtn.textContent = 'Send Recovery Code';
        }
    });
});
