import { API_BASE_URL } from '../utils/config.js';

document.addEventListener('DOMContentLoaded', () => {
    const resetToken = sessionStorage.getItem('resetToken');
    if (!resetToken) {
        window.location.href = '../forgot-password/index.html';
        return;
    }

    const form = document.getElementById('change-password-form');
    const submitBtn = document.getElementById('submit-btn');
    const errorMsg = document.getElementById('error-msg');

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const newPassword = document.getElementById('new-password').value;
        const confirmPassword = document.getElementById('confirm-password').value;
        
        if (newPassword !== confirmPassword) {
            errorMsg.textContent = 'Passwords do not match';
            errorMsg.style.display = 'block';
            return;
        }
        
        if (newPassword.length < 8) {
            errorMsg.textContent = 'Password must be at least 8 characters long';
            errorMsg.style.display = 'block';
            return;
        }
        
        submitBtn.disabled = true;
        submitBtn.textContent = 'Updating...';
        errorMsg.style.display = 'none';

        try {
            const res = await fetch(`${API_BASE_URL}/api/auth/reset-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ reset_token: resetToken, new_password: newPassword })
            });

            const data = await res.json();
            
            if (!res.ok) {
                throw new Error(data.detail || 'Failed to update password');
            }

            // Clean up session storage
            sessionStorage.removeItem('recoveryEmail');
            sessionStorage.removeItem('resetToken');
            
            // Show success and redirect to login
            submitBtn.style.backgroundColor = '#10b981'; // Green
            submitBtn.textContent = 'Success! Redirecting...';
            
            setTimeout(() => {
                window.location.href = '../login/index.html';
            }, 1500);
            
        } catch (error) {
            errorMsg.textContent = error.message;
            errorMsg.style.display = 'block';
            submitBtn.disabled = false;
            submitBtn.textContent = 'Update Password';
        }
    });
});
