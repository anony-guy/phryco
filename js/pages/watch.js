import { apiFetch } from '../api/client.js';
import { API_BASE_URL } from '../utils/config.js';
import { escapeHTML } from '../utils/security.js';
import { InfiniteScroller } from '../utils/pagination.js';
import { showToast } from '../utils/toast.js';
import { initAmbientAura } from '../components/ambient_aura.js';

window.currentPlayingVideoId = null;
window.hlsInstance = null;

function loadVideoStream(url, playerElement, vidId) {
    initAmbientAura(playerElement);
    window.currentPlayingVideoId = vidId;
    if (window.hlsInstance) {
        window.hlsInstance.destroy();
        window.hlsInstance = null;
    }
    
    if (typeof Hls !== 'undefined' && Hls.isSupported() && url.includes('.m3u8')) {
        window.hlsInstance = new Hls({
            xhrSetup: (xhr, url) => {
                const token = localStorage.getItem('phryco_token');
                if (token) {
                    xhr.setRequestHeader('Authorization', `Bearer ${token}`);
                }
            }
        });
        window.hlsInstance.loadSource(url);
        window.hlsInstance.attachMedia(playerElement);
        
        window.hlsInstance.on(Hls.Events.ERROR, function (event, data) {
            if (data.fatal && data.type === Hls.ErrorTypes.NETWORK_ERROR) {
                console.warn("HLS Network Error, falling back to legacy MP4.", data);
                window.hlsInstance.destroy();
                window.hlsInstance = null;
                
                let mp4Url = url.replace('/hls/', '/stream?quality=');
                mp4Url = mp4Url.replace('.m3u8?', '&');
                mp4Url = mp4Url.replace('.m3u8', '');
                mp4Url = mp4Url.replace('quality=master', 'quality=720p');
                
                playerElement.src = mp4Url;
                
                // Need to call play if it was attempting to play automatically
                // The browser might block it if no user interaction, but we try:
                playerElement.play().catch(e => console.warn("Fallback autoplay prevented"));
            }
        });
    } else {
        playerElement.src = url;
    }
}
let commentsScroller;
let upNextScroller;

let currentVideoId = null;
let currentVideoOwner = null;

function formatDuration(seconds) {
    if (!seconds) return "";
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    return `${m}:${s.toString().padStart(2, '0')}`;
}

function parseTimestamps(text) {
    if (!text) return "";
    let safeText = escapeHTML(text);
    return safeText.replace(/(?:([0-5]?\d):)?([0-5]?\d):([0-5]\d)/g, (match, h, m, s) => {
        let totalSeconds = parseInt(s);
        totalSeconds += parseInt(m) * 60;
        if (h) totalSeconds += parseInt(h) * 3600;
        return `<a href="#" class="timestamp-link" data-time="${totalSeconds}" style="color: var(--accent-primary); text-decoration: none;">${match}</a>`;
    });
}

document.addEventListener('click', (e) => {
    if (e.target.classList.contains('timestamp-link')) {
        e.preventDefault();
        const time = parseInt(e.target.getAttribute('data-time'));
        const player = document.getElementById('video-player');
        if (player && !isNaN(time)) {
            player.currentTime = time;
            player.play().catch(()=>{});
            player.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }
});

async function loadWatchPage() {
    const urlParams = new URLSearchParams(window.location.search);
    currentVideoId = urlParams.get('v');
    
    if (!currentVideoId) {
        document.getElementById('video-title').textContent = "Video Not Found";
        return;
    }
    
    try {
        // Fetch the specific video directly
        const video = await apiFetch(`/api/videos/${currentVideoId}`);
        
        if (!video) {
            document.getElementById('video-title').textContent = "Video Not Found";
            return;
        }
        
        // Religion & Compliance check
        const token = localStorage.getItem('phryco_token');
        let currentUser = null;
        if (token) {
            try {
                // Always fetch the freshest user data to ensure religion checks are accurate
                currentUser = await apiFetch('/api/users/me');
                localStorage.setItem('phryco_user', JSON.stringify(currentUser));
            } catch (e) {
                console.error("Failed to load user profile for compliance check", e);
            }
        }

        if (!token || !currentUser || !currentUser.religion) {
            document.getElementById('religion-required-modal').style.display = 'flex';
            return; // Block execution completely
        }
        
        if (currentUser.religion === 'Islam' && !currentUser.halal_mode) {
                const flags = [];
                if (video.contains_music) flags.push('<li><i data-lucide="music" style="width:16px;height:16px;margin-right:0.5rem;vertical-align:middle;"></i> Contains Music</li>');
                if (video.sharia_non_compliant) flags.push('<li><i data-lucide="shield-alert" style="width:16px;height:16px;margin-right:0.5rem;vertical-align:middle;"></i> Sharia Non-Compliant</li>');
                if (video.taswir) flags.push('<li><i data-lucide="image" style="width:16px;height:16px;margin-right:0.5rem;vertical-align:middle;"></i> Contains Taswir (Animate Beings)</li>');
                
                if (flags.length > 0) {
                    const warningModal = document.getElementById('video-warning-modal');
                    const warningList = document.getElementById('warning-flags-list');
                    warningList.innerHTML = flags.join('');
                    warningModal.style.display = 'flex';
                    if (typeof lucide !== 'undefined') lucide.createIcons();
                    
                    // We must wait for them to dismiss before we actually initialize the player
                    await new Promise(resolve => {
                        document.getElementById('dismiss-warning-btn').addEventListener('click', () => {
                            warningModal.style.display = 'none';
                            resolve();
                        }, { once: true });
                    });
                }
            }
        
        // Populate Video Details
        document.getElementById('video-title').textContent = video.title;
        currentVideoOwner = video.owner_username;
        
        let dateStr = '';
        if (video.created_at) {
            const parsedDate = new Date(video.created_at).toLocaleDateString();
            if (parsedDate !== 'Invalid Date' && parsedDate !== 'Invalid date') {
                dateStr = ` • ${parsedDate}`;
            }
        }
        
        function updateStats() {
            document.getElementById('video-stats').textContent = `${video.views.toLocaleString()} views • ${video.likes.toLocaleString()} likes${dateStr}`;
        }
        updateStats();
        
        // Likes Logic
        const likeBtn = document.getElementById('like-btn');
        if (token) {
            try {
                const status = await apiFetch(`/api/videos/${video.id}/like-status`);
                if (status.liked) {
                    likeBtn.style.color = 'var(--accent-primary)';
                    likeBtn.style.borderColor = 'var(--accent-primary)';
                }
            } catch (e) {}
        }
        
        likeBtn.addEventListener('click', async () => {
            if (!token) {
                window.location.href = '/pages/login/';
                return;
            }
            try {
                const res = await apiFetch(`/api/videos/${video.id}/like`, { method: 'POST' });
                video.likes = res.total_likes;
                updateStats();
                if (res.liked) {
                    likeBtn.style.color = 'var(--accent-primary)';
                    likeBtn.style.borderColor = 'var(--accent-primary)';
                } else {
                    likeBtn.style.color = 'var(--text-primary)';
                    likeBtn.style.borderColor = 'var(--border-color)';
                }
            } catch (error) {
                console.error("Failed to like video:", error);
            }
        });
        
        // Share Logic
        const shareBtn = document.getElementById('share-btn');
        const shareText = document.getElementById('share-text');
        shareBtn.addEventListener('click', async () => {
            const frontendBase = window.location.origin;
            const shareUrl = `${API_BASE_URL}/api/share/video/${video.id}?f=${encodeURIComponent(frontendBase)}`;
            
            try {
                await navigator.clipboard.writeText(shareUrl);
                shareText.textContent = "Copied!";
                shareBtn.style.color = 'var(--accent-primary)';
                setTimeout(() => {
                    shareText.textContent = "Share";
                    shareBtn.style.color = 'var(--text-primary)';
                }, 2000);
            } catch (err) {
                console.error('Failed to copy share link: ', err);
            }
        });
        
        document.getElementById('video-desc').innerHTML = parseTimestamps(video.description || "No description provided.");
        document.getElementById('video-owner').textContent = video.owner_username;
        document.getElementById('channel-link').href = `/pages/channel/index.html?c=${video.owner_username}`;
        
        // Load Owner Avatar
        const avatarUrl = `${API_BASE_URL}/api/users/${video.owner_username}/avatar`;
        const avatarImg = new Image();
        avatarImg.onload = () => { document.getElementById('video-channel-avatar').innerHTML = `<img src="${avatarUrl}">`; };
        avatarImg.src = avatarUrl;
        
        // Inject Frame Overlay if present
        if (video.frame_path) {
            const container = document.querySelector('.video-player-container');
            const frameImg = document.createElement('img');
            frameImg.src = `../..${video.frame_path}`;
            frameImg.className = 'player-frame-overlay';
            container.appendChild(frameImg);
        }
        
        // Set Video Player Source and Custom Controls
        const player = document.getElementById('video-player');
        player.crossOrigin = "anonymous";
        
        let quality = '1080p'; // Default
        const isMobile = /Mobi|Android/i.test(navigator.userAgent);
        const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
        
        if (connection) {
            if (connection.effectiveType === 'slow-2g' || connection.effectiveType === '2g' || connection.effectiveType === '3g') {
                quality = '240p';
            } else if (isMobile) {
                quality = '720p'; // Mobile users get 720p even on 4G to save data
            }
        } else if (isMobile) {
            quality = '720p';
        }
        
        const overlay = document.getElementById('restriction-overlay');
        const overlayTitle = document.getElementById('restriction-title');
        const overlayMessage = document.getElementById('restriction-message');
        const actionBtn = document.getElementById('restriction-action-btn');
        
        async function handleRestrictionsAndPlay() {
            if (!video.age_restricted && !video.made_for_kids) {
                startPlaybackSequence();
                return;
            }
            
            if (!token) {
                overlay.style.display = 'flex';
                overlayTitle.textContent = "Sign In Required";
                overlayMessage.textContent = "This video requires you to be signed in and have a verified birth date.";
                actionBtn.style.display = 'block';
                actionBtn.textContent = 'Sign In';
                actionBtn.onclick = () => window.location.href = '../../pages/login/index.html';
                return;
            }
            
            try {
                const profile = await apiFetch('/api/users/me');
                if (!profile.birth_date) {
                    overlay.style.display = 'flex';
                    overlayTitle.textContent = "Birth Date Required";
                    overlayMessage.textContent = "To watch this video, you must set your birth date in your account settings.";
                    actionBtn.style.display = 'block';
                    actionBtn.textContent = 'Go to Settings';
                    actionBtn.onclick = () => window.location.href = '../../pages/settings/index.html';
                    return;
                }
                
                const birthDate = new Date(profile.birth_date);
                const today = new Date();
                let age = today.getFullYear() - birthDate.getFullYear();
                const m = today.getMonth() - birthDate.getMonth();
                if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
                    age--;
                }
                
                if (video.age_restricted && age < 18) {
                    overlay.style.display = 'flex';
                    overlayTitle.textContent = "Age Restricted";
                    overlayMessage.textContent = "This video is restricted to audiences 18 and older.";
                    actionBtn.style.display = 'none';
                    return;
                }
                
                overlay.style.display = 'flex';
                overlayTitle.textContent = "Content Disclaimer";
                let msgs = [];
                if (video.age_restricted) msgs.push("This video contains age restricted material.");
                if (video.made_for_kids) msgs.push("This video is made for kids.");
                overlayMessage.textContent = msgs.join(" ");
                actionBtn.style.display = 'block';
                actionBtn.textContent = 'Proceed';
                actionBtn.onclick = () => {
                    overlay.style.display = 'none';
                    startPlaybackSequence();
                };
                
            } catch(e) {
                console.error("Failed to check restrictions", e);
                overlay.style.display = 'flex';
                overlayTitle.textContent = "Error";
                overlayMessage.textContent = "Failed to verify account restrictions. Please try again later.";
                actionBtn.style.display = 'none';
            }
        }
        
        // handleRestrictionsAndPlay is called later
        
        // Telemetry Heartbeat Loop
        let heartbeatInterval = null;
        let isWatching = false;
        
        player.addEventListener('play', () => {
            isWatching = true;
            if (!heartbeatInterval) {
                heartbeatInterval = setInterval(async () => {
                    if (isWatching) {
                        try {
                            await apiFetch(`/api/videos/${video.id}/heartbeat`, { method: 'POST' });
                        } catch (e) {
                            console.error('Telemetry heartbeat failed', e);
                        }
                    }
                }, 10000); // 10 seconds
            }
        });
        
        player.addEventListener('pause', () => {
            isWatching = false;
        });
        
        player.addEventListener('ended', () => {
            isWatching = false;
            clearInterval(heartbeatInterval);
            heartbeatInterval = null;
        });
        
        // Custom Player Logic
        const playPauseBtn = document.getElementById('play-pause-btn');
        const muteBtn = document.getElementById('mute-btn');
        const volumeSlider = document.getElementById('volume-slider');
        const progressContainer = document.getElementById('progress-container');
        const progressBar = document.getElementById('progress-bar');
        const currentTimeEl = document.getElementById('current-time');
        const durationEl = document.getElementById('duration');
        const fullscreenBtn = document.getElementById('fullscreen-btn');
        const settingsBtn = document.getElementById('settings-btn');
        
        // Custom Scrubber Icon
        if (video.has_scrubber) {
            const scrubberHead = document.getElementById('scrubber-head');
            const tokenParam = token ? `?token=${token}` : '';
            scrubberHead.style.backgroundImage = `url('${API_BASE_URL}/api/videos/${video.id}/scrubber${tokenParam}')`;
            scrubberHead.style.backgroundColor = 'transparent';
            scrubberHead.style.width = '24px'; // make it a bit larger for custom images
            scrubberHead.style.height = '24px';
            scrubberHead.style.right = '-12px';
        }
        const qualityMenu = document.getElementById('quality-menu');
        const qualityOptionsContainer = document.getElementById('quality-options');
        const playerContainer = document.getElementById('player-container');
        
        function formatTime(seconds) {
            if(isNaN(seconds)) return "0:00";
            const m = Math.floor(seconds / 60);
            const s = Math.floor(seconds % 60);
            return `${m}:${s < 10 ? '0' : ''}${s}`;
        }
        
        // Play/Pause
        function togglePlay() {
            if (player.paused) {
                player.play();
                playPauseBtn.innerHTML = '<i data-lucide="pause"></i>';
            } else {
                player.pause();
                playPauseBtn.innerHTML = '<i data-lucide="play"></i>';
            }
            lucide.createIcons();
        }
        playPauseBtn.addEventListener('click', togglePlay);
        player.addEventListener('click', togglePlay);
        
        // Volume
        muteBtn.addEventListener('click', () => {
            player.muted = !player.muted;
            if (player.muted) {
                muteBtn.innerHTML = '<i data-lucide="volume-x"></i>';
                volumeSlider.value = 0;
            } else {
                muteBtn.innerHTML = '<i data-lucide="volume-2"></i>';
                volumeSlider.value = player.volume;
            }
            lucide.createIcons();
        });
        volumeSlider.addEventListener('input', (e) => {
            player.volume = e.target.value;
            player.muted = player.volume === 0;
            muteBtn.innerHTML = player.muted ? '<i data-lucide="volume-x"></i>' : '<i data-lucide="volume-2"></i>';
            lucide.createIcons();
        });
        
        // Progress
        player.addEventListener('timeupdate', () => {
            const percent = (player.currentTime / player.duration) * 100;
            progressBar.style.width = `${percent}%`;
            currentTimeEl.textContent = formatTime(player.currentTime);
        });
        player.addEventListener('loadedmetadata', () => {
            durationEl.textContent = formatTime(player.duration);
            const ratio = player.videoWidth / player.videoHeight;
            if (!isNaN(ratio)) {
                playerContainer.style.aspectRatio = `${player.videoWidth}/${player.videoHeight}`;
            }
        });
        progressContainer.addEventListener('click', (e) => {
            const rect = progressContainer.getBoundingClientRect();
            const pos = (e.clientX - rect.left) / progressContainer.offsetWidth;
            player.currentTime = pos * player.duration;
            
            // Heatmap Tracking
            const segment = Math.floor(player.currentTime / 10);
            apiFetch(`/api/videos/${video.id}/heatmap`, {
                method: 'POST',
                body: { segment_index: segment }
            }).catch(err => console.error(err));
        });
        
        // Draw Heatmap
        function drawHeatmap(data) {
            if (!data || data.length === 0) return;
            const canvas = document.getElementById('heatmap-canvas');
            if (!canvas) return;
            const ctx = canvas.getContext('2d');
            
            canvas.width = progressContainer.offsetWidth;
            canvas.height = 40;
            
            const maxVal = Math.max(...data);
            if (maxVal === 0) return;
            
            const numSegments = Math.ceil(video.duration_seconds / 10) || data.length;
            const segmentWidth = canvas.width / numSegments;
            
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
            ctx.beginPath();
            ctx.moveTo(0, canvas.height);
            
            for (let i = 0; i < numSegments; i++) {
                const val = data[i] || 0;
                const height = (val / maxVal) * canvas.height;
                const x = i * segmentWidth;
                const y = canvas.height - height;
                ctx.lineTo(x + segmentWidth / 2, y);
            }
            
            ctx.lineTo(canvas.width, canvas.height);
            ctx.fill();
        }

        if (video.heatmap_data) {
            // Draw on next frame to ensure container has width
            requestAnimationFrame(() => drawHeatmap(video.heatmap_data));
            window.addEventListener('resize', () => drawHeatmap(video.heatmap_data));
        }

        function renderChapters(chapters, duration) {
            if (!chapters || chapters.length === 0 || !duration) return;
            const container = document.getElementById('chapters-container');
            if (!container) return;
            container.innerHTML = '';
            
            // Sort chapters just in case
            chapters.sort((a,b) => a.start - b.start);
            
            chapters.forEach((chapter, i) => {
                const nextStart = (i < chapters.length - 1) ? chapters[i+1].start : duration;
                if (chapter.start >= duration) return;
                
                const leftPercent = (chapter.start / duration) * 100;
                const widthPercent = ((nextStart - chapter.start) / duration) * 100;
                
                const marker = document.createElement('div');
                marker.style.position = 'absolute';
                marker.style.left = `${leftPercent}%`;
                marker.style.top = '0';
                marker.style.width = `${widthPercent}%`;
                marker.style.height = '100%';
                marker.style.borderRight = '2px solid var(--bg-primary)';
                marker.style.pointerEvents = 'auto'; // allow hover
                marker.style.cursor = 'pointer';
                marker.title = chapter.title;
                
                marker.addEventListener('click', (e) => {
                    e.stopPropagation();
                    player.currentTime = chapter.start;
                    if (player.paused) player.play();
                });
                
                container.appendChild(marker);
            });
        }
        
        if (video.chapters) {
            player.addEventListener('loadedmetadata', () => {
                renderChapters(video.chapters, player.duration || video.duration_seconds);
            });
            // If already loaded
            if (player.readyState >= 1) {
                renderChapters(video.chapters, player.duration || video.duration_seconds);
            }
        }
        
        
        // Fullscreen
        fullscreenBtn.addEventListener('click', () => {
            if (!document.fullscreenElement) {
                playerContainer.requestFullscreen().catch(err => {
                    console.log(`Error attempting to enable fullscreen: ${err.message}`);
                });
            } else {
                document.exitFullscreen();
            }
        });
        
        // Screenshot
        const screenshotBtn = document.getElementById('screenshot-btn');
        if (screenshotBtn) {
            screenshotBtn.addEventListener('click', () => {
                const canvas = document.createElement('canvas');
                canvas.width = player.videoWidth;
                canvas.height = player.videoHeight;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(player, 0, 0, canvas.width, canvas.height);
                
                const dataUrl = canvas.toDataURL('image/png', 1.0);
                const a = document.createElement('a');
                a.href = dataUrl;
                const timeStr = formatDuration(Math.floor(player.currentTime)).replace(/:/g, '-');
                a.download = `phryco-screenshot-${video.id}-${timeStr}.png`;
                a.style.display = 'none';
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
            });
        }
        
        // Picture-in-Picture
        const pipBtn = document.getElementById('pip-btn');
        if (pipBtn) {
            pipBtn.addEventListener('click', async () => {
                if (document.pictureInPictureElement) {
                    await document.exitPictureInPicture();
                } else if (document.pictureInPictureEnabled && player !== document.pictureInPictureElement) {
                    await player.requestPictureInPicture().catch(err => {
                        console.error('Failed to enter PiP mode', err);
                    });
                }
            });
        }
        
        // Theater Mode
        const theaterBtn = document.getElementById('theater-btn');
        if (theaterBtn) {
            theaterBtn.addEventListener('click', () => {
                const layout = document.querySelector('.watch-layout');
                if (layout) {
                    layout.classList.toggle('theater-mode');
                    // Force redraw heatmap to match new container width
                    if (video.heatmap_data) {
                        requestAnimationFrame(() => drawHeatmap(video.heatmap_data));
                    }
                }
            });
        }
        
        // Ambilight Logic
        const ambilightCanvas = document.getElementById('ambilight-canvas');
        if (ambilightCanvas) {
            const ambiCtx = ambilightCanvas.getContext('2d');
            
            function updateAmbilight() {
                if (player.paused || player.ended) return;
                if (player.videoWidth > 0 && player.videoHeight > 0) {
                    ambilightCanvas.width = player.videoWidth / 4;
                    ambilightCanvas.height = player.videoHeight / 4;
                    ambiCtx.drawImage(player, 0, 0, ambilightCanvas.width, ambilightCanvas.height);
                    ambilightCanvas.style.opacity = '0.7';
                }
                requestAnimationFrame(updateAmbilight);
            }
            
            player.addEventListener('play', () => {
                requestAnimationFrame(updateAmbilight);
            });
            player.addEventListener('pause', () => {
                ambilightCanvas.style.opacity = '0';
            });
        }
        
        // Quality
        settingsBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            qualityMenu.classList.toggle('show');
        });
        document.addEventListener('click', () => {
            qualityMenu.classList.remove('show');
        });
        
        // Quality Options logic
        const availableQualities = video.qualities ? video.qualities.split(',') : ['720p'];
        availableQualities.forEach((q, index) => {
            const btn = document.createElement('button');
            btn.className = 'quality-option' + (index === 0 ? ' active' : '');
            btn.textContent = q;
            btn.setAttribute('data-quality', q);
            btn.addEventListener('click', () => {
                const cTime = player.currentTime;
                const isPaused = player.paused;
                
                const token = localStorage.getItem('phryco_token');
                const tokenParam = token ? `?token=${token}` : '';
                
                const url = `${API_BASE_URL}/api/videos/${video.id}/hls/${q}.m3u8${tokenParam}`;
                loadVideoStream(url, player, video.id);
                
                player.currentTime = cTime;
                if(!isPaused) player.play();
                
                document.querySelectorAll('.quality-option').forEach(el => el.classList.remove('active'));
                btn.classList.add('active');
            });
            qualityOptionsContainer.appendChild(btn);
        });
        
        // Add Subtitles Track
        const track = document.createElement('track');
        track.kind = 'subtitles';
        track.label = 'English';
        track.srclang = 'en';
        track.src = `${API_BASE_URL}/api/videos/${video.id}/subtitles`;
        track.default = true; // Auto-enable
        player.appendChild(track);

        // Paid Promotion Badge
        if (video.is_ad) {
            const promoBadge = document.getElementById('paid-promotion-badge');
            promoBadge.style.display = 'block';
            promoBadge.style.opacity = '1';
            
            let hasFaded = false;
            player.addEventListener('timeupdate', () => {
                if (player.currentTime > 10 && !hasFaded) {
                    promoBadge.style.opacity = '0';
                    hasFaded = true;
                    setTimeout(() => { promoBadge.style.display = 'none'; }, 1000);
                }
            });
        }

        // Initial setup and Ad Logic
        let activeAd = null;
        let adSkipped = false;
        
        if (video.monetization_enabled !== false) {
            try {
                activeAd = await apiFetch('/api/ads/random');
            } catch (e) {
                console.error("Ad fetch failed", e);
            }
        }
        
        const startPlaybackSequence = () => {
            const startMainVideo = () => {
                const token = localStorage.getItem('phryco_token');
                const tokenParam = token ? `?token=${token}` : '';
                let qualityFile = availableQualities.length > 1 ? 'master' : availableQualities[0];
                const url = `${API_BASE_URL}/api/videos/${video.id}/hls/${qualityFile}.m3u8${tokenParam}`;
                loadVideoStream(url, player, video.id);
                playPauseBtn.innerHTML = '<i data-lucide="pause"></i>';
                lucide.createIcons();
                document.getElementById('pr-overlay').style.display = 'none';
            };

            if (activeAd) {
                // Play ad first
                const url = `${API_BASE_URL}/api/videos/${activeAd.video_id}/hls/720p.m3u8`;
                loadVideoStream(url, player, activeAd.video_id);
                playPauseBtn.innerHTML = '<i data-lucide="pause"></i>';
                document.getElementById('pr-overlay').style.display = 'flex';
                
                const overlayCountdown = document.getElementById('pr-countdown');
                const skipBtn = document.getElementById('skip-pr-btn');
                
                let countdownInterval = null;
                if (activeAd.is_skippable === false) {
                    overlayCountdown.style.display = 'block';
                    overlayCountdown.textContent = 'Ad will end soon...';
                    skipBtn.style.display = 'none';
                } else {
                    let timeLeft = activeAd.skip_after_seconds || 5;
                    overlayCountdown.style.display = 'block';
                    
                    countdownInterval = setInterval(() => {
                        timeLeft--;
                        if (timeLeft <= 0) {
                            if (countdownInterval) clearInterval(countdownInterval);
                            overlayCountdown.style.display = 'none';
                            skipBtn.style.display = 'inline-block';
                        } else {
                            overlayCountdown.textContent = `Skip Ad in ${timeLeft}...`;
                        }
                    }, 1000);
                    
                    skipBtn.addEventListener('click', () => {
                        if (adSkipped) return;
                        adSkipped = true;
                        if (countdownInterval) clearInterval(countdownInterval);
                        startMainVideo();
                    });
                }
                
                player.addEventListener('ended', () => {
                    if (!adSkipped && window.currentPlayingVideoId == activeAd.video_id) {
                        adSkipped = true;
                        if (countdownInterval) clearInterval(countdownInterval);
                        startMainVideo();
                    }
                });
                
                // Track Ad View
                player.addEventListener('play', async function trackAd() {
                    if (window.currentPlayingVideoId == activeAd.video_id) {
                        player.removeEventListener('play', trackAd);
                        try { 
                            await apiFetch(`/api/ads/${activeAd.id}/view`, { 
                                method: 'POST',
                                body: { host_video_id: parseInt(video.id) }
                            }); 
                        } catch(e){}
                    }
                });
                
                // Render Companion Card
                if (activeAd.card_type && activeAd.card_type !== 'NONE') {
                    const cardContainer = document.getElementById('pr-card-container');
                    if (cardContainer) {
                        cardContainer.style.display = 'block';
                        cardContainer.innerHTML = `
                            <a href="${activeAd.promo_link || '#'}" target="_blank" style="text-decoration: none; color: inherit; display: block;">
                                ${activeAd.promo_banner_url ? `<div style="width: 100%; height: 100px; background: url('${API_BASE_URL}${activeAd.promo_banner_url}') center/cover;"></div>` : `<div style="width: 100%; height: 100px; background: var(--bg-primary);"></div>`}
                                <div style="padding: 1rem; position: relative;">
                                    ${activeAd.promo_icon_url ? `<img src="${API_BASE_URL}${activeAd.promo_icon_url}" style="width: 48px; height: 48px; border-radius: 50%; border: 2px solid var(--bg-secondary); position: absolute; top: -24px; left: 1rem; background: var(--bg-primary);">` : `<div style="width: 48px; height: 48px; border-radius: 50%; border: 2px solid var(--bg-secondary); position: absolute; top: -24px; left: 1rem; background: var(--bg-primary); display: flex; align-items: center; justify-content: center;"><i data-lucide="star" style="color: var(--accent-primary);"></i></div>`}
                                    <div style="margin-top: 1rem;">
                                        <h4 style="margin: 0 0 0.25rem 0; font-size: 1rem;">${escapeHTML(activeAd.promo_header || 'Sponsored')}</h4>
                                        <p style="margin: 0; font-size: 0.875rem; color: var(--text-secondary);">${escapeHTML(activeAd.promo_description || '')}</p>
                                    </div>
                                    <div style="margin-top: 1rem;">
                                        <span class="btn-primary" style="display: inline-block; padding: 0.5rem 1rem; font-size: 0.875rem;">Learn More</span>
                                        <span style="font-size: 0.7rem; color: var(--text-secondary); float: right; margin-top: 0.5rem;">Ad</span>
                                    </div>
                                </div>
                            </a>
                        `;
                    }
                }
            } else {
                // No ad, play main video immediately
                startMainVideo();
            }
        };

        handleRestrictionsAndPlay();
        
        // Track View
        let viewCounted = false;
        player.addEventListener('play', async () => {
            // Only count view if it's the main video
            if (!viewCounted && window.currentPlayingVideoId == video.id) {
                viewCounted = true;
                try {
                    await apiFetch(`/api/videos/${video.id}/view`, { method: 'POST' });
                    video.views += 1;
                    updateStats();
                } catch(e) {}
            }
        });
        // Autoplay Logic
        let autoplayCountdownInterval = null;
        player.addEventListener('ended', () => {
            if (window.currentPlayingVideoId == video.id) {
                const autoplayToggle = document.getElementById('autoplay-toggle');
                if (autoplayToggle && autoplayToggle.checked) {
                    const firstRecommended = document.querySelector('#recommended-videos .video-card');
                    if (firstRecommended) {
                        const overlay = document.getElementById('autoplay-overlay');
                        const countdownEl = document.getElementById('autoplay-countdown');
                        const nextVideoContainer = document.getElementById('autoplay-next-video');
                        
                        // Copy thumbnail and title from the first recommended video
                        const clonedInfo = firstRecommended.cloneNode(true);
                        // Prevent navigation on click inside overlay unless it's the specific button
                        clonedInfo.onclick = (e) => e.preventDefault();
                        nextVideoContainer.innerHTML = '';
                        nextVideoContainer.appendChild(clonedInfo);
                        
                        overlay.style.display = 'flex';
                        let timeLeft = 5;
                        countdownEl.textContent = timeLeft;
                        
                        autoplayCountdownInterval = setInterval(() => {
                            timeLeft--;
                            if (timeLeft <= 0) {
                                clearInterval(autoplayCountdownInterval);
                                window.location.href = firstRecommended.href;
                            } else {
                                countdownEl.textContent = timeLeft;
                            }
                        }, 1000);
                        
                        document.getElementById('autoplay-cancel-btn').onclick = () => {
                            clearInterval(autoplayCountdownInterval);
                            overlay.style.display = 'none';
                        };
                        
                        document.getElementById('autoplay-play-btn').onclick = () => {
                            clearInterval(autoplayCountdownInterval);
                            window.location.href = firstRecommended.href;
                        };
                    }
                }
            }
        });
        
        // Load Comments
        loadComments();
        
        // Populate Up Next
        const recommendedContainer = document.getElementById('recommended-videos');
        try {
            recommendedContainer.innerHTML = '';
            upNextScroller = new InfiniteScroller({
                endpoint: `/api/videos/${currentVideoId}/up-next`,
                container: recommendedContainer,
                emptyHTML: '',
                renderCallback: (items, sentinel) => {
                    items.forEach(v => {
                        const card = document.createElement('a');
                        card.href = `/pages/watch/index.html?v=${v.id}`;
                        card.className = 'up-next-card animate-fade-in';
                        card.innerHTML = `
                            <div class="up-next-thumbnail">
                                <img src="${API_BASE_URL}/api/videos/${v.id}/thumbnail" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
                                <div style="display:none; width:100%; height:100%; align-items:center; justify-content:center;">
                                    <i data-lucide="play-circle" style="color: var(--text-secondary);"></i>
                                </div>
                            ${v.duration_seconds ? `<div class="video-duration">${formatDuration(v.duration_seconds)}</div>` : ""}</div>
                            <div class="up-next-info">
                                <h4 class="up-next-title">${escapeHTML(v.title)}</h4>
                                <p class="up-next-author">${escapeHTML(v.owner_username)}</p>
                                <p class="up-next-views">${v.views.toLocaleString()} views</p>
                            </div>
                        `;
                        recommendedContainer.insertBefore(card, sentinel);
                    });
                }
            });
            await upNextScroller.initialize();
        } catch(e) {
            console.error("Failed to load up next", e);
        }
        lucide.createIcons();
        
    } catch (error) {
        document.getElementById('video-title').textContent = "Failed to load video.";
    }
}

async function loadComments() {
    const list = document.getElementById('comments-list');
    list.innerHTML = '';
    
    commentsScroller = new InfiniteScroller({
        endpoint: `/api/videos/${currentVideoId}/comments`,
        container: list,
        emptyHTML: '<p style="color: var(--text-secondary);">No comments yet. Be the first to comment!</p>',
        renderCallback: (items, sentinel) => {
            items.forEach(c => {
                const date = new Date(c.created_at).toLocaleDateString();
                const avatarUrl = `${API_BASE_URL}/api/users/${c.user_username}/avatar`;
                
                let contentHtml = parseTimestamps(c.content);
                contentHtml = contentHtml.replace(/;;EMOJI:(\d+);;/g, `<img src="${API_BASE_URL}/api/emojis/image/$1" style="height: 1.5em; vertical-align: middle; margin: 0 0.1em;" title="Emoji">`);
                contentHtml = contentHtml.replace(/;;MEM_EMOJI:(\d+);;/g, `<img src="${API_BASE_URL}/api/memberships/emojis/$1/image" style="height: 1.5em; vertical-align: middle; margin: 0 0.1em;" title="Membership Emoji">`);
                
                const badgeHtml = c.author_badge_path ? `<img src="${API_BASE_URL}${c.author_badge_path}" style="height: 1.25em; margin-left: 0.5em; vertical-align: middle;" title="Channel Member">` : '';
                
                const div = document.createElement('div');
                div.className = 'comment';
                div.innerHTML = `
                    <div class="comment-avatar">
                        <img src="${avatarUrl}" onerror="this.outerHTML='<i data-lucide=\\'user\\' style=\\'color: var(--text-secondary);\\'></i>'">
                    </div>
                    <div class="comment-content">
                        <h4>${escapeHTML(c.user_username)}${badgeHtml} <span style="color: var(--text-secondary); font-size: 0.75rem; font-weight: normal; margin-left: 0.5rem;">${date}</span></h4>
                        <p>${contentHtml}</p>
                    </div>
                `;
                list.insertBefore(div, sentinel);
            });
            lucide.createIcons();
        }
    });
    
    try {
        await commentsScroller.initialize();
    } catch(e) {
        list.innerHTML = '<p style="color: #ef4444;">Failed to load comments.</p>';
    }
}

document.getElementById('post-comment-btn').addEventListener('click', async () => {
    const input = document.getElementById('comment-input');
    const content = input.value.trim();
    if (!content) return;
    
    // Require login for commenting
    const token = localStorage.getItem('phryco_token');
    const userStr = localStorage.getItem('phryco_user');
    if (!token || !userStr) {
        showToast("You must be logged in to comment.", "error");
        window.location.href = '../../pages/login/index.html';
        return;
    }
    
    const user = JSON.parse(userStr);
    
    const list = document.getElementById('comments-list');
    
    let contentHtml = parseTimestamps(content);
    contentHtml = contentHtml.replace(/;;EMOJI:(\d+);;/g, `<img src="${API_BASE_URL}/api/emojis/image/$1" style="height: 1.5em; vertical-align: middle; margin: 0 0.1em;" title="Emoji">`);
    contentHtml = contentHtml.replace(/;;MEM_EMOJI:(\d+);;/g, `<img src="${API_BASE_URL}/api/memberships/emojis/$1/image" style="height: 1.5em; vertical-align: middle; margin: 0 0.1em;" title="Membership Emoji">`);
    
    const tempDiv = document.createElement('div');
    tempDiv.className = 'comment';
    tempDiv.style.opacity = '0.5';
    tempDiv.style.transition = 'opacity 0.3s';
    tempDiv.innerHTML = `
        <div class="comment-avatar">
            <img src="${API_BASE_URL}/api/users/${user.username}/avatar" onerror="this.outerHTML='<i data-lucide=\\'user\\' style=\\'color: var(--text-secondary);\\'></i>'">
        </div>
        <div class="comment-content">
            <h4>${escapeHTML(user.username)} <span style="color: var(--text-secondary); font-size: 0.75rem; font-weight: normal; margin-left: 0.5rem;">Just now</span></h4>
            <p>${contentHtml}</p>
        </div>
    `;
    list.insertBefore(tempDiv, list.firstChild);
    if(window.lucide) window.lucide.createIcons();
    
    input.value = '';
    
    try {
        await apiFetch(`/api/videos/${currentVideoId}/comments`, {
            method: 'POST',
            body: { content: content }
        });
        tempDiv.style.opacity = '1';
    } catch (error) {
        tempDiv.remove();
        input.value = content;
        showToast("Failed to post comment: " + error.message, "error");
    }
});

let globalEmojis = [];
let channelEmojis = [];
let currentEmojiTab = 'global';

async function loadEmojis() {
    try {
        let globalData = await apiFetch('/api/emojis/global').catch(() => []);
        globalEmojis = globalData.map(e => ({...e, type: 'EMOJI'}));
        
        if (currentVideoOwner) {
            let memEmojis = await apiFetch(`/api/memberships/channel/${encodeURIComponent(currentVideoOwner)}/emojis`).catch(() => []);
            memEmojis = memEmojis.map(e => ({...e, type: 'MEM_EMOJI'}));
            
            let standardChannelEmojis = await apiFetch(`/api/emojis/channel/${encodeURIComponent(currentVideoOwner)}`).catch(() => []);
            standardChannelEmojis = standardChannelEmojis.map(e => ({...e, type: 'EMOJI'}));
            
            channelEmojis = [...standardChannelEmojis, ...memEmojis];
        }
        renderEmojiList();
    } catch (e) {
        console.error(e);
    }
}

function renderEmojiList() {
    const container = document.getElementById('emoji-list-container');
    container.innerHTML = '';
    
    const emojis = currentEmojiTab === 'global' ? globalEmojis : channelEmojis;
    
    if (emojis.length === 0) {
        container.innerHTML = '<p style="color: var(--text-secondary); grid-column: span 5; font-size: 0.875rem;">No emojis available.</p>';
        return;
    }
    
    emojis.forEach(e => {
        const btn = document.createElement('button');
        btn.style = 'background:none; border:none; padding:4px; cursor:pointer; border-radius:4px; transition: background 0.2s; position: relative;';
        
        let lockHtml = '';
        if (e.is_locked) {
            lockHtml = `<div style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.6); display: flex; align-items: center; justify-content: center; border-radius: 4px;"><i data-lucide="lock" style="width: 16px; height: 16px; color: white;"></i></div>`;
            btn.style.cursor = 'not-allowed';
            btn.title = `Locked: Requires ${e.tier_name}`;
        } else {
            btn.title = `:${e.name}:`;
            btn.onmouseover = () => btn.style.background = 'rgba(255,255,255,0.1)';
            btn.onmouseout = () => btn.style.background = 'none';
            btn.onclick = () => {
                const input = document.getElementById('comment-input');
                input.value += `;;${e.type}:${e.id};;`;
                document.getElementById('emoji-picker-popup').style.display = 'none';
                input.focus();
            };
        }
        
        btn.innerHTML = `<img src="${API_BASE_URL}${e.image_url}" style="width: 100%; height: 32px; object-fit: contain;">${lockHtml}`;
        container.appendChild(btn);
    });
    lucide.createIcons();
}

document.getElementById('emoji-picker-btn').addEventListener('click', () => {
    const popup = document.getElementById('emoji-picker-popup');
    if (popup.style.display === 'none' || !popup.style.display) {
        popup.style.display = 'block';
        if (globalEmojis.length === 0) {
            loadEmojis();
        }
    } else {
        popup.style.display = 'none';
    }
});

document.getElementById('tab-global-emojis').addEventListener('click', (e) => {
    currentEmojiTab = 'global';
    e.target.style.color = 'var(--accent-primary)';
    e.target.style.fontWeight = 'bold';
    document.getElementById('tab-channel-emojis').style.color = 'var(--text-secondary)';
    document.getElementById('tab-channel-emojis').style.fontWeight = 'normal';
    renderEmojiList();
});

document.getElementById('tab-channel-emojis').addEventListener('click', (e) => {
    currentEmojiTab = 'channel';
    e.target.style.color = 'var(--accent-primary)';
    e.target.style.fontWeight = 'bold';
    document.getElementById('tab-global-emojis').style.color = 'var(--text-secondary)';
    document.getElementById('tab-global-emojis').style.fontWeight = 'normal';
    renderEmojiList();
});

document.addEventListener('keydown', (e) => {
    // Ignore if typing in an input or textarea
    if (e.target.tagName.toLowerCase() === 'input' || e.target.tagName.toLowerCase() === 'textarea') {
        return;
    }
    
    const player = document.getElementById('video-player');
    if (!player) return;
    switch(e.key.toLowerCase()) {
        case ' ':
        case 'k':
            e.preventDefault();
            if (player.paused) player.play();
            else player.pause();
            break;
        case 'j':
            player.currentTime = Math.max(0, player.currentTime - 10);
            break;
        case 'l':
            player.currentTime = Math.min(player.duration, player.currentTime + 10);
            break;
        case 'm':
            player.muted = !player.muted;
            break;
        case 'f':
            if (document.fullscreenElement) {
                document.exitFullscreen();
            } else {
                const container = document.querySelector('.video-player-container');
                if (container.requestFullscreen) {
                    container.requestFullscreen();
                }
            }
            break;
        case 's':
            const screenshotBtn = document.getElementById('screenshot-btn');
            if (screenshotBtn) screenshotBtn.click();
            break;
        case '0': case '1': case '2': case '3': case '4': 
        case '5': case '6': case '7': case '8': case '9':
            if (player.duration) {
                player.currentTime = player.duration * (parseInt(e.key) / 10);
            }
            break;
    }
});

document.addEventListener('DOMContentLoaded', loadWatchPage);
