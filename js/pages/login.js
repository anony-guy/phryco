import { API_BASE_URL } from '../utils/config.js';
import { setToken } from '../utils/auth.js';

const handleAuth = async () => {
    const username = document.getElementById('auth-user').value;
    const password = document.getElementById('auth-key').value;
    const errorMsg = document.getElementById('error-msg');
    
    errorMsg.style.display = 'none';

    try {
        const formData = new URLSearchParams();
        formData.append('username', username);
        formData.append('password', password);

        const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: formData
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.detail || "Login failed");
        }

        setToken(data.access_token);
        window.location.href = '/'; // Redirect to home on success
    } catch (error) {
        errorMsg.textContent = error.message;
        errorMsg.style.display = 'block';
    }
};

document.getElementById('submit-btn').addEventListener('click', handleAuth);
document.getElementById('auth-key').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') handleAuth();
});
document.getElementById('auth-user').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') handleAuth();
});

document.addEventListener('DOMContentLoaded', () => {
    if (localStorage.getItem('phryco_token')) {
        window.location.href = '/';
    }
});
