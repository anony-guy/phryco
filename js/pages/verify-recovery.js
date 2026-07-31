import { API_BASE_URL } from '../utils/config.js';

document.addEventListener('DOMContentLoaded', () => {
    const email = sessionStorage.getItem('recoveryEmail');
    if (!email) {
        window.location.href = '../forgot-password/index.html';
        return;
    }

    document.getElementById('display-email').textContent = email;
    
    const form = document.getElementById('verify-form');
    const submitBtn = document.getElementById('submit-btn');
    const errorMsg = document.getElementById('error-msg');
    const inputs = document.querySelectorAll('#code-inputs input');

    // Auto-focus and auto-advance code inputs
    inputs.forEach((input, index) => {
        input.addEventListener('input', (e) => {
            if (e.target.value.length === 1 && index < inputs.length - 1) {
                inputs[index + 1].focus();
            }
        });
        
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Backspace' && !e.target.value && index > 0) {
                inputs[index - 1].focus();
            }
        });
    });
    
    if (inputs.length > 0) inputs[0].focus();

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        let code = '';
        inputs.forEach(input => code += input.value);
        
        if (code.length !== 6) {
            errorMsg.textContent = 'Please enter a valid 6-digit code';
            errorMsg.style.display = 'block';
            return;
        }
        
        submitBtn.disabled = true;
        submitBtn.textContent = 'Verifying...';
        errorMsg.style.display = 'none';

        try {
            const res = await fetch(`${API_BASE_URL}/api/auth/verify-recovery-code`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, code })
            });

            const data = await res.json();
            
            if (!res.ok) {
                throw new Error(data.detail || 'Invalid or expired code');
            }

            // Store temporary reset token for the final step
            sessionStorage.setItem('resetToken', data.reset_token);
            
            // Redirect to change password page
            window.location.href = '../change-password/index.html';
        } catch (error) {
            errorMsg.textContent = error.message;
            errorMsg.style.display = 'block';
            submitBtn.disabled = false;
            submitBtn.textContent = 'Verify Code';
            
            // Clear inputs on error
            inputs.forEach(input => input.value = '');
            inputs[0].focus();
        }
    });
});
