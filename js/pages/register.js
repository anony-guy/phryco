import { apiFetch } from '../api/client.js';
import { setToken } from '../utils/auth.js';

let vaultguardToken = null;
let challengeToken = null;

const fetchFileChallenge = async () => {
    try {
        const res = await apiFetch('/api/auth/file-challenge');
        document.getElementById('file-prompt').textContent = res.prompt;
        challengeToken = res.challenge_token;
    } catch (e) {
        document.getElementById('file-prompt').textContent = "Failed to load human verification challenge.";
        document.getElementById('file-prompt').style.color = "#ef4444";
    }
};

const submitForm = async () => {
    const username = document.getElementById('auth-user').value.trim();
    const email = document.getElementById('auth-email').value.trim();
    const password = document.getElementById('auth-key').value;
    const inviteCode = document.getElementById('invite-code').value.trim();
    const fileInput = document.getElementById('human-file');
    const errorMsg = document.getElementById('error-msg');
    const btn = document.getElementById('submit-btn');

    // Disable button
    btn.disabled = true;
    btn.innerHTML = `<i data-lucide="loader" class="spin"></i> Signing up...`;
    if (typeof lucide !== 'undefined') lucide.createIcons();

    try {
        const formData = new FormData();
        formData.append('username', username);
        formData.append('email', email);
        formData.append('password', password);
        formData.append('invite_code', inviteCode);
        formData.append('vaultguard_token', vaultguardToken);
        formData.append('challenge_token', challengeToken);
        formData.append('human_file', fileInput.files[0]);

        const res = await fetch('/api/auth/signup', {
            method: 'POST',
            body: formData
        });
        
        const data = await res.json();
        
        if (!res.ok) {
            throw new Error(data.detail || 'Signup failed');
        }

        setToken(data.access_token);
        window.location.href = '/'; 
    } catch (error) {
        errorMsg.textContent = error.message;
        errorMsg.style.display = 'block';
        btn.disabled = false;
        btn.innerHTML = `<span>Sign Up</span>`;
        vaultguardToken = null;
        fileInput.value = ""; // clear file
        // Reset VaultGuard instance if it exists
        if (window.vgController) {
            window.vgController.reload();
        }
        // Fetch a new file challenge too!
        fetchFileChallenge();
    }
};

const handleAuth = async () => {
    const username = document.getElementById('auth-user').value.trim();
    const email = document.getElementById('auth-email').value.trim();
    const password = document.getElementById('auth-key').value;
    const inviteCode = document.getElementById('invite-code').value.trim();
    const fileInput = document.getElementById('human-file');
    const errorMsg = document.getElementById('error-msg');
    
    errorMsg.style.display = 'none';

    if (!username || !email || !password || !inviteCode) {
        errorMsg.textContent = "Please fill out all fields.";
        errorMsg.style.display = 'block';
        return;
    }
    
    // basic email validation
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        errorMsg.textContent = "Please enter a valid email address.";
        errorMsg.style.display = 'block';
        return;
    }
    
    if (!fileInput.files.length) {
        errorMsg.textContent = "Please upload the required proof of humanity file.";
        errorMsg.style.display = 'block';
        return;
    }
    
    if (!challengeToken) {
        errorMsg.textContent = "Challenge token missing. Please refresh the page.";
        errorMsg.style.display = 'block';
        return;
    }
    
    // Open the Captcha Modal instead of submitting
    document.getElementById('captcha-modal').style.display = 'flex';
};

document.getElementById('submit-btn').addEventListener('click', handleAuth);
['auth-key', 'auth-user', 'invite-code'].forEach(id => {
    document.getElementById(id).addEventListener('keydown', (e) => {
        if (e.key === 'Enter') handleAuth();
    });
});

document.getElementById('close-captcha-modal').addEventListener('click', () => {
    document.getElementById('captcha-modal').style.display = 'none';
});

document.addEventListener('DOMContentLoaded', () => {
    if (localStorage.getItem('phryco_token')) {
        window.location.href = '/';
        return;
    } 
    
    fetchFileChallenge();

    // Initialize VaultGuard
    if (typeof VaultGuard !== 'undefined') {
        VaultGuard.quickSetup('vg-captcha', {
            captcha: {
                serverUrl: 'http://127.0.0.1:8002/api/vaultguard'
            },
            security: {
                enableCSP: false
            },
            callbacks: {
                onSuccess: (result, id) => {
                    if (result.token) {
                        vaultguardToken = result.token;
                        document.getElementById('captcha-modal').style.display = 'none';
                        submitForm();
                    }
                },
                onError: (result, id) => {
                    console.error("VaultGuard error:", result.error);
                    const errorMsg = document.getElementById('error-msg');
                    errorMsg.textContent = "Captcha error: " + result.error;
                    errorMsg.style.display = 'block';
                    document.getElementById('captcha-modal').style.display = 'none';
                }
            }
        }).then(({ captcha, controller }) => {
            window.vgController = controller;
        });
    } else {
        console.error("VaultGuard library not loaded");
    }
});
