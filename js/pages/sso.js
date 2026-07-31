import { apiFetch } from '../api/client.js';

document.addEventListener('DOMContentLoaded', async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const clientId = urlParams.get('client_id');
    const redirectUri = urlParams.get('redirect_uri');
    const state = urlParams.get('state');
    const codeChallenge = urlParams.get('code_challenge');
    const codeChallengeMethod = urlParams.get('code_challenge_method');
    const requestedScopeStr = urlParams.get('scope') || 'profile';
    const requestedScopes = [...new Set(['profile', ...requestedScopeStr.split(/[ ,]+/).filter(Boolean)])];

    const SCOPE_DESCRIPTIONS = {
        'profile': 'View your username, avatar, and basic profile info.',
        'email': 'View your email address.',
        'videos:read': 'View your private videos and analytics.',
        'videos:write': 'Upload, edit, and delete videos on your behalf.',
        'comments:read': 'Read your private comments.',
        'comments:write': 'Post comments on your behalf.',
        'channel:read': 'View your channel settings and subscriptions.',
        'channel:write': 'Update your channel banner, bio, and settings.',
        'phrybucks:read': 'View your Phrybucks balance and history.',
        'phrybucks:spend': 'Spend Phrybucks on your behalf.',
        'subscriptions:read': 'View channels you are subscribed to.',
        'subscriptions:write': 'Manage your subscriptions.',
        'likes:read': 'View your liked videos.',
        'likes:write': 'Like and dislike videos on your behalf.',
        'notifications:read': 'Read your notifications.',
        'notifications:write': 'Manage your notifications.',
        'ads:read': 'View your ad campaigns.',
        'ads:write': 'Manage your ad campaigns.',
        'invites:read': 'View your invite codes.',
        'invites:write': 'Generate invite codes on your behalf.',
        'memberships:read': 'View your channel memberships.',
        'memberships:write': 'Manage your channel memberships.',
        'settings:read': 'Read your account preferences.',
        'settings:write': 'Update your account preferences.',
        'transactions:read': 'View your transaction history.',
        'clients:read': 'View your registered OAuth clients.',
        'clients:write': 'Manage your OAuth clients.',
        'emojis:read': 'View your custom emojis.',
        'emojis:write': 'Manage your custom emojis.',
        'analytics:read': 'Read advanced analytics data.',
        'admin:read': 'Read platform moderation logs.',
        'admin:write': 'Perform platform moderation actions.',
        'moderation:read': 'View channel moderation logs.',
        'moderation:write': 'Perform channel moderation actions.',
        'playlists:read': 'View your playlists [Coming Soon].',
        'playlists:write': 'Manage your playlists [Coming Soon].',
        'messages:read': 'Read your direct messages [Coming Soon].',
        'messages:write': 'Send direct messages on your behalf [Coming Soon].',
        'livestreams:read': 'View your livestreams [Coming Soon].',
        'livestreams:write': 'Manage your livestreams [Coming Soon].',
        'community_posts:read': 'View your community posts [Coming Soon].',
        'community_posts:write': 'Manage your community posts [Coming Soon].',
        'shorts:read': 'View your shorts [Coming Soon].',
        'shorts:write': 'Manage your shorts [Coming Soon].',
        'superchats:read': 'Read live donation history [Coming Soon].',
        'captions:read': 'Read subtitle/caption files.',
        'captions:write': 'Manage subtitle/caption files.',
        'analytics_revenue:read': 'Read monetization metrics.',
        'strikes:read': 'View your strikes.',
        'content_id:read': 'View copyright claims [Coming Soon].',
        'content_id:write': 'Submit copyright claims [Coming Soon].',
        'merch:read': 'View your connected merchandise [Coming Soon].',
        'merch:write': 'Manage connected merchandise [Coming Soon].',
        'offline_access': 'Maintain long-term background access.',
        'openid': 'Authenticate your identity.'
    };

    if (!clientId || !redirectUri) {
        document.getElementById('loading').innerText = "Missing client_id or redirect_uri";
        return;
    }

    const token = localStorage.getItem('phryco_token');
    if (!token) {
        // Redirect to login, then come back here
        window.location.href = `/pages/login/index.html?redirect=${encodeURIComponent(window.location.href)}`;
        return;
    }

    try {
        const clientData = await apiFetch(`/api/sso/client/${clientId}`);
        
        document.getElementById('loading').style.display = 'none';
        document.getElementById('auth-content').style.display = 'block';
        document.getElementById('client-name').innerText = clientData.name;
        
        const scopesListEl = document.getElementById('scopes-list');
        scopesListEl.innerHTML = '';
        requestedScopes.forEach(scope => {
            const label = document.createElement('label');
            label.style.display = 'flex';
            label.style.alignItems = 'center';
            label.style.gap = '8px';
            
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.value = scope;
            checkbox.className = 'scope-checkbox';
            checkbox.checked = true;
            if (scope === 'profile') {
                checkbox.disabled = true; // mandatory
            }
            
            const text = document.createElement('span');
            text.innerText = SCOPE_DESCRIPTIONS[scope] || `Access: ${scope}`;
            
            label.appendChild(checkbox);
            label.appendChild(text);
            scopesListEl.appendChild(label);
        });
    } catch (err) {
        document.getElementById('loading').innerText = "Invalid Client ID.";
        console.error(err);
    }

    document.getElementById('approve-btn').addEventListener('click', async () => {
        const checkboxes = document.querySelectorAll('.scope-checkbox');
        const approvedScopes = Array.from(checkboxes)
            .filter(cb => cb.checked)
            .map(cb => cb.value)
            .join(' ');
            
        const formData = new FormData();
        formData.append('client_id', clientId);
        formData.append('redirect_uri', redirectUri);
        formData.append('scopes', approvedScopes);
        if (state) formData.append('state', state);
        if (codeChallenge) formData.append('code_challenge', codeChallenge);
        if (codeChallengeMethod) formData.append('code_challenge_method', codeChallengeMethod);

        try {
            const data = await apiFetch('/api/sso/approve', {
                method: 'POST',
                body: formData
            });

            window.location.href = data.redirect_url;
        } catch (err) {
            alert('Authorization failed: ' + (err.message || 'Unknown error'));
        }
    });

    document.getElementById('deny-btn').addEventListener('click', () => {
        let denyUrl = `${redirectUri}?error=access_denied`;
        if (state) denyUrl += `&state=${state}`;
        window.location.href = denyUrl;
    });
});
