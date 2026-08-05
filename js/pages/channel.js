import { apiFetch } from '../api/client.js';
import { API_BASE_URL } from '../utils/config.js';
import { escapeHTML, renderCreatorBadges } from '../utils/security.js';
import { InfiniteScroller } from '../utils/pagination.js';

function formatDuration(seconds) {
    if(!seconds) return "0:00";
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
}

let scroller;

async function setupChannelDetails(data, username) {
    document.getElementById('channel-name').innerHTML = `${escapeHTML(data.username)}${renderCreatorBadges(data, true)}`;
    const statsEl = document.getElementById('channel-stats');
    statsEl.textContent = `${data.subscriber_count.toLocaleString()} Subscribers`;
    
    const token = localStorage.getItem('phryco_token');
    const subBtn = document.getElementById('subscribe-btn');
    let isOwnChannel = false;
    
    if (token) {
        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            if (payload.sub === username) {
                isOwnChannel = true;
            }
        } catch(e) {}
    }
    
    let isSubscribed = false;
    
    if (!isOwnChannel) {
        subBtn.style.display = 'block';
        if (token) {
            try {
                const status = await apiFetch(`/api/users/${username}/subscribe-status`);
                if (status.subscribed) {
                    isSubscribed = true;
                    subBtn.textContent = 'Subscribed';
                    subBtn.style.background = 'var(--bg-secondary)';
                    subBtn.style.color = 'var(--text-primary)';
                }
            } catch(e) {}
        }
        
        subBtn.addEventListener('click', async () => {
            if (!token) {
                alert("You must be logged in to subscribe.");
                return;
            }
            subBtn.disabled = true;
            try {
                const res = await apiFetch(`/api/users/${username}/subscribe`, { method: 'POST' });
                statsEl.textContent = `${res.subscriber_count.toLocaleString()} Subscribers`;
                if (res.subscribed) {
                    isSubscribed = true;
                    subBtn.textContent = 'Subscribed';
                    subBtn.style.background = 'var(--bg-secondary)';
                    subBtn.style.color = 'var(--text-primary)';
                } else {
                    isSubscribed = false;
                    subBtn.textContent = 'Subscribe';
                    subBtn.style.background = 'white';
                    subBtn.style.color = 'black';
                }
            } catch (error) {
                alert(error.message);
            } finally {
                subBtn.disabled = false;
            }
        });
        
        // Memberships logic
        const joinBtn = document.getElementById('join-btn');
        try {
            const tiers = await apiFetch(`/api/memberships/channel/${encodeURIComponent(username)}/tiers`);
            if (tiers && tiers.length > 0) {
                joinBtn.style.display = 'block';
                joinBtn.addEventListener('click', () => {
                    if (!token) {
                        alert("You must log in and subscribe to join as a member.");
                        return;
                    }
                    if (!isSubscribed) {
                        alert("You must subscribe to this channel before you can join as a member.");
                        return;
                    }
                    
                    document.getElementById('join-channel-name').textContent = data.username;
                    const modal = document.getElementById('join-modal');
                    const container = document.getElementById('join-tiers-container');
                    modal.style.display = 'flex';
                    
                    container.innerHTML = tiers.map(t => {
                        const badgeHtml = t.badge_path ? `<img src="${API_BASE_URL}${t.badge_path}" style="width: 48px; height: 48px; border-radius: 4px; background: var(--bg-primary);">` : `<div style="width:48px;height:48px;display:flex;align-items:center;justify-content:center;background:var(--bg-primary);border-radius:4px;"><i data-lucide="shield"></i></div>`;
                        const emojisHtml = t.emojis && t.emojis.length > 0 ? `<div style="margin-top: 0.5rem; display: flex; gap: 0.25rem;">${t.emojis.map(e => `<img src="${API_BASE_URL}${e.image_path}" style="width: 24px; height: 24px; border-radius: 2px;">`).join('')}</div>` : '';
                        return `
                            <div style="background: rgba(255,255,255,0.05); border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 1rem; display: flex; justify-content: space-between; align-items: center;">
                                <div style="display: flex; gap: 1rem; align-items: flex-start;">
                                    ${badgeHtml}
                                    <div>
                                        <h4 style="margin: 0 0 0.25rem 0;">${t.name} (Level ${t.level})</h4>
                                        <div style="color: var(--text-secondary); font-size: 0.875rem;">${t.price_phrybucks} PB/month</div>
                                        ${emojisHtml}
                                    </div>
                                </div>
                                <button class="join-tier-btn" data-id="${t.id}" data-price="${t.price_phrybucks}" style="padding: 0.5rem 1rem; border-radius: 4px; font-weight: 600; border: none; cursor: pointer; background: var(--accent-primary); color: white;">
                                    Join Tier
                                </button>
                            </div>
                        `;
                    }).join('');
                    
                    if (window.lucide) window.lucide.createIcons();
                    
                    container.querySelectorAll('.join-tier-btn').forEach(btn => {
                        btn.addEventListener('click', async (e) => {
                            const tId = e.target.dataset.id;
                            const tPrice = e.target.dataset.price;
                            if (confirm(`Join this tier for ${tPrice} Phrybucks/month?`)) {
                                btn.disabled = true;
                                btn.textContent = 'Joining...';
                                try {
                                    await apiFetch(`/api/memberships/join/${tId}`, { method: 'POST' });
                                    alert("Successfully joined membership!");
                                    modal.style.display = 'none';
                                } catch (err) {
                                    alert(err.message || 'Error joining tier');
                                    btn.disabled = false;
                                    btn.textContent = 'Join Tier';
                                }
                            }
                        });
                    });
                });
            }
        } catch (e) { console.error("Error loading tiers", e); }
    }
    
    // Load Avatar and Banner
    const encodedUsername = encodeURIComponent(username);
    const avatarUrl = `${API_BASE_URL}/api/users/${encodedUsername}/avatar`;
    const bannerUrl = `${API_BASE_URL}/api/users/${encodedUsername}/banner`;
    
    const avatarEl = document.getElementById('avatar-el');
    const bannerEl = document.getElementById('banner-el');
    
    const avatarImg = new Image();
    avatarImg.onload = () => { avatarEl.innerHTML = `<img src="${avatarUrl}">`; };
    avatarImg.src = avatarUrl;
    
    const bannerImg = new Image();
    bannerImg.onload = () => { bannerEl.style.backgroundImage = `url("${bannerUrl}")`; };
    bannerImg.src = bannerUrl;
}

function renderVideoCard(v) {
    const card = document.createElement('a');
    card.href = `/pages/watch/index.html?v=${v.id}`;
    card.className = 'video-card animate-fade-in';
    card.dataset.title = v.title.toLowerCase();
    card.style = 'text-decoration: none; display: block;';
    
    let dateHtml = '';
    if (v.created_at) {
        const dateStr = new Date(v.created_at).toLocaleDateString();
        if (dateStr !== 'Invalid Date' && dateStr !== 'Invalid date') {
            dateHtml = ` • ${dateStr}`;
        }
    }
    
    card.innerHTML = `
        <div class="video-thumbnail" style="position: relative; overflow: hidden;">
            ${v.is_ad ? `<div style="position: absolute; top: 8px; left: 8px; background: rgba(0,0,0,0.8); color: var(--phrybucks-gold); padding: 4px 8px; border-radius: 4px; font-size: 0.75rem; font-weight: 600; border: 1px solid var(--phrybucks-gold); z-index: 2; display: flex; align-items: center; gap: 4px;"><i data-lucide="megaphone" style="width:12px; height:12px;"></i> Includes Paid Promotion</div>` : ''}
            <img src="${API_BASE_URL}/api/videos/${v.id}/thumbnail" style="width:100%; height:100%; object-fit:cover;" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
            <div style="display:none; width:100%; height:100%; background:linear-gradient(45deg, #1e293b, #334155); align-items:center; justify-content:center;">
                <i data-lucide="play" style="color: rgba(255,255,255,0.2); width: 48px; height: 48px;"></i>
            </div>
        ${v.duration_seconds ? `<div class="video-duration">${formatDuration(v.duration_seconds)}</div>` : ""}</div>
        <div class="video-info">
            <h3 class="video-title" style="margin: 0 0 0.25rem 0; font-size: 1rem; color: var(--text-primary);">${escapeHTML(v.title)}</h3>
            <p class="video-meta" style="margin: 0; font-size: 0.875rem; color: var(--text-secondary);">${v.views.toLocaleString()} views • ${v.likes.toLocaleString()} likes${dateHtml}</p>
        </div>
    `;
    return card;
}

async function loadChannel() {
    const urlParams = new URLSearchParams(window.location.search);
    const username = urlParams.get('c');
    
    if (!username) {
        document.getElementById('channel-name').textContent = "Channel Not Found";
        return;
    }
    
    const container = document.getElementById('video-container');
    container.innerHTML = '';
    
    let channelDataLoaded = false;
    
    scroller = new InfiniteScroller({
        endpoint: `/api/users/${username}`,
        container: container,
        emptyHTML: `<p style="color: var(--text-secondary); grid-column: 1/-1;">This channel has no public videos yet.</p>`,
        transformResponse: (res) => {
            if (!channelDataLoaded) {
                setupChannelDetails(res, username);
                channelDataLoaded = true;
            }
            return res.videos;
        },
        renderCallback: (items, sentinel) => {
            items.forEach(v => {
                const card = renderVideoCard(v);
                container.insertBefore(card, sentinel);
            });
            if (window.lucide) window.lucide.createIcons();
        }
    });
    
    // Search Filter
    const searchInput = document.getElementById('channel-search');
    searchInput.addEventListener('input', (e) => {
        const term = e.target.value.toLowerCase();
        const cards = container.querySelectorAll('.video-card');
        cards.forEach(card => {
            if (card.dataset.title.includes(term)) {
                card.style.display = 'block';
            } else {
                card.style.display = 'none';
            }
        });
    });
    
    try {
        await scroller.initialize();
    } catch (error) {
        document.getElementById('channel-name').textContent = "Channel Not Found";
    }
}

document.addEventListener('DOMContentLoaded', loadChannel);
