/**
 * Phryco UI Customizer Module
 * Enforces separation of concerns by isolating all visual theming, HSL accent controls,
 * layout density, and ambient lighting states into a single clean module.
 */

const DEFAULT_CONFIG = {
    theme: 'deep-space',      // 'deep-space', 'midnight-oled', 'cyberpunk-neon', 'crimson-eclipse', 'classic-refined'
    accentHue: 242,           // Indigo default HSL hue
    density: 'cinematic',     // 'cinematic', 'compact'
    glowIntensity: 'subtle'   // 'off', 'subtle', 'intense'
};

export class UICustomizer {
    constructor() {
        this.config = this.loadConfig();
        this.drawerEl = null;
    }

    loadConfig() {
        try {
            const saved = localStorage.getItem('phryco_ui_config');
            return saved ? { ...DEFAULT_CONFIG, ...JSON.parse(saved) } : { ...DEFAULT_CONFIG };
        } catch (e) {
            return { ...DEFAULT_CONFIG };
        }
    }

    saveConfig() {
        localStorage.setItem('phryco_ui_config', JSON.stringify(this.config));
        this.applyToDOM();
    }

    applyToDOM() {
        const root = document.documentElement;
        
        // 1. Theme Data Attribute
        root.setAttribute('data-theme', this.config.theme);
        
        // 2. Accent Color Bindings (HSL generation)
        const h = this.config.accentHue;
        root.style.setProperty('--accent-h', h);
        root.style.setProperty('--accent-primary', `hsl(${h}, 84%, 60%)`);
        root.style.setProperty('--accent-hover', `hsl(${h}, 84%, 50%)`);
        root.style.setProperty('--accent-glow', `hsla(${h}, 84%, 60%, 0.4)`);
        
        // 3. Layout Density
        root.setAttribute('data-density', this.config.density);
        
        // 4. Ambient Glow Intensity
        root.setAttribute('data-glow', this.config.glowIntensity);
        
        // Broadcast custom event for dynamic components (like Video Canvas Aura)
        window.dispatchEvent(new CustomEvent('phryco-theme-update', { detail: this.config }));
    }

    initTrigger(navLinksContainer, insertBeforeElement = null) {
        if (document.getElementById('ui-customizer-btn')) return;
        
        const btn = document.createElement('a');
        btn.href = '#';
        btn.id = 'ui-customizer-btn';
        btn.className = 'customizer-nav-btn';
        btn.innerHTML = `
            <span class="customizer-icon-glow"></span>
            <i data-lucide="palette" style="width: 18px; height: 18px; color: var(--accent-primary);"></i>
            <span class="customizer-btn-text">Themes</span>
        `;
        btn.setAttribute('title', 'Customize UI & Theme Polish');

        if (insertBeforeElement) {
            navLinksContainer.insertBefore(btn, insertBeforeElement);
        } else {
            navLinksContainer.appendChild(btn);
        }

        btn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.toggleDrawer();
        });
        
        if (window.lucide) window.lucide.createIcons();
    }

    toggleDrawer() {
        if (!this.drawerEl) {
            this.buildDrawer();
        }
        const isOpen = this.drawerEl.classList.contains('open');
        if (isOpen) {
            this.drawerEl.classList.remove('open');
        } else {
            this.drawerEl.classList.add('open');
        }
    }

    buildDrawer() {
        this.drawerEl = document.createElement('div');
        this.drawerEl.className = 'phryco-customizer-drawer';
        this.drawerEl.innerHTML = `
            <div class="customizer-overlay"></div>
            <div class="customizer-panel">
                <div class="customizer-header">
                    <div class="header-title">
                        <i data-lucide="sparkles" style="color: var(--phrybucks-gold);"></i>
                        <h3>Studio Polish & Themes</h3>
                    </div>
                    <button class="close-customizer" title="Close Drawer">&times;</button>
                </div>

                <div class="customizer-section">
                    <label class="section-label">Cinematic Theme Preset</label>
                    <div class="theme-picker-grid">
                        <button class="theme-preset-btn ${this.config.theme === 'deep-space' ? 'active' : ''}" data-theme="deep-space">
                            <span class="swatch deep-space-swatch"></span>
                            <span>Deep Space Glass</span>
                        </button>
                        <button class="theme-preset-btn ${this.config.theme === 'midnight-oled' ? 'active' : ''}" data-theme="midnight-oled">
                            <span class="swatch oled-swatch"></span>
                            <span>Midnight OLED</span>
                        </button>
                        <button class="theme-preset-btn ${this.config.theme === 'cyberpunk-neon' ? 'active' : ''}" data-theme="cyberpunk-neon">
                            <span class="swatch cyberpunk-swatch"></span>
                            <span>Cyberpunk 2077</span>
                        </button>
                        <button class="theme-preset-btn ${this.config.theme === 'crimson-eclipse' ? 'active' : ''}" data-theme="crimson-eclipse">
                            <span class="swatch crimson-swatch"></span>
                            <span>Crimson Eclipse</span>
                        </button>
                        <button class="theme-preset-btn ${this.config.theme === 'classic-refined' ? 'active' : ''}" data-theme="classic-refined">
                            <span class="swatch classic-swatch"></span>
                            <span>Classic Refined</span>
                        </button>
                    </div>
                </div>

                <div class="customizer-section">
                    <label class="section-label">Accent Color Tone (HSL Hue)</label>
                    <div class="hue-slider-wrapper">
                        <input type="range" min="0" max="360" value="${this.config.accentHue}" class="hue-slider" id="accent-hue-slider">
                        <div class="hue-preview-badge" style="background: hsl(${this.config.accentHue}, 84%, 60%);"></div>
                    </div>
                </div>

                <div class="customizer-section">
                    <label class="section-label">Grid View Density</label>
                    <div class="toggle-pills">
                        <button class="density-pill ${this.config.density === 'cinematic' ? 'active' : ''}" data-density="cinematic">
                            <i data-lucide="layout-grid" style="width:16px;height:16px;"></i> Cinematic 16:9
                        </button>
                        <button class="density-pill ${this.config.density === 'compact' ? 'active' : ''}" data-density="compact">
                            <i data-lucide="list" style="width:16px;height:16px;"></i> Compact Grid
                        </button>
                    </div>
                </div>

                <div class="customizer-section">
                    <label class="section-label">Card & Border Ambient Glow</label>
                    <div class="toggle-pills">
                        <button class="glow-pill ${this.config.glowIntensity === 'off' ? 'active' : ''}" data-glow="off">Off</button>
                        <button class="glow-pill ${this.config.glowIntensity === 'subtle' ? 'active' : ''}" data-glow="subtle">Subtle</button>
                        <button class="glow-pill ${this.config.glowIntensity === 'intense' ? 'active' : ''}" data-glow="intense">Intense</button>
                    </div>
                </div>

                <div class="customizer-footer">
                    <button class="btn-reset-themes">Reset Default</button>
                    <span class="footer-note"><i data-lucide="check-circle-2" style="width:14px;height:14px;"></i> Automatically saved</span>
                </div>
            </div>
        `;

        document.body.appendChild(this.drawerEl);
        this.bindDrawerEvents();
        if (window.lucide) window.lucide.createIcons();
    }

    bindDrawerEvents() {
        const panel = this.drawerEl.querySelector('.customizer-panel');
        const overlay = this.drawerEl.querySelector('.customizer-overlay');
        const closeBtn = this.drawerEl.querySelector('.close-customizer');
        const resetBtn = this.drawerEl.querySelector('.btn-reset-themes');

        overlay.addEventListener('click', () => this.toggleDrawer());
        closeBtn.addEventListener('click', () => this.toggleDrawer());

        // Theme switching
        panel.querySelectorAll('.theme-preset-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                panel.querySelectorAll('.theme-preset-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.config.theme = btn.dataset.theme;
                // auto adjust preset hue for themed aesthetics if desired
                if (this.config.theme === 'cyberpunk-neon') this.config.accentHue = 330;
                if (this.config.theme === 'crimson-eclipse') this.config.accentHue = 10;
                if (this.config.theme === 'deep-space') this.config.accentHue = 200;
                if (this.config.theme === 'midnight-oled') this.config.accentHue = 275;
                if (this.config.theme === 'classic-refined') this.config.accentHue = 242;
                
                const slider = panel.querySelector('#accent-hue-slider');
                const badge = panel.querySelector('.hue-preview-badge');
                if (slider) slider.value = this.config.accentHue;
                if (badge) badge.style.background = `hsl(${this.config.accentHue}, 84%, 60%)`;
                
                this.saveConfig();
            });
        });

        // Hue slider
        const slider = panel.querySelector('#accent-hue-slider');
        const badge = panel.querySelector('.hue-preview-badge');
        if (slider) {
            slider.addEventListener('input', (e) => {
                this.config.accentHue = parseInt(e.target.value, 10);
                if (badge) badge.style.background = `hsl(${this.config.accentHue}, 84%, 60%)`;
                this.saveConfig();
            });
        }

        // Density buttons
        panel.querySelectorAll('.density-pill').forEach(btn => {
            btn.addEventListener('click', () => {
                panel.querySelectorAll('.density-pill').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.config.density = btn.dataset.density;
                this.saveConfig();
            });
        });

        // Glow buttons
        panel.querySelectorAll('.glow-pill').forEach(btn => {
            btn.addEventListener('click', () => {
                panel.querySelectorAll('.glow-pill').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.config.glowIntensity = btn.dataset.glow;
                this.saveConfig();
            });
        });

        // Reset
        resetBtn.addEventListener('click', () => {
            this.config = { ...DEFAULT_CONFIG };
            this.saveConfig();
            this.drawerEl.remove();
            this.drawerEl = null;
            this.toggleDrawer();
        });
    }
}

// Global initialization singleton
export const customizer = new UICustomizer();
customizer.applyToDOM();
