/**
 * ╔═══════════════════════════════════════════════════════════════════════════════╗
 * ║                                                                             ║
 * ║   ██╗   ██╗ █████╗ ██╗   ██╗██╗  ████████╗ ██████╗ ██╗   ██╗ █████╗ ██████╗ ██████╗  ║
 * ║   ██║   ██║██╔══██╗██║   ██║██║  ╚══██╔══╝██╔════╝ ██║   ██║██╔══██╗██╔══██╗██╔══██╗ ║
 * ║   ██║   ██║███████║██║   ██║██║     ██║   ██║  ███╗██║   ██║███████║██████╔╝██║  ██║ ║
 * ║   ╚██╗ ██╔╝██╔══██║██║   ██║██║     ██║   ██║   ██║██║   ██║██╔══██║██╔══██╗██║  ██║ ║
 * ║    ╚████╔╝ ██║  ██║╚██████╔╝███████╗██║   ╚██████╔╝╚██████╔╝██║  ██║██║  ██║██████╔╝ ║
 * ║     ╚═══╝  ╚═╝  ╚═╝ ╚═════╝ ╚══════╝╚═╝    ╚═════╝  ╚═════╝ ╚═╝  ╚═╝╚═╝  ╚═╝╚═════╝  ║
 * ║                                                                             ║
 * ║                    🛡️  VAULTGUARD™ CAPTCHA v1.0.0  🛡️                      ║
 * ║                                                                             ║
 * ║   Privacy-First • Zero Tracking • Cryptographically Secure                  ║
 * ║                                                                             ║
 * ╚═══════════════════════════════════════════════════════════════════════════════╝
 * 
 * @brand      VaultGuard™
 * @product    CAPTCHA
 * @version    1.0.0
 * @license    MIT
 * @author     VaultGuard Security Solutions
 * @copyright  2024 VaultGuard Technologies
 * 
 * A privacy-focused, secure CAPTCHA solution in a single file.
 * 
 * Features:
 * - 🔒 Cryptographic validation with SHA-256
 * - 👁️ Zero tracking or fingerprinting
 * - ⏱️ Time-limited challenges (configurable)
 * - 🎯 Multiple challenge types (math, text, pattern)
 * - 🚫 No external dependencies
 * - 🎨 Beautiful branded UI components
 * 
 * Website: https://everythingtt.github.io/Utilities/dist/captcha/
 * Documentation: https://github.com/everythingtt/Utilities
 */

(function(global) {
  'use strict';

  // ═══════════════════════════════════════════════════════════════════════════════
  // VAULTGUARD BRAND CONFIGURATION
  // ═══════════════════════════════════════════════════════════════════════════════

  const VAULTGUARD = {
    name: 'VaultGuard™',
    product: 'CAPTCHA',
    version: '1.0.0',
    codename: 'Aegis',
    
    // Base URL for production (GitHub Pages)
    // Update this when deploying to a different domain
    baseUrl: 'https://everythingtt.github.io/Utilities/dist/captcha',
    
    // Legal page URLs (relative for local dev, will use baseUrl in production)
    urls: {
      privacy: 'privacy.html',
      terms: 'terms.html',
      home: 'index.html'
    },
    
    brandColors: {
      primary: '#1e3a5f',      // Deep Security Blue
      secondary: '#00d4aa',    // Shield Green
      accent: '#ff6b35',       // Alert Orange
      success: '#10b981',      // Verified Green
      error: '#ef4444',        // Error Red
      warning: '#f59e0b',      // Warning Amber
      background: '#f8fafc',   // Light Background
      surface: '#ffffff',      // Card Surface
      text: '#1e293b',         // Primary Text
      textMuted: '#64748b',    // Secondary Text
      border: '#e2e8f0'        // Border Color
    },
    
    logo: {
      // SVG Logo - Shield with Checkmark
      svg: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="shieldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:#1e3a5f"/>
            <stop offset="100%" style="stop-color:#0f172a"/>
          </linearGradient>
          <linearGradient id="checkGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:#00d4aa"/>
            <stop offset="100%" style="stop-color:#10b981"/>
          </linearGradient>
        </defs>
        <path d="M50 5 L90 20 V45 C90 70 70 90 50 95 C30 90 10 70 10 45 V20 Z" 
              fill="url(#shieldGrad)" stroke="#0f172a" stroke-width="3"/>
        <path d="M30 50 L45 65 L70 35" 
              fill="none" stroke="url(#checkGrad)" stroke-width="8" 
              stroke-linecap="round" stroke-linejoin="round"/>
      </svg>`,
      
      // Compact shield icon
      icon: `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 2L3 7V12C3 17.5 6.8 22.9 12 24C17.2 22.9 21 17.5 21 12V7L12 2Z" 
              fill="#1e3a5f" stroke="#0f172a" stroke-width="1.5"/>
        <path d="M8.5 12L11 14.5L15.5 9.5" 
              stroke="#00d4aa" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>`
    },
    
    // Brand typography
    typography: {
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      monoFamily: "'JetBrains Mono', 'Fira Code', monospace"
    }
  };

  // ═══════════════════════════════════════════════════════════════════════════════
  // CRYPTOGRAPHIC UTILITIES
  // ═══════════════════════════════════════════════════════════════════════════════

  const CryptoUtils = {
    /**
     * Generate cryptographic hash using Web Crypto API
     * @param {string} data - Data to hash
     * @returns {Promise<string>} SHA-256 hash as hex string
     */
    async hash(data) {
      const encoder = new TextEncoder();
      const dataBuffer = encoder.encode(data);
      const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    },

    /**
     * Generate secure random token
     * @param {number} length - Token length in bytes
     * @returns {string} Hex string token
     */
    generateToken(length = 32) {
      const array = new Uint8Array(length);
      crypto.getRandomValues(array);
      return Array.from(array, b => b.toString(16).padStart(2, '0')).join('');
    },

    /**
     * Generate random number in range
     * @param {number} min - Minimum value (inclusive)
     * @param {number} max - Maximum value (inclusive)
     * @returns {number} Random integer
     */
    randomInt(min, max) {
      const range = max - min + 1;
      const array = new Uint32Array(1);
      crypto.getRandomValues(array);
      return min + (array[0] % range);
    },

    async solveProofOfWork(challenge, difficulty, maxAttempts = 10000000) {
      const target = '0'.repeat(difficulty);
      const startTime = performance.now();
      let nonce = 0;
      const batchSize = 5000;

      while (nonce < maxAttempts) {
        for (let i = 0; i < batchSize && nonce < maxAttempts; i++, nonce++) {
          const data = challenge + nonce.toString();
          const hash = await CryptoUtils.hash(data);
          if (hash.startsWith(target)) {
            const elapsed = performance.now() - startTime;
            return {
              nonce: nonce,
              hash: hash,
              challenge: challenge,
              difficulty: difficulty,
              elapsedMs: Math.round(elapsed),
              hashRate: Math.round(nonce / (elapsed / 1000))
            };
          }
        }
        await new Promise(resolve => setTimeout(resolve, 0));
      }

      return null;
    },

    async verifyProofOfWork(challenge, nonce, difficulty) {
      const data = challenge + nonce.toString();
      const hash = await CryptoUtils.hash(data);
      const target = '0'.repeat(difficulty);
      return hash.startsWith(target);
    }
  };

  // ═══════════════════════════════════════════════════════════════════════════════
  // VAULTGUARD SECURITY MODULE — Anti-Bot & Web Protection
  // ═══════════════════════════════════════════════════════════════════════════════

  const SecurityModule = {
    _initialized: false,
    _sessionToken: null,
    _fingerprint: null,
    _behaviorData: {
      mouseMovements: [],
      keyPresses: [],
      touchEvents: [],
      startTime: null,
      lastActivity: null,
      totalInteractions: 0
    },
    _honeypotFields: [],
    _securityHeaders: {},

    // ─── ANTI-BOT / ANTI-AUTOMATION ──────────────────────────────────────────

    /**
     * Initialize behavioral tracking for bot detection.
     * Monitors mouse movement patterns, keystroke dynamics, touch events,
     * and timing anomalies that distinguish humans from automated scripts.
     */
    initBehavioralTracking() {
      if (this._behaviorData.startTime) return;
      this._behaviorData.startTime = Date.now();
      this._behaviorData.lastActivity = Date.now();

      const moveHandler = (e) => {
        const now = Date.now();
        this._behaviorData.mouseMovements.push({
          x: e.clientX,
          y: e.clientY,
          t: now
        });
        if (this._behaviorData.mouseMovements.length > 200) {
          this._behaviorData.mouseMovements.shift();
        }
        this._behaviorData.lastActivity = now;
        this._behaviorData.totalInteractions++;
      };

      const keyHandler = (e) => {
        const now = Date.now();
        this._behaviorData.keyPresses.push({
          key: e.key ? (e.key.length === 1 ? '*' : e.key) : 'Unknown',
          t: now
        });
        if (this._behaviorData.keyPresses.length > 100) {
          this._behaviorData.keyPresses.shift();
        }
        this._behaviorData.lastActivity = now;
        this._behaviorData.totalInteractions++;
      };

      const touchHandler = (e) => {
        const now = Date.now();
        const touches = [];
        for (let i = 0; i < e.touches.length; i++) {
          touches.push({ x: e.touches[i].clientX, y: e.touches[i].clientY });
        }
        this._behaviorData.touchEvents.push({ touches, t: now });
        if (this._behaviorData.touchEvents.length > 100) {
          this._behaviorData.touchEvents.shift();
        }
        this._behaviorData.lastActivity = now;
        this._behaviorData.totalInteractions++;
      };

      document.addEventListener('mousemove', moveHandler, { passive: true });
      document.addEventListener('keydown', keyHandler, { passive: true });
      document.addEventListener('touchstart', touchHandler, { passive: true });
      document.addEventListener('touchmove', touchHandler, { passive: true });
    },

    /**
     * Analyze collected behavioral data to produce a bot-likelihood score.
     * Returns a score from 0.0 (definitely human) to 1.0 (definitely bot).
     *
     * Detection heuristics:
     * - Zero mouse movements with form submission = bot
     * - Perfectly linear mouse trajectories = bot
     * - Keystroke intervals too uniform (low variance) = bot
     * - Submission too fast for a human to read/answer = bot
     * - No touch events on a touch-capable device = suspicious
     */
    analyzeBehavior() {
      const data = this._behaviorData;
      const timeOnPage = Date.now() - (data.startTime || Date.now());
      let score = 0.0;
      const signals = [];

      // Signal 1: No mouse movement at all
      if (data.mouseMovements.length === 0) {
        score += 0.35;
        signals.push('no_mouse_movement');
      }

      // Signal 2: Mouse movement too linear (bots move in straight lines)
      if (data.mouseMovements.length >= 3) {
        let directionChanges = 0;
        let totalSegments = 0;
        for (let i = 2; i < data.mouseMovements.length; i++) {
          const dx1 = data.mouseMovements[i - 1].x - data.mouseMovements[i - 2].x;
          const dy1 = data.mouseMovements[i - 1].y - data.mouseMovements[i - 2].y;
          const dx2 = data.mouseMovements[i].x - data.mouseMovements[i - 1].x;
          const dy2 = data.mouseMovements[i].y - data.mouseMovements[i - 1].y;
          const cross = dx1 * dy2 - dy1 * dx2;
          if (Math.abs(cross) > 10) directionChanges++;
          totalSegments++;
        }
        const linearity = totalSegments > 0 ? 1 - (directionChanges / totalSegments) : 1;
        if (linearity > 0.95 && totalSegments > 5) {
          score += 0.25;
          signals.push('linear_mouse_path');
        }
      }

      // Signal 3: Keystroke dynamics too uniform
      if (data.keyPresses.length >= 3) {
        const intervals = [];
        for (let i = 1; i < data.keyPresses.length; i++) {
          intervals.push(data.keyPresses[i].t - data.keyPresses[i - 1].t);
        }
        const mean = intervals.reduce((a, b) => a + b, 0) / intervals.length;
        const variance = intervals.reduce((a, b) => a + (b - mean) ** 2, 0) / intervals.length;
        const cv = mean > 0 ? Math.sqrt(variance) / mean : 0;
        if (cv < 0.1 && intervals.length > 3) {
          score += 0.2;
          signals.push('uniform_keystrokes');
        }
      }

      // Signal 4: Submission impossibly fast (< 1.5 seconds)
      if (timeOnPage < 1500) {
        score += 0.25;
        signals.push('too_fast_submission');
      }

      // Signal 5: No interactions at all
      if (data.totalInteractions === 0) {
        score += 0.3;
        signals.push('zero_interactions');
      }

      // Signal 6: Touch-capable device but no touch events
      if ('ontouchstart' in window && data.touchEvents.length === 0 && timeOnPage > 3000) {
        score += 0.1;
        signals.push('no_touch_on_touch_device');
      }

      return {
        score: Math.min(score, 1.0),
        signals,
        timeOnPage,
        interactionCount: data.totalInteractions,
        isBot: score >= 0.5
      };
    },

    /**
     * Create invisible honeypot fields that bots fill out but humans cannot see.
     * Any filled honeypot field indicates automated submission.
     * @param {HTMLFormElement} form - The form to add honeypots to
     * @returns {string[]} Names of honeypot fields created
     */
    deployHoneypot(form) {
      const fieldNames = [];
      const honeypotConfigs = [
        { name: 'website_url', type: 'text', placeholder: 'Your website URL' },
        { name: 'email_confirm', type: 'email', placeholder: 'Confirm your email' },
      ];

      honeypotConfigs.forEach(config => {
        const wrapper = document.createElement('div');
        wrapper.style.cssText = 'position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0;pointer-events:none;';
        wrapper.setAttribute('aria-hidden', 'true');
        wrapper.setAttribute('tabindex', '-1');
        wrapper.setAttribute('data-vg-honeypot', 'true');

        const input = document.createElement('input');
        input.type = config.type;
        input.name = config.name;
        input.placeholder = config.placeholder;
        input.setAttribute('autocomplete', 'off');
        input.setAttribute('tabindex', '-1');
        input.style.cssText = 'font-size:16px;';

        wrapper.appendChild(input);
        form.appendChild(wrapper);
        this._honeypotFields.push(config.name);
        fieldNames.push(config.name);
      });

      return fieldNames;
    },

    /**
     * Check if any honeypot fields were filled (indicates bot).
     * @param {HTMLFormElement} form - The form to check
     * @returns {boolean} True if a honeypot was triggered
     */
    checkHoneypot(form) {
      for (const name of this._honeypotFields) {
        const field = form.querySelector(`[name="${name}"]`);
        if (field) {
          if (field.type === 'checkbox' && field.checked) return true;
          if (field.type !== 'checkbox' && field.value && field.value.trim() !== '') return true;
        }
      }
      return false;
    },

    // ─── XSS PROTECTION ──────────────────────────────────────────────────────

    /**
     * Sanitize user input to prevent XSS attacks.
     * Strips HTML tags, encodes special characters, and neutralizes
     * javascript: and data: URI schemes.
     * @param {string} input - Raw user input
     * @returns {string} Sanitized string safe for insertion into DOM
     */
    sanitizeInput(input) {
      if (typeof input !== 'string') return '';

      let sanitized = input;

      // Remove null bytes
      sanitized = sanitized.replace(/\0/g, '');

      // Encode HTML entities
      const entityMap = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#x27;',
        '/': '&#x2F;',
        '`': '&#96;'
      };
      sanitized = sanitized.replace(/[&<>"'\/`]/g, char => entityMap[char]);

      // Neutralize javascript: and data: URI schemes
      sanitized = sanitized.replace(/javascript:/gi, 'blocked:');
      sanitized = sanitized.replace(/data:text\/html/gi, 'blocked:');
      sanitized = sanitized.replace(/vbscript:/gi, 'blocked:');

      // Remove event handler patterns
      sanitized = sanitized.replace(/on\w+\s*=/gi, 'blocked=');

      return sanitized;
    },

    /**
     * Safely set text content on an element, preventing XSS via innerHTML.
     * @param {HTMLElement} element - Target element
     * @param {string} text - Text to set
     */
    safeSetText(element, text) {
      if (element) {
        element.textContent = this.sanitizeInput(text);
      }
    },

    /**
     * Generate Content-Security-Policy header value for the host page.
     * Should be set as a <meta> tag or HTTP header by the server.
     * @param {Object} customRules - Additional CSP directives
     * @returns {string} CSP header value
     */
    generateCSP(customRules = {}) {
      const defaults = {
        'default-src': ["'self'"],
        'script-src': ["'self'"],
        'style-src': ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
        'img-src': ["'self'", 'https://loremflickr.com', 'https://upload.wikimedia.org', 'data:'],
        'font-src': ["'self'", 'https://fonts.gstatic.com'],
        'connect-src': ["'self'"],
        'form-action': ["'self'"],
        'base-uri': ["'self'"]
      };

      const merged = { ...defaults, ...customRules };
      const directives = [];
      for (const [directive, sources] of Object.entries(merged)) {
        if (Array.isArray(sources) && sources.length > 0) {
          directives.push(`${directive} ${sources.join(' ')}`);
        }
      }
      return directives.join('; ');
    },

    /**
     * Inject a CSP meta tag into the document head.
     * Note: HTTP headers are preferred; meta tags have limited support.
     */
    injectCSPMeta() {
      if (document.querySelector('meta[http-equiv="Content-Security-Policy"]')) return;
      const meta = document.createElement('meta');
      meta.httpEquiv = 'Content-Security-Policy';
      meta.content = this.generateCSP();
      document.head.appendChild(meta);
    },

    // ─── CSRF PROTECTION ─────────────────────────────────────────────────────

    /**
     * Generate a CSRF token bound to the current session.
     * The token is a cryptographically random value stored in sessionStorage.
     * @returns {string} CSRF token
     */
    generateCSRFToken() {
      const token = CryptoUtils.generateToken(32);
      try {
        sessionStorage.setItem('vg_csrf_token', token);
        sessionStorage.setItem('vg_csrf_time', Date.now().toString());
      } catch (e) {
        // sessionStorage unavailable — fall back to memory
        this._sessionToken = token;
      }
      return token;
    },

    /**
     * Validate a submitted CSRF token against the stored token.
     * Tokens expire after 1 hour.
     * @param {string} submittedToken - Token from the form submission
     * @returns {boolean} True if token is valid
     */
    validateCSRFToken(submittedToken) {
      let storedToken;
      try {
        storedToken = sessionStorage.getItem('vg_csrf_token');
        const storedTime = parseInt(sessionStorage.getItem('vg_csrf_time') || '0', 10);
        if (Date.now() - storedTime > 3600000) {
          sessionStorage.removeItem('vg_csrf_token');
          sessionStorage.removeItem('vg_csrf_time');
          return false;
        }
      } catch (e) {
        storedToken = this._sessionToken;
      }

      if (!storedToken || !submittedToken) return false;

      // Constant-time comparison to prevent timing attacks
      if (storedToken.length !== submittedToken.length) return false;
      let result = 0;
      for (let i = 0; i < storedToken.length; i++) {
        result |= storedToken.charCodeAt(i) ^ submittedToken.charCodeAt(i);
      }
      return result === 0;
    },

    /**
     * Inject a hidden CSRF token field into a form.
     * @param {HTMLFormElement} form - The form to protect
     * @returns {string} The CSRF token value
     */
    injectCSRFField(form) {
      const token = this.generateCSRFToken();
      const input = document.createElement('input');
      input.type = 'hidden';
      input.name = 'vg_csrf_token';
      input.value = token;
      form.appendChild(input);
      return token;
    },

    // ─── CLICKJACKING PROTECTION ──────────────────────────────────────────────

    /**
     * Inject frame-busting JavaScript that prevents the page from being
     * loaded in an iframe. This is a client-side defense; the server
     * should also send X-Frame-Options: DENY or CSP frame-ancestors.
     */
    injectFrameBuster() {
      if (window.self !== window.top) {
        // We're in an iframe — attempt to break out
        try {
          window.top.location = window.self.location;
        } catch (e) {
          // Cross-origin restriction — hide the entire page
          document.body.style.display = 'none';
          throw new Error('VaultGuard: This page cannot be displayed in a frame. Clickjacking attempt detected.');
        }
      }

      // Monitor for iframe insertion via MutationObserver
      const observer = new MutationObserver((mutations) => {
        for (const mutation of mutations) {
          for (const node of mutation.addedNodes) {
            if (node.nodeName === 'IFRAME') {
              const src = node.getAttribute('src') || '';
              const isTrusted = src === '' || src.startsWith(window.location.origin);
              if (!isTrusted) {
                node.remove();
                console.warn('VaultGuard: Removed untrusted iframe element.');
              }
            }
          }
        }
      });

      if (document.body) {
        observer.observe(document.body, { childList: true, subtree: true });
      } else {
        document.addEventListener('DOMContentLoaded', () => {
          observer.observe(document.body, { childList: true, subtree: true });
        });
      }
    },

    /**
     * Generate the recommended X-Frame-Options header value.
     * Server should set: X-Frame-Options: DENY
     * @returns {string} Recommended header value
     */
    getFrameOptionsHeader() {
      return 'DENY';
    },

    // ─── SESSION HIJACK PROTECTION ────────────────────────────────────────────

    /**
     * Generate a browser fingerprint using available navigator and screen
     * properties. This fingerprint is used to bind the CAPTCHA session
     * to the browser, making stolen tokens unusable from a different browser.
     *
     * This is NOT tracking — it is used only for session binding.
     * @returns {Promise<string>} SHA-256 hash of fingerprint components
     */
    async generateFingerprint() {
      const components = [
        navigator.userAgent,
        navigator.language,
        screen.colorDepth.toString(),
        screen.width.toString() + 'x' + screen.height.toString(),
        Intl.DateTimeFormat().resolvedOptions().timeZone,
        navigator.platform || ''
      ];

      const fingerprintString = components.join('|');
      this._fingerprint = await CryptoUtils.hash(fingerprintString);
      return this._fingerprint;
    },

    /**
     * Verify that the current browser fingerprint matches the one
     * recorded when the session was created.
     * @param {string} originalFingerprint - The fingerprint from session creation
     * @returns {Promise<boolean>} True if fingerprints match
     */
    async verifyFingerprint(originalFingerprint) {
      if (!originalFingerprint) return false;
      const current = await this.generateFingerprint();
      return current === originalFingerprint;
    },

    /**
     * Bind a challenge to the current browser fingerprint.
     * The challenge can only be verified from the same browser.
     * @param {string} challengeId - The challenge ID to bind
     * @returns {Promise<string>} The fingerprint hash
     */
    async bindChallengeToSession(challengeId) {
      const fingerprint = await this.generateFingerprint();
      try {
        sessionStorage.setItem('vg_challenge_fp_' + challengeId, fingerprint);
        sessionStorage.setItem('vg_challenge_time_' + challengeId, Date.now().toString());
      } catch (e) {
        // sessionStorage unavailable
      }
      return fingerprint;
    },

    /**
     * Verify a challenge submission against its bound fingerprint.
     * @param {string} challengeId - The challenge ID
     * @returns {Promise<boolean>} True if the session is valid
     */
    async verifyChallengeSession(challengeId) {
      let storedFp, storedTime;
      try {
        storedFp = sessionStorage.getItem('vg_challenge_fp_' + challengeId);
        storedTime = parseInt(sessionStorage.getItem('vg_challenge_time_' + challengeId) || '0', 10);
      } catch (e) {
        return true; // Can't verify without storage — allow
      }

      if (!storedFp) return true;

      // Check if session binding has expired (30 minutes)
      if (Date.now() - storedTime > 1800000) {
        return false;
      }

      const currentFp = await this.generateFingerprint();
      return currentFp === storedFp;
    },

    // ─── TABNAPPING PROTECTION ───────────────────────────────────────────────

    /**
     * Protect against tabnapping by clearing the window.opener reference
     * and injecting a referrer policy. Should be called on page load.
     */
    protectAgainstTabnapping() {
      // Clear opener to prevent reverse tabnapping
      if (window.opener) {
        try {
          window.opener = null;
        } catch (e) {
          // Some browsers restrict this
        }
      }

      // Set referrer policy to prevent leaking referrer to external sites
      let meta = document.querySelector('meta[name="referrer"]');
      if (!meta) {
        meta = document.createElement('meta');
        meta.name = 'referrer';
        meta.content = 'strict-origin-when-cross-origin';
        document.head.appendChild(meta);
      }

      // Monitor window.open calls
      const originalOpen = window.open;
      window.open = function(...args) {
        const url = args[0];
        if (url && typeof url === 'string' && !url.startsWith(window.location.origin)) {
          // Add noopener and noreferrer to external links
          const features = args[2] || '';
          if (features && typeof features === 'string') {
            if (!features.includes('noopener')) args[2] = features + ',noopener';
            if (!features.includes('noreferrer')) args[2] = features + ',noreferrer';
          } else {
            args[2] = 'noopener,noreferrer';
          }
        }
        return originalOpen.apply(this, args);
      };
    },

    /**
     * Mark all external links in the document with rel="noopener noreferrer"
     * to prevent tabnapping via user-clicked links.
     */
    secureExternalLinks() {
      const links = document.querySelectorAll('a[target="_blank"]');
      links.forEach(link => {
        const href = link.getAttribute('href') || '';
        if (href && !href.startsWith(window.location.origin) && !href.startsWith('#')) {
          const rel = (link.getAttribute('rel') || '').split(/\s+/);
          if (!rel.includes('noopener')) rel.push('noopener');
          if (!rel.includes('noreferrer')) rel.push('noreferrer');
          link.setAttribute('rel', rel.join(' ').trim());
        }
      });
    },

    // ─── ROGUE ADDON / EXTENSION DETECTION ───────────────────────────────────

    /**
     * Detect potentially malicious browser extensions by checking for
     * known extension DOM modifications, injected scripts, and
     * unexpected global variables.
     * @returns {Object} Detection results with findings array
     */
    detectRogueExtensions() {
      const findings = [];

      // Check for known ad-injection patterns
      const suspiciousSelectors = [
        '[id*="adsense"]',
        '[id*="adblock"]',
        '[class*="adsby"]',
        '[id*="sponsored"][style]',
        'iframe[src*="ads"]'
      ];

      suspiciousSelectors.forEach(selector => {
        const elements = document.querySelectorAll(selector);
        if (elements.length > 0) {
          findings.push({
            type: 'suspicious_element',
            selector,
            count: elements.length,
            severity: 'medium'
          });
        }
      });

      // Check for injected scripts from unknown sources
      const scripts = document.querySelectorAll("script[src]");
      const trustedOrigins = [window.location.origin, 'https://fonts.googleapis.com', 'https://fonts.gstatic.com'];
      scripts.forEach(script => {
        const src = script.getAttribute('src') || '';
        if (src && !trustedOrigins.some(origin => src.startsWith(origin)) && !src.startsWith('/')) {
          findings.push({
            type: 'external_script',
            src: src.substring(0, 100),
            severity: 'high'
          });
        }
      });

      // Check for unexpected global variables that extensions commonly inject
      const suspiciousGlobals = ['__firefox__', 'chrome', 'safari', '_phantom', 'callPhantom', '__nightmare', '_selenium', 'callSelenium', 'domAutomation', 'domAutomationController', '__webdriver_script_fn', '__driver_evaluate', '__webdriver_evaluate', '__selenium_evaluate', '__fxdriver_evaluate', '__driver_unwrapped', '__webdriver_unwrapped', '__selenium_unwrapped', '__fxdriver_unwrapped'];
      const detectedGlobals = [];
      suspiciousGlobals.forEach(name => {
        try {
          if (name in window) {
            detectedGlobals.push(name);
          }
        } catch (e) {
          // Some properties throw on access
        }
      });

      if (detectedGlobals.length > 0) {
        findings.push({
          type: 'suspicious_globals',
          globals: detectedGlobals,
          severity: 'medium'
        });
      }

      // Check for DOM elements that shouldn't exist (extension UI overlays)
      const bodyHTML = document.body ? document.body.innerHTML : '';
      const suspiciousPatterns = [
        { pattern: /data-ad-format/, name: 'ad-injection' },
        { pattern: /extension-installed/, name: 'extension-marker' }
      ];

      suspiciousPatterns.forEach(({ pattern, name }) => {
        if (pattern.test(bodyHTML)) {
          findings.push({
            type: 'suspicious_pattern',
            name,
            severity: 'low'
          });
        }
      });

      return {
        detected: findings.length > 0,
        findings,
        riskLevel: findings.some(f => f.severity === 'high') ? 'high' :
                   findings.some(f => f.severity === 'medium') ? 'medium' : 'low'
      };
    },

    // ─── SECURITY HEADERS RECOMMENDATION ─────────────────────────────────────

    /**
     * Generate a complete set of recommended security headers.
     * These should be configured on the server side.
     * @returns {Object} Map of header name to recommended value
     */
    getRecommendedHeaders() {
      return {
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY',
        'X-XSS-Protection': '1; mode=block',
        'Referrer-Policy': 'strict-origin-when-cross-origin',
        'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=()',
        'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
        'Content-Security-Policy': this.generateCSP()
      };
    },

    /**
     * Inject security-related meta tags that can be set client-side.
     */
    injectSecurityMetas() {
      // X-UA-Compatible for IE
      if (!document.querySelector('meta[http-equiv="X-UA-Compatible"]')) {
        const meta = document.createElement('meta');
        meta.httpEquiv = 'X-UA-Compatible';
        meta.content = 'IE=edge';
        document.head.appendChild(meta);
      }

      // Referrer policy
      if (!document.querySelector('meta[name="referrer"]')) {
        const meta = document.createElement('meta');
        meta.name = 'referrer';
        meta.content = 'strict-origin-when-cross-origin';
        document.head.appendChild(meta);
      }

      // Permissions policy (limited browser support via meta)
      if (!document.querySelector('meta[http-equiv="Permissions-Policy"]')) {
        const meta = document.createElement('meta');
        meta.httpEquiv = 'Permissions-Policy';
        meta.content = 'camera=(), microphone=(), geolocation=(), payment=()';
        document.head.appendChild(meta);
      }
    },

    // ─── MASTER INITIALIZATION ───────────────────────────────────────────────

    /**
     * Initialize all client-side security protections.
     * @param {Object} options - Configuration options
     * @param {boolean} options.enableBehavioralTracking - Enable bot detection (default: true)
     * @param {boolean} options.enableFrameBusting - Enable clickjacking protection (default: true)
     * @param {boolean} options.enableTabnappingProtection - Enable tabnapping protection (default: true)
     * @param {boolean} options.enableExtensionDetection - Enable rogue extension detection (default: true)
     * @param {boolean} options.enableCSP - Inject CSP meta tag (default: true)
     * @param {boolean} options.enableSecurityMetas - Inject security meta tags (default: true)
     */
    init(options = {}) {
      if (this._initialized) return;
      this._initialized = true;

      const config = {
        enableBehavioralTracking: true,
        enableFrameBusting: true,
        enableTabnappingProtection: true,
        enableExtensionDetection: true,
        enableCSP: true,
        enableSecurityMetas: true,
        ...options
      };

      if (config.enableBehavioralTracking) {
        this.initBehavioralTracking();
      }

      if (config.enableFrameBusting) {
        this.injectFrameBuster();
      }

      if (config.enableTabnappingProtection) {
        this.protectAgainstTabnapping();
        this.secureExternalLinks();
      }

      if (config.enableCSP) {
        this.injectCSPMeta();
      }

      if (config.enableSecurityMetas) {
        this.injectSecurityMetas();
      }

      if (config.enableExtensionDetection) {
        // Run detection after DOM is ready
        if (document.readyState === 'loading') {
          document.addEventListener('DOMContentLoaded', () => {
            this.detectRogueExtensions();
          });
        } else {
          this.detectRogueExtensions();
        }
      }
    }
  };

  // ═══════════════════════════════════════════════════════════════════════════════
  // IMAGE PUZZLE CONFIGURATION
  // ═══════════════════════════════════════════════════════════════════════════════

  const ImagePuzzles = {
    baseUrl: 'https://loremflickr.com/200/200',
    puzzles: [
      {
        id: 'select-all-cars',
        name: 'Select all cars',
        question: 'Select all images with cars',
        folder: 'select-all-cars',
        correctImages: [
          'https://loremflickr.com/200/200/car?lock=1',
          'https://loremflickr.com/200/200/car?lock=2',
          'https://loremflickr.com/200/200/car?lock=3',
          'https://loremflickr.com/200/200/car?lock=4'
        ],
        incorrectImages: [
          'https://loremflickr.com/200/200/tree?lock=1',
          'https://loremflickr.com/200/200/house?lock=1',
          'https://loremflickr.com/200/200/cloud?lock=1',
          'https://loremflickr.com/200/200/sun?lock=1',
          'https://loremflickr.com/200/200/mountain?lock=1'
        ]
      },
      {
        id: 'select-all-traffic-lights',
        name: 'Select all traffic lights',
        question: 'Select all images with traffic lights',
        folder: 'select-all-traffic-lights',
        correctImages: [
          'https://loremflickr.com/200/200/traffic+light?lock=1',
          'https://loremflickr.com/200/200/traffic+light?lock=2',
          'https://loremflickr.com/200/200/traffic+light?lock=3',
          'https://loremflickr.com/200/200/traffic+light?lock=4'
        ],
        incorrectImages: [
          'https://loremflickr.com/200/200/street+lamp?lock=1',
          'https://loremflickr.com/200/200/lantern?lock=1',
          'https://loremflickr.com/200/200/candle?lock=1',
          'https://loremflickr.com/200/200/flashlight?lock=1',
          'https://loremflickr.com/200/200/neon?lock=1'
        ]
      },
      {
        id: 'select-all-crosswalks',
        name: 'Select all crosswalks',
        question: 'Select all images with crosswalks',
        folder: 'select-all-crosswalks',
        correctImages: [
          'https://loremflickr.com/200/200/crosswalk?lock=1',
          'https://loremflickr.com/200/200/crosswalk?lock=2',
          'https://loremflickr.com/200/200/crosswalk?lock=3',
          'https://loremflickr.com/200/200/crosswalk?lock=4'
        ],
        incorrectImages: [
          'https://loremflickr.com/200/200/ladder?lock=1',
          'https://loremflickr.com/200/200/bridge?lock=1',
          'https://loremflickr.com/200/200/stairs?lock=1',
          'https://loremflickr.com/200/200/railroad?lock=1',
          'https://loremflickr.com/200/200/highway?lock=1'
        ]
      },
      {
        id: 'select-all-fire-hydrants',
        name: 'Select all fire hydrants',
        question: 'Select all images with fire hydrants',
        folder: 'select-all-fire-hydrants',
        correctImages: [
          'https://loremflickr.com/200/200/fire+hydrant?lock=1',
          'https://loremflickr.com/200/200/fire+hydrant?lock=2',
          'https://loremflickr.com/200/200/fire+hydrant?lock=3'
        ],
        incorrectImages: [
          'https://loremflickr.com/200/200/mailbox?lock=1',
          'https://loremflickr.com/200/200/bench?lock=1',
          'https://loremflickr.com/200/200/drain?lock=1',
          'https://loremflickr.com/200/200/manhole?lock=1',
          'https://loremflickr.com/200/200/valve?lock=1',
          'https://loremflickr.com/200/200/fountain?lock=1'
        ]
      },
      {
        id: 'select-all-bicycles',
        name: 'Select all bicycles',
        question: 'Select all images with bicycles',
        folder: 'select-all-bicycles',
        correctImages: [
          'https://loremflickr.com/200/200/bicycle?lock=1',
          'https://loremflickr.com/200/200/bicycle?lock=2',
          'https://loremflickr.com/200/200/bicycle?lock=3'
        ],
        incorrectImages: [
          'https://loremflickr.com/200/200/wheel?lock=1',
          'https://loremflickr.com/200/200/scooter?lock=1',
          'https://loremflickr.com/200/200/motorcycle?lock=1',
          'https://loremflickr.com/200/200/skateboard?lock=1',
          'https://loremflickr.com/200/200/car?lock=10',
          'https://loremflickr.com/200/200/bus?lock=1'
        ]
      },
      {
        id: 'select-all-stop-signs',
        name: 'Select all stop signs',
        question: 'Select all images with stop signs',
        folder: 'select-all-stop-signs',
        correctImages: [
          'https://loremflickr.com/200/200/stop+sign?lock=1',
          'https://loremflickr.com/200/200/stop+sign?lock=2',
          'https://loremflickr.com/200/200/stop+sign?lock=3'
        ],
        incorrectImages: [
          'https://loremflickr.com/200/200/yield+sign?lock=1',
          'https://loremflickr.com/200/200/warning+sign?lock=1',
          'https://loremflickr.com/200/200/no+entry?lock=1',
          'https://loremflickr.com/200/200/caution?lock=1',
          'https://loremflickr.com/200/200/speed+limit?lock=1',
          'https://loremflickr.com/200/200/railroad+crossing?lock=1'
        ]
      }
    ],

    getPuzzle(puzzleId) {
      return this.puzzles.find(p => p.id === puzzleId) || this.puzzles[0];
    },

    getRandomPuzzle() {
      return this.puzzles[CryptoUtils.randomInt(0, this.puzzles.length - 1)];
    },

    shuffleArray(array) {
      const shuffled = [...array];
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = CryptoUtils.randomInt(0, i);
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }
      return shuffled;
    }
  };

  // ═══════════════════════════════════════════════════════════════════════════════
  // CHALLENGE GENERATORS
  // ═══════════════════════════════════════════════════════════════════════════════

  const ChallengeGenerators = {
    /**
     * Math challenge: simple arithmetic
     * @returns {Object} Challenge with question and answer
     */
    math() {
      const operators = ['+', '-', '×'];
      const operator = operators[CryptoUtils.randomInt(0, operators.length - 1)];
      let a, b, answer;

      switch (operator) {
        case '+':
          a = CryptoUtils.randomInt(1, 50);
          b = CryptoUtils.randomInt(1, 50);
          answer = a + b;
          break;
        case '-':
          a = CryptoUtils.randomInt(10, 50);
          b = CryptoUtils.randomInt(1, a);
          answer = a - b;
          break;
        case '×':
          a = CryptoUtils.randomInt(2, 12);
          b = CryptoUtils.randomInt(2, 12);
          answer = a * b;
          break;
      }

      return {
        question: `What is ${a} ${operator} ${b}?`,
        answer: answer.toString()
      };
    },

    /**
     * Text challenge: reverse or manipulate text
     * @returns {Object} Challenge with question and answer
     */
    text() {
      const words = [
        'apple', 'banana', 'cherry', 'dragon', 'elephant',
        'forest', 'guitar', 'harmony', 'island', 'jungle',
        'knight', 'lemon', 'mountain', 'nebula', 'ocean',
        'piano', 'quantum', 'rainbow', 'sunset', 'tiger',
        'umbrella', 'violet', 'whisper', 'xenon', 'yellow', 'zebra'
      ];
      
      const word = words[CryptoUtils.randomInt(0, words.length - 1)];
      const reversals = [
        { question: `Reverse this word: "${word}"`, answer: word.split('').reverse().join('') },
        { question: `What is the first letter of "${word}"?`, answer: word[0] },
        { question: `What is the last letter of "${word}"?`, answer: word[word.length - 1] },
        { question: `How many letters in "${word}"?`, answer: word.length.toString() }
      ];

      return reversals[CryptoUtils.randomInt(0, reversals.length - 1)];
    },

    /**
     * Pattern challenge: visual pattern recognition
     * @returns {Object} Challenge with question and answer
     */
    pattern() {
      const shapes = ['○', '●', '□', '■', '△', '▲', '◇', '◆'];
      const pattern = [];
      const patternLength = 4;
      
      for (let i = 0; i < patternLength; i++) {
        pattern.push(shapes[CryptoUtils.randomInt(0, shapes.length - 1)]);
      }
      
      const answer = shapes[CryptoUtils.randomInt(0, shapes.length - 1)];
      const question = `Complete the pattern: ${pattern.join(' ')} ___`;
      
      return { question, answer };
    },

    /**
     * Image puzzle challenge: select all images matching a category
     * @param {string} puzzleId - Optional specific puzzle ID
     * @returns {Object} Challenge with question, images, and correct answer indices
     */
    imagePuzzle(options = null) {
      const isServerMode = (options && typeof options === 'object');
      let rawPuzzleId = isServerMode ? options.puzzleId : (typeof options === 'string' ? options : null);
      if (rawPuzzleId && !rawPuzzleId.startsWith('select-all-')) {
          rawPuzzleId = 'select-all-' + rawPuzzleId;
      }
      
      const puzzle = rawPuzzleId ? ImagePuzzles.getPuzzle(rawPuzzleId) : ImagePuzzles.getRandomPuzzle();
      
      let shuffledImages;
      let finalCorrectIndices;

      if (isServerMode && options.correctIndices) {
        const totalImages = options.imageCount || 9;
        shuffledImages = new Array(totalImages).fill(null);
        
        const correctCount = options.correctIndices.length;
        const incorrectCount = totalImages - correctCount;

        const correctSubset = ImagePuzzles.shuffleArray([...puzzle.correctImages]).slice(0, correctCount);
        const incorrectSubset = ImagePuzzles.shuffleArray([...puzzle.incorrectImages]).slice(0, incorrectCount);

        let correctPtr = 0;
        let incorrectPtr = 0;
        
        for (let i = 0; i < totalImages; i++) {
           if (options.correctIndices.includes(i)) {
             shuffledImages[i] = { url: correctSubset[correctPtr++], correct: true };
           } else {
             shuffledImages[i] = { url: incorrectSubset[incorrectPtr++], correct: false };
           }
        }
        finalCorrectIndices = options.correctIndices;
      } else {
        const allImages = [
          ...puzzle.correctImages.map(url => ({ url, correct: true })),
          ...puzzle.incorrectImages.map(url => ({ url, correct: false }))
        ];
        
        shuffledImages = ImagePuzzles.shuffleArray(allImages);
        finalCorrectIndices = shuffledImages
          .map((img, index) => img.correct ? index : -1)
          .filter(index => index !== -1);
      }
      
      return {
        question: puzzle.question,
        images: shuffledImages.map(img => img.url),
        correctIndices: finalCorrectIndices,
        puzzleId: puzzle.id
      };
    },

    /**
     * Text-based Illusion CAPTCHA
     * Renders text onto a Canvas using globalCompositeOperation masking.
     * The answer text is never present in the DOM — only as pixel data on canvas.
     * Bots cannot scrape the answer via DOM traversal, OCR requires rendering the canvas.
     * @returns {Object} Challenge with question, canvas element, and answer
     */
    textIllusion(options = null) {
      const words = [
        'shield', 'castle', 'bridge', 'garden', 'planet',
        'rocket', 'forest', 'stream', 'temple', 'crystal',
        'dragon', 'falcon', 'harbor', 'island', 'jungle',
        'knight', 'lighthouse', 'meadow', 'nebula', 'ocean',
        'phoenix', 'quartz', 'riddle', 'summit', 'thunder',
        'umbra', 'voyage', 'willow', 'xenon', 'zenith'
      ];
      const providedWord = (options && typeof options === 'object') ? options.word : null;
      const answer = providedWord || words[CryptoUtils.randomInt(0, words.length - 1)];

      const canvas = document.createElement('canvas');
      canvas.width = 280;
      canvas.height = 80;
      const ctx = canvas.getContext('2d', { willReadFrequently: false });

      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, 280, 80);

      const noiseCount = 120;
      for (let i = 0; i < noiseCount; i++) {
        ctx.fillStyle = `rgba(${CryptoUtils.randomInt(30, 80)}, ${CryptoUtils.randomInt(30, 80)}, ${CryptoUtils.randomInt(40, 90)}, ${CryptoUtils.randomInt(30, 70) / 100})`;
        ctx.beginPath();
        ctx.arc(
          CryptoUtils.randomInt(0, 280),
          CryptoUtils.randomInt(0, 80),
          CryptoUtils.randomInt(1, 4),
          0, Math.PI * 2
        );
        ctx.fill();
      }

      for (let i = 0; i < 6; i++) {
        ctx.strokeStyle = `rgba(${CryptoUtils.randomInt(40, 100)}, ${CryptoUtils.randomInt(40, 100)}, ${CryptoUtils.randomInt(50, 120)}, ${CryptoUtils.randomInt(20, 50) / 100})`;
        ctx.lineWidth = CryptoUtils.randomInt(1, 3);
        ctx.beginPath();
        ctx.moveTo(CryptoUtils.randomInt(0, 280), CryptoUtils.randomInt(0, 80));
        ctx.bezierCurveTo(
          CryptoUtils.randomInt(0, 280), CryptoUtils.randomInt(0, 80),
          CryptoUtils.randomInt(0, 280), CryptoUtils.randomInt(0, 80),
          CryptoUtils.randomInt(0, 280), CryptoUtils.randomInt(0, 80)
        );
        ctx.stroke();
      }

      ctx.font = `bold ${CryptoUtils.randomInt(28, 36)}px "Courier New", monospace`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      ctx.fillStyle = `rgba(${CryptoUtils.randomInt(180, 255)}, ${CryptoUtils.randomInt(180, 255)}, ${CryptoUtils.randomInt(180, 255)}, ${CryptoUtils.randomInt(85, 98) / 100})`;
      const xOffset = CryptoUtils.randomInt(-5, 5);
      const yOffset = CryptoUtils.randomInt(-3, 3);
      ctx.fillText(answer.toUpperCase(), 140 + xOffset, 40 + yOffset);

      ctx.globalCompositeOperation = 'source-atop';
      for (let i = 0; i < 40; i++) {
        ctx.strokeStyle = `rgba(${CryptoUtils.randomInt(20, 70)}, ${CryptoUtils.randomInt(20, 70)}, ${CryptoUtils.randomInt(30, 80)}, ${CryptoUtils.randomInt(15, 40) / 100})`;
        ctx.lineWidth = CryptoUtils.randomInt(1, 2);
        const ly = CryptoUtils.randomInt(0, 80);
        ctx.beginPath();
        ctx.moveTo(0, ly);
        ctx.lineTo(280, ly + CryptoUtils.randomInt(-3, 3));
        ctx.stroke();
      }
      ctx.globalCompositeOperation = 'source-over';

      for (let i = 0; i < 30; i++) {
        ctx.fillStyle = `rgba(${CryptoUtils.randomInt(100, 200)}, ${CryptoUtils.randomInt(100, 200)}, ${CryptoUtils.randomInt(120, 220)}, ${CryptoUtils.randomInt(10, 30) / 100})`;
        ctx.fillRect(
          CryptoUtils.randomInt(0, 275),
          CryptoUtils.randomInt(0, 75),
          CryptoUtils.randomInt(2, 8),
          CryptoUtils.randomInt(1, 3)
        );
      }

      canvas.className = 'vg-illusion-canvas';
      canvas.style.cssText = 'border-radius:8px;border:1px solid rgba(255,255,255,0.12);width:100%;max-width:280px;display:block;';

      return {
        question: 'Type the hidden word you see in the image',
        answer: answer,
        canvas: canvas
      };
    },

    /**
     * Audio CAPTCHA — Web Audio API synthesizer
     * Generates noise-masked DTMF-like tones entirely client-side.
     * No audio files, no external requests, no PII transmitted.
     * Renders audio samples directly into a Float32Array, then plays
     * via AudioBuffer — avoids OfflineAudioContext compatibility issues.
     * @returns {Object} Challenge with question, sample rate, and answer
     */
    audio(options = null) {
      const providedWord = (options && typeof options === 'object') ? options.word : null;
      let answer;
      if (providedWord) {
        answer = providedWord;
      } else {
        const digitCount = 4;
        const digits = [];
        for (let i = 0; i < digitCount; i++) {
          digits.push(CryptoUtils.randomInt(0, 9).toString());
        }
        answer = digits.join('');
      }

      const digitCount = answer.length;
      const sampleRate = 22050;
      const digitDuration = 0.45;
      const gapDuration = 0.25;
      const noiseLevel = 0.18;
      const totalDuration = digitCount * digitDuration + (digitCount - 1) * gapDuration;
      const totalSamples = Math.ceil(sampleRate * totalDuration);
      const samples = new Float32Array(totalSamples);

      const digitFrequencies = {
        '0': [941, 1336], '1': [697, 1209], '2': [697, 1336], '3': [697, 1477],
        '4': [770, 1209], '5': [770, 1336], '6': [770, 1477], '7': [852, 1209],
        '8': [852, 1336], '9': [852, 1477]
      };

      for (let i = 0; i < totalSamples; i++) {
        samples[i] = (Math.random() * 2 - 1) * noiseLevel;
      }

      for (let d = 0; d < digitCount; d++) {
        const freqs = digitFrequencies[digits[d]];
        const startSample = Math.floor((d * (digitDuration + gapDuration)) * sampleRate);
        const endSample = startSample + Math.floor(digitDuration * sampleRate);
        const rampSamples = Math.floor(0.02 * sampleRate);

        for (let i = startSample; i < endSample && i < totalSamples; i++) {
          const t = (i - startSample) / sampleRate;
          let envelope = 0.35;
          const sampleIndex = i - startSample;
          const digitSamples = endSample - startSample;

          if (sampleIndex < rampSamples) {
            envelope *= sampleIndex / rampSamples;
          } else if (sampleIndex > digitSamples - rampSamples) {
            envelope *= (digitSamples - sampleIndex) / rampSamples;
          }

          let sample = 0;
          for (let f = 0; f < freqs.length; f++) {
            sample += Math.sin(2 * Math.PI * freqs[f] * t);
          }
          sample *= envelope / freqs.length;
          samples[i] += sample;
        }
      }

      for (let i = 0; i < totalSamples; i++) {
        samples[i] = Math.max(-1, Math.min(1, samples[i]));
      }

      return {
        question: `Type the ${digitCount} digits you hear`,
        answer: answer,
        audioSamples: samples,
        audioSampleRate: sampleRate
      };
    },

    /**
     * Visual Path-based CAPTCHA — "Trace the line"
     * Renders a curved path on canvas. User must trace along it.
     * Records pointer coordinates, timing, and velocity for human-jitter analysis.
     * Bot-nets struggle to mimic natural human hand tremor and acceleration curves.
     * @returns {Object} Challenge with question, canvas, path data, and tolerance config
     */
    visualPath() {
      const canvasWidth = 300;
      const canvasHeight = 200;

      const pathTypes = ['wave', 'spiral', 'zigzag', 'arc'];
      const pathType = pathTypes[CryptoUtils.randomInt(0, pathTypes.length - 1)];

      const pathPoints = [];
      const pointCount = 60;

      switch (pathType) {
        case 'wave': {
          const amplitude = CryptoUtils.randomInt(30, 60);
          const centerY = canvasHeight / 2;
          const frequency = CryptoUtils.randomInt(2, 4) * Math.PI;
          const phase = CryptoUtils.randomInt(0, 100) / 100 * Math.PI;
          for (let i = 0; i < pointCount; i++) {
            const t = i / (pointCount - 1);
            const x = 30 + t * (canvasWidth - 60);
            const y = centerY + amplitude * Math.sin(frequency * t + phase);
            pathPoints.push({ x, y });
          }
          break;
        }
        case 'spiral': {
          const cx = canvasWidth / 2 + CryptoUtils.randomInt(-20, 20);
          const cy = canvasHeight / 2 + CryptoUtils.randomInt(-15, 15);
          const maxRadius = Math.min(canvasWidth, canvasHeight) / 2 - 30;
          const rotations = CryptoUtils.randomInt(2, 3);
          for (let i = 0; i < pointCount; i++) {
            const t = i / (pointCount - 1);
            const angle = rotations * Math.PI * 2 * t;
            const radius = maxRadius * (1 - t * 0.7);
            pathPoints.push({
              x: cx + radius * Math.cos(angle),
              y: cy + radius * Math.sin(angle)
            });
          }
          break;
        }
        case 'zigzag': {
          const segments = CryptoUtils.randomInt(3, 5);
          const segWidth = (canvasWidth - 60) / segments;
          const amplitude = CryptoUtils.randomInt(25, 50);
          for (let i = 0; i < pointCount; i++) {
            const t = i / (pointCount - 1);
            const x = 30 + t * (canvasWidth - 60);
            const segIndex = t * segments;
            const segT = segIndex - Math.floor(segIndex);
            const direction = Math.floor(segIndex) % 2 === 0 ? 1 : -1;
            const y = canvasHeight / 2 + direction * amplitude * (1 - Math.abs(segT * 2 - 1));
            pathPoints.push({ x, y: y + CryptoUtils.randomInt(-5, 5) });
          }
          break;
        }
        case 'arc': {
          const startAngle = CryptoUtils.randomInt(0, 90) * Math.PI / 180;
          const sweepAngle = CryptoUtils.randomInt(120, 270) * Math.PI / 180;
          const radius = Math.min(canvasWidth, canvasHeight) / 2 - 20;
          const cx = canvasWidth / 2;
          const cy = canvasHeight / 2 + 20;
          for (let i = 0; i < pointCount; i++) {
            const t = i / (pointCount - 1);
            const angle = startAngle + sweepAngle * t;
            pathPoints.push({
              x: cx + radius * Math.cos(angle),
              y: cy - radius * Math.sin(angle)
            });
          }
          break;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = canvasWidth;
      canvas.height = canvasHeight;
      canvas.className = 'vg-path-canvas';
      canvas.style.cssText = 'border-radius:8px;border:1px solid rgba(255,255,255,0.12);width:100%;max-width:300px;display:block;cursor:crosshair;touch-action:none;';

      const ctx = canvas.getContext('2d', { willReadFrequently: false });

      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, canvasWidth, canvasHeight);

      for (let i = 0; i < 80; i++) {
        ctx.fillStyle = `rgba(${CryptoUtils.randomInt(20, 60)}, ${CryptoUtils.randomInt(20, 60)}, ${CryptoUtils.randomInt(30, 70)}, ${CryptoUtils.randomInt(10, 30) / 100})`;
        ctx.beginPath();
        ctx.arc(
          CryptoUtils.randomInt(0, canvasWidth),
          CryptoUtils.randomInt(0, canvasHeight),
          CryptoUtils.randomInt(0.5, 2.5),
          0, Math.PI * 2
        );
        ctx.fill();
      }

      ctx.strokeStyle = '#00d4aa';
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.shadowColor = 'rgba(0, 212, 170, 0.4)';
      ctx.shadowBlur = 6;
      ctx.beginPath();
      ctx.moveTo(pathPoints[0].x, pathPoints[0].y);
      for (let i = 1; i < pathPoints.length; i++) {
        const prev = pathPoints[i - 1];
        const curr = pathPoints[i];
        const cpx = (prev.x + curr.x) / 2;
        const cpy = (prev.y + curr.y) / 2;
        ctx.quadraticCurveTo(prev.x, prev.y, cpx, cpy);
      }
      ctx.stroke();
      ctx.shadowBlur = 0;

      ctx.fillStyle = '#00d4aa';
      ctx.beginPath();
      ctx.arc(pathPoints[0].x, pathPoints[0].y, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 10px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('S', pathPoints[0].x, pathPoints[0].y);

      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      ctx.arc(pathPoints[pathPoints.length - 1].x, pathPoints[pathPoints.length - 1].y, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#0f172a';
      ctx.fillText('E', pathPoints[pathPoints.length - 1].x, pathPoints[pathPoints.length - 1].y);

      const tolerance = 25;
      const minTracePoints = 20;

      return {
        question: 'Trace the line from Start (S) to End (E) with your mouse or finger',
        answer: 'path',
        canvas: canvas,
        pathPoints: pathPoints,
        tolerance: tolerance,
        minTracePoints: minTracePoints,
        pathType: pathType
      };
    }
  };

  // ═══════════════════════════════════════════════════════════════════════════════
  // VAULTGUARD CAPTCHA CLASS
  // ═══════════════════════════════════════════════════════════════════════════════

  /**
   * VaultGuard CAPTCHA - Main verification class
   * 
   * @class VaultGuardCaptcha
   * @example
   * const vg = new VaultGuardCaptcha();
   * const challenge = await vg.generateChallenge();
   * const result = await vg.verifyAnswer(challenge.id, "42");
   */
  class VaultGuardCaptcha {
    /**
     * Create a new VaultGuard CAPTCHA instance
     * @param {Object} options - Configuration options
     * @param {string} options.difficulty - Difficulty level ('easy', 'medium', 'hard')
     * @param {number} options.expiryTime - Challenge expiry time in milliseconds (default: 300000)
     * @param {number} options.maxAttempts - Maximum verification attempts (default: 3)
     * @param {string[]} options.challengeTypes - Available challenge types (default: ['math', 'text', 'pattern'])
     */
    constructor(options = {}) {
      this.options = {
        difficulty: options.difficulty || 'medium',
        expiryTime: options.expiryTime || 300000,
        maxAttempts: options.maxAttempts || 3,
        challengeTypes: options.challengeTypes || ['math', 'text', 'pattern', 'imagePuzzle', 'textIllusion', 'audio', 'visualPath'],
        serverUrl: options.serverUrl || null,
        csrfToken: options.csrfToken || null,
        ...options
      };

      this.challenges = new Map();
      this.attempts = new Map();

      this._serverMode = !!this.options.serverUrl;
      this._serverToken = null;
      this._demoMode = this.options.demoMode || false;
      this._networkLog = [];

      if (this._demoMode) {
        console.info(`${VAULTGUARD.name}: Demo/debug mode enabled. Network inspection active.`);
      }

      if (this._serverMode) {
        console.info(`${VAULTGUARD.name}: Server mode enabled. Challenges are generated and verified server-side.`);
      } else {
        console.warn(`${VAULTGUARD.name}: Running in client-side mode. For production use, configure a serverUrl for secure challenge generation. See: ${VAULTGUARD.baseUrl}/README.html`);
      }

      // Security configuration
      this._securityConfig = {
        enableBotDetection: options.enableBotDetection !== false,
        enableCSRF: options.enableCSRF !== false,
        enableFingerprintBinding: false,
        enableHoneypot: options.enableHoneypot !== false,
        botScoreThreshold: options.botScoreThreshold || 0.5
      };

      // Hooks system
      this._hooks = options.hooks || null;

      // Cleanup expired challenges periodically
      if (!this._serverMode) {
        setInterval(() => this.cleanup(), 60000);
      }
    }

    setHooks(hooks) {
      this._hooks = hooks;
      return this;
    }

    getHooks() {
      return this._hooks;
    }

    async _emitHook(event, data = {}) {
      if (this._hooks && typeof this._hooks.emit === 'function') {
        try {
          await this._hooks.emit(event, data);
        } catch (e) {
          // Hooks must never break the CAPTCHA flow
        }
      }
    }

    /**
     * Generate a new verification challenge
     * @returns {Promise<Object>} Challenge object with id, question, type, and expiresIn
     */
    async generateChallenge() {
      if (this._serverMode) {
        return this._generateServerChallenge();
      }
      return this._generateClientChallenge();
    }

    async _generateServerChallenge() {
      try {
        const headers = { 'Content-Type': 'application/json' };
        if (this.options.csrfToken) {
          headers['X-VG-CSRF'] = this.options.csrfToken;
        }
        if (this._serverToken) {
          headers['X-VG-Session'] = this._serverToken;
        }

        const challengeReqBody = { clientToken: this._serverToken };
        const response = await fetch(`${this.options.serverUrl}/challenge`, {
          method: 'POST',
          headers,
          credentials: 'same-origin',
          body: JSON.stringify(challengeReqBody)
        });

        if (!response.ok) {
          throw new Error(`Server returned ${response.status}`);
        }

        const serverChallenge = await response.json();

        if (this._demoMode) {
          this._networkLog.push({
            timestamp: Date.now(),
            direction: 'inbound',
            endpoint: '/challenge',
            request: challengeReqBody,
            response: serverChallenge,
            status: response.status
          });
          this._renderNetworkPanel();
        }

        const challengeData = {
          id: serverChallenge.id,
          question: serverChallenge.question,
          type: serverChallenge.type,
          createdAt: Date.now(),
          expiryTime: serverChallenge.expiresIn || this.options.expiryTime,
          maxAttempts: this.options.maxAttempts,
          attempts: 0,
          solved: false,
          serverId: serverChallenge.id,
          puzzleId: serverChallenge.puzzleId || null,
          imageCount: serverChallenge.imageCount || null,
          powChallenge: serverChallenge.pow || null,
          powSolution: null,
          _serverMode: true,
          expiresIn: serverChallenge.expiresIn,
          images: serverChallenge.images || null,
          canvas: serverChallenge.canvas || null,
          audioSamples: serverChallenge.audioSamples || null,
          audioSampleRate: serverChallenge.audioSampleRate || null,
          pathPoints: serverChallenge.pathPoints || null,
          tolerance: serverChallenge.tolerance || null,
          minTracePoints: serverChallenge.minTracePoints || null,
          pathType: serverChallenge.pathType || null,
          word: serverChallenge.word || null,
          digitCount: serverChallenge.digitCount || null,
          correctIndices: serverChallenge.correctIndices || null
        };

        this.challenges.set(serverChallenge.id, challengeData);

        if (['textIllusion', 'audio', 'visualPath', 'imagePuzzle'].includes(serverChallenge.type)) {
          const generator = ChallengeGenerators[serverChallenge.type];
          const localRender = generator(challengeData);
          if (localRender.canvas) challengeData.canvas = localRender.canvas;
          if (localRender.audioSamples) challengeData.audioSamples = localRender.audioSamples;
          if (localRender.audioSampleRate) challengeData.audioSampleRate = localRender.audioSampleRate;
          if (localRender.pathPoints) challengeData.pathPoints = localRender.pathPoints;
          if (localRender.images) challengeData.images = localRender.images;
        }

        this._emitHook('onChallengeGenerated', {
          challengeId: serverChallenge.id,
          type: serverChallenge.type,
          question: serverChallenge.question,
          expiresIn: serverChallenge.expiresIn,
          serverMode: true
        });

        return challengeData;
      } catch (error) {
        console.error(`${VAULTGUARD.name}: Server challenge fetch failed, falling back to client mode:`, error);
        if (this._demoMode) {
          this._networkLog.push({
            timestamp: Date.now(),
            direction: 'error',
            endpoint: '/challenge',
            request: challengeReqBody,
            response: { error: error.message },
            status: 0
          });
          this._renderNetworkPanel();
        }
        return this._generateClientChallenge();
      }
    }

    _renderNetworkPanel() {
      if (!this._demoMode) return;

      let panel = document.getElementById('vg-network-panel');
      if (!panel) {
        panel = document.createElement('div');
        panel.id = 'vg-network-panel';
        panel.setAttribute('role', 'region');
        panel.setAttribute('aria-label', 'VaultGuard Network Inspector');
        document.body.appendChild(panel);
      }

      const log = this._networkLog;
      const formatTime = (ts) => new Date(ts).toLocaleTimeString();
      const escapeHtml = (str) => {
        if (str === null || str === undefined) return 'null';
        return String(str)
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;');
      };
      const formatJson = (obj) => {
        try {
          return escapeHtml(JSON.stringify(obj, null, 2));
        } catch (e) {
          return escapeHtml(String(obj));
        }
      };

      const directionIcon = (dir) => {
        switch (dir) {
          case 'inbound': return '⬇';
          case 'outbound': return '⬆';
          case 'error': return '⚠';
          default: return '•';
        }
      };

      const directionColor = (dir) => {
        switch (dir) {
          case 'inbound': return '#00d4aa';
          case 'outbound': return '#60a5fa';
          case 'error': return '#ef4444';
          default: return '#94a3b8';
        }
      };

      const statusColor = (status) => {
        if (status >= 200 && status < 300) return '#00d4aa';
        if (status >= 400 && status < 500) return '#f59e0b';
        if (status >= 500) return '#ef4444';
        return '#94a3b8';
      };

      let entriesHtml = '';
      for (let i = log.length - 1; i >= 0; i--) {
        const entry = log[i];
        const dirColor = directionColor(entry.direction);
        const statColor = statusColor(entry.status);
        entriesHtml += `
          <div class="vg-net-entry" style="border-left: 3px solid ${dirColor}; padding: 8px 12px; margin-bottom: 8px; background: #1e293b; border-radius: 0 6px 6px 0;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
              <span style="color: ${dirColor}; font-weight: 600; font-size: 12px;">
                ${directionIcon(entry.direction)} ${escapeHtml(entry.endpoint)}
              </span>
              <span style="color: #64748b; font-size: 11px;">${formatTime(entry.timestamp)}</span>
            </div>
            <div style="color: ${statColor}; font-size: 11px; margin-bottom: 4px;">
              Status: ${entry.status || 'N/A'} | Direction: ${escapeHtml(entry.direction)}
            </div>
            <details style="font-size: 11px;">
              <summary style="color: #94a3b8; cursor: pointer; user-select: none;">Request Payload</summary>
              <pre style="background: #0f172a; padding: 8px; border-radius: 4px; overflow-x: auto; color: #e2e8f0; margin: 4px 0 0 0; white-space: pre-wrap; word-break: break-all;">${formatJson(entry.request)}</pre>
            </details>
            <details style="font-size: 11px; margin-top: 4px;">
              <summary style="color: #94a3b8; cursor: pointer; user-select: none;">Response Payload</summary>
              <pre style="background: #0f172a; padding: 8px; border-radius: 4px; overflow-x: auto; color: #e2e8f0; margin: 4px 0 0 0; white-space: pre-wrap; word-break: break-all;">${formatJson(entry.response)}</pre>
            </details>
          </div>`;
      }

      panel.innerHTML = `
        <div class="vg-net-header" style="background: linear-gradient(135deg, #1e3a5f 0%, #0f172a 100%); color: white; padding: 12px 16px; display: flex; justify-content: space-between; align-items: center; position: sticky; top: 0; z-index: 10;">
          <span style="font-weight: 700; font-size: 14px;">🛡️ VaultGuard Network Inspector</span>
          <div style="display: flex; gap: 8px; align-items: center;">
            <span style="background: rgba(0,212,170,0.2); color: #00d4aa; padding: 2px 8px; border-radius: 10px; font-size: 11px; font-weight: 600;">${log.length} requests</span>
            <button id="vg-net-clear" style="background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2); color: white; padding: 4px 10px; border-radius: 4px; cursor: pointer; font-size: 11px;">Clear</button>
            <button id="vg-net-close" style="background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2); color: white; padding: 4px 10px; border-radius: 4px; cursor: pointer; font-size: 11px;">✕</button>
          </div>
        </div>
        <div class="vg-net-body" style="padding: 12px; max-height: 60vh; overflow-y: auto; font-family: 'JetBrains Mono', 'Fira Code', monospace;">
          ${entriesHtml || '<div style="color: #64748b; text-align: center; padding: 24px; font-size: 13px;">No network activity yet. Generate a challenge to see traffic.</div>'}
        </div>`;

      panel.style.cssText = `
        position: fixed; bottom: 0; right: 0; width: 480px; max-width: 95vw;
        background: #0f172a; border: 1px solid #334155; border-bottom: none; border-right: none;
        border-radius: 12px 0 0 0; z-index: 99999; box-shadow: -4px 0 30px rgba(0,0,0,0.4);
        font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
      `;

      const closeBtn = document.getElementById('vg-net-close');
      if (closeBtn) {
        closeBtn.addEventListener('click', () => {
          panel.style.display = 'none';
        });
      }

      const clearBtn = document.getElementById('vg-net-clear');
      if (clearBtn) {
        clearBtn.addEventListener('click', () => {
          this._networkLog = [];
          this._renderNetworkPanel();
        });
      }
    }

    async _generateClientChallenge() {
      const challengeType = this.options.challengeTypes[
        CryptoUtils.randomInt(0, this.options.challengeTypes.length - 1)
      ];

      const generator = ChallengeGenerators[challengeType];
      const challenge = challengeType === 'imagePuzzle' ? generator() : generator();

      const challengeId = CryptoUtils.generateToken(16);
      const secret = CryptoUtils.generateToken(8);

      let answerToHash;
      if (challengeType === 'imagePuzzle') {
        answerToHash = challenge.correctIndices.join(',');
      } else if (challengeType === 'visualPath') {
        answerToHash = JSON.stringify({
          pathPoints: challenge.pathPoints,
          tolerance: challenge.tolerance,
          minTracePoints: challenge.minTracePoints
        });
      } else {
        answerToHash = challenge.answer.toLowerCase();
      }

      const challengeData = {
        id: challengeId,
        question: challenge.question,
        type: challengeType,
        createdAt: Date.now(),
        expiryTime: this.options.expiryTime,
        maxAttempts: this.options.maxAttempts,
        secret: secret,
        answerHash: await CryptoUtils.hash(answerToHash + secret),
        attempts: 0,
        solved: false,
        images: challenge.images || null,
        correctIndices: challenge.correctIndices || null,
        puzzleId: challenge.puzzleId || null,
        pathPoints: challenge.pathPoints || null,
        tolerance: challenge.tolerance || null,
        minTracePoints: challenge.minTracePoints || null,
        canvas: challenge.canvas || null,
        audioSamples: challenge.audioSamples || null,
        audioSampleRate: challenge.audioSampleRate || null,
        powChallenge: this._generateClientPoW(),
        powSolution: null,
        _serverMode: false
      };

      Object.freeze(challengeData.pathPoints);
      this.challenges.set(challengeId, challengeData);
      this.attempts.set(challengeId, 0);

      const result = {
        id: challengeId,
        question: challenge.question,
        type: challengeType,
        expiresIn: this.options.expiryTime,
        images: challenge.images || null,
        canvas: challenge.canvas || null,
        audioSamples: challenge.audioSamples || null,
        audioSampleRate: challenge.audioSampleRate || null,
        pathPoints: challenge.pathPoints || null,
        tolerance: challenge.tolerance || null,
        minTracePoints: challenge.minTracePoints || null,
        pathType: challenge.pathType || null
      };

      this._emitHook('onChallengeGenerated', {
        challengeId,
        type: challengeType,
        question: challenge.question,
        expiresIn: this.options.expiryTime,
        serverMode: false
      });

      return result;
    }

    /**
     * Verify user's answer to a challenge
     * @param {string} challengeId - The challenge ID
     * @param {string} userAnswer - User's answer
     * @returns {Promise<Object>} Verification result
     */
    async verifyAnswer(challengeId, userAnswer, formElement = null) {
      const challenge = this.challenges.get(challengeId);

      if (!challenge) {
        return {
          success: false,
          error: 'Challenge not found or expired',
          brand: VAULTGUARD.name
        };
      }

      if (challenge._serverMode && this._serverMode) {
        return this._verifyServerAnswer(challenge, userAnswer, formElement);
      }
      return this._verifyClientAnswer(challenge, userAnswer, formElement);
    }

    async _verifyServerAnswer(challenge, userAnswer, formElement) {
      const clientSecurity = this._runClientSecurityChecks(challenge, formElement);
      if (clientSecurity) return clientSecurity;

      const behavioralData = this._securityConfig.enableBotDetection && typeof SecurityModule !== 'undefined'
        ? SecurityModule.analyzeBehavior()
        : null;

      const powSolution = challenge.powSolution || null;

      const trustPayload = {
        ...(behavioralData ? {
          mouseMovements: behavioralData.mouseMovements || [],
          keyPresses: behavioralData.keyPresses || [],
          timeOnPage: behavioralData.timeOnPage || 0,
          interactionCount: behavioralData.interactionCount || 0,
          linearity: this._calculateLinearity(behavioralData.mouseMovements || [])
        } : {}),
        ...(powSolution ? {
          pow: {
            nonce: powSolution.nonce,
            elapsedMs: powSolution.elapsedMs,
            hashRate: powSolution.hashRate
          }
        } : {})
      };

      try {
        const headers = { 'Content-Type': 'application/json' };
        if (this.options.csrfToken) {
          headers['X-VG-CSRF'] = this.options.csrfToken;
        }
        if (this._serverToken) {
          headers['X-VG-Session'] = this._serverToken;
        }

        const verifyReqBody = {
          challengeId: challenge.serverId || challenge.id,
          answer: userAnswer,
          behavioral: trustPayload
        };

        const response = await fetch(`${this.options.serverUrl}/verify`, {
          method: 'POST',
          headers,
          credentials: 'same-origin',
          body: JSON.stringify(verifyReqBody)
        });

        if (!response.ok) {
          throw new Error(`Server returned ${response.status}`);
        }

        const result = await response.json();

        if (this._demoMode) {
          this._networkLog.push({
            timestamp: Date.now(),
            direction: 'outbound',
            endpoint: '/verify',
            request: verifyReqBody,
            response: result,
            status: response.status
          });
          this._renderNetworkPanel();
        }

        if (result.verified) {
          challenge.solved = true;
          this._emitHook('onClientVerified', { challengeId: challenge.id, type: challenge.type });
          this._emitHook('onServerVerified', { challengeId: challenge.id, trustScore: result.trustScore });
          this._emitHook('onSuccess', { challengeId: challenge.id, type: challenge.type, serverVerified: true, trustScore: result.trustScore });
          return {
            success: true,
            verified: true,
            token: result.token || result.challengeId || challenge.id,
            trustScore: result.trustScore || null,
            brand: VAULTGUARD.name
          };
        } else {
          this.attempts.set(challenge.id, (this.attempts.get(challenge.id) || 0) + 1);
          this._emitHook('onError', { challengeId: challenge.id, error: result.error, remainingAttempts: result.remainingAttempts });
          return {
            success: false,
            error: result.error || 'Verification failed',
            remainingAttempts: result.remainingAttempts ?? null,
            brand: VAULTGUARD.name
          };
        }
      } catch (error) {
        console.error(`${VAULTGUARD.name}: Server verification failed:`, error);
        if (this._demoMode) {
          this._networkLog.push({
            timestamp: Date.now(),
            direction: 'error',
            endpoint: '/verify',
            request: { challengeId: challenge.serverId || challenge.id },
            response: { error: error.message },
            status: 0
          });
          this._renderNetworkPanel();
        }
        return this._verifyClientAnswer(challenge, userAnswer, formElement);
      }
    }

    async _verifyClientAnswer(challenge, userAnswer, formElement) {
      if (Date.now() - challenge.createdAt > challenge.expiryTime) {
        this.challenges.delete(challenge.id);
        this.attempts.delete(challenge.id);
        this._emitHook('onChallengeExpired', { challengeId: challenge.id });
        return {
          success: false,
          error: 'Challenge expired',
          brand: VAULTGUARD.name
        };
      }

      if (challenge.solved) {
        return {
          success: true,
          verified: true,
          brand: VAULTGUARD.name
        };
      }

      const clientSecurity = this._runClientSecurityChecks(challenge, formElement);
      if (clientSecurity) return clientSecurity;

      const currentAttempts = this.attempts.get(challenge.id) || 0;
      if (currentAttempts >= challenge.maxAttempts) {
        this.challenges.delete(challenge.id);
        this.attempts.delete(challenge.id);
        this._emitHook('onMaxAttemptsExceeded', { challengeId: challenge.id, maxAttempts: challenge.maxAttempts });
        this._emitHook('onError', { challengeId: challenge.id, error: 'Maximum attempts exceeded' });
        return {
          success: false,
          error: 'Maximum attempts exceeded',
          brand: VAULTGUARD.name
        };
      }

      this.attempts.set(challenge.id, currentAttempts + 1);

      if (challenge.powChallenge && !challenge.powChallenge._clientGenerated) {
        const powSolution = challenge.powSolution;
        if (!powSolution) {
          return {
            success: false,
            error: 'Proof-of-Work solution required',
            brand: VAULTGUARD.name
          };
        }
        const powValid = await this._verifyClientPoW(challenge, powSolution);
        if (!powValid) {
          return {
            success: false,
            error: 'Proof-of-Work verification failed',
            brand: VAULTGUARD.name
          };
        }
      }

      let isValid = false;

      if (challenge.type === 'visualPath') {
        isValid = this._verifyPathChallenge(challenge, userAnswer);
      } else {
        const normalizedAnswer = challenge.type === 'imagePuzzle'
          ? userAnswer
          : userAnswer.toLowerCase();
        const answerHash = await CryptoUtils.hash(normalizedAnswer + challenge.secret);
        isValid = answerHash === challenge.answerHash;
      }

      if (isValid) {
        challenge.solved = true;
        this._emitHook('onClientVerified', { challengeId: challenge.id, type: challenge.type });
        this._emitHook('onSuccess', { challengeId: challenge.id, type: challenge.type, serverVerified: false });
        return {
          success: true,
          verified: true,
          brand: VAULTGUARD.name
        };
      } else {
        const remainingAttempts = challenge.maxAttempts - (currentAttempts + 1);
        const errorMsg = challenge.type === 'visualPath'
          ? 'Trace did not follow the path. Please try again.'
          : 'Incorrect answer';
        this._emitHook('onError', { challengeId: challenge.id, error: errorMsg, remainingAttempts });
        return {
          success: false,
          error: errorMsg,
          remainingAttempts: Math.max(0, remainingAttempts),
          brand: VAULTGUARD.name
        };
      }
    }

    _runClientSecurityChecks(challenge, formElement) {
      if (this._securityConfig.enableHoneypot && formElement && typeof SecurityModule !== 'undefined') {
        if (SecurityModule.checkHoneypot(formElement)) {
          this.challenges.delete(challenge.id);
          this.attempts.delete(challenge.id);
          this._emitHook('onHoneypotTriggered', { challengeId: challenge.id, securityFlag: 'honeypot_triggered' });
          this._emitHook('onSecurityFlag', { challengeId: challenge.id, flag: 'honeypot_triggered' });
          return {
            success: false,
            error: 'Automated submission detected',
            securityFlag: 'honeypot_triggered',
            brand: VAULTGUARD.name
          };
        }
      }

      if (this._securityConfig.enableCSRF && formElement && typeof SecurityModule !== 'undefined') {
        const csrfInput = formElement.querySelector('[name="vg_csrf_token"]');
        if (csrfInput) {
          const isValidCSRF = SecurityModule.validateCSRFToken(csrfInput.value);
          if (!isValidCSRF) {
            this._emitHook('onCSRFInvalid', { challengeId: challenge.id, securityFlag: 'csrf_failed' });
            this._emitHook('onSecurityFlag', { challengeId: challenge.id, flag: 'csrf_failed' });
            return {
              success: false,
              error: 'Security token invalid. Please reload the page.',
              securityFlag: 'csrf_failed',
              brand: VAULTGUARD.name
            };
          }
        }
      }

      if (this._securityConfig.enableBotDetection && typeof SecurityModule !== 'undefined') {
        const behavior = SecurityModule.analyzeBehavior();
        if (behavior.isBot && behavior.score >= this._securityConfig.botScoreThreshold) {
          this.challenges.delete(challenge.id);
          this.attempts.delete(challenge.id);
          this._emitHook('onBotDetected', { challengeId: challenge.id, score: behavior.score, signals: behavior.signals });
          this._emitHook('onSecurityFlag', { challengeId: challenge.id, flag: 'bot_detected', score: behavior.score });
          return {
            success: false,
            error: 'Automated behavior detected. Please try again.',
            securityFlag: 'bot_detected',
            brand: VAULTGUARD.name
          };
        }
      }

      return null;
    }

    _calculateLinearity(mouseMovements) {
      if (mouseMovements.length < 3) return 0;
      let directionChanges = 0;
      let totalSegments = 0;
      for (let i = 2; i < mouseMovements.length; i++) {
        const dx1 = mouseMovements[i - 1].x - mouseMovements[i - 2].x;
        const dy1 = mouseMovements[i - 1].y - mouseMovements[i - 2].y;
        const dx2 = mouseMovements[i].x - mouseMovements[i - 1].x;
        const dy2 = mouseMovements[i].y - mouseMovements[i - 1].y;
        const cross = dx1 * dy2 - dy1 * dx2;
        if (Math.abs(cross) > 10) directionChanges++;
        totalSegments++;
      }
      return totalSegments > 0 ? 1 - (directionChanges / totalSegments) : 1;
    }

    _verifyPathChallenge(challenge, traceData) {
      try {
        const data = typeof traceData === 'string' ? JSON.parse(traceData) : traceData;
        const { points, startTime, endTime } = data;

        if (!points || !Array.isArray(points) || points.length < (challenge.minTracePoints || 20)) {
          return false;
        }

        const pathPoints = challenge.pathPoints;
        if (!pathPoints || pathPoints.length === 0) {
          return false;
        }

        const tolerance = challenge.tolerance || 25;
        let matchedSegments = 0;
        const totalSegments = pathPoints.length - 1;

        for (let i = 0; i < points.length; i++) {
          const px = points[i].x;
          const py = points[i].y;

          for (let j = 0; j < pathPoints.length - 1; j++) {
            const ax = pathPoints[j].x;
            const ay = pathPoints[j].y;
            const bx = pathPoints[j + 1].x;
            const by = pathPoints[j + 1].y;

            const dx = bx - ax;
            const dy = by - ay;
            const lenSq = dx * dx + dy * dy;
            if (lenSq === 0) continue;

            let t = ((px - ax) * dx + (py - ay) * dy) / lenSq;
            t = Math.max(0, Math.min(1, t));

            const closestX = ax + t * dx;
            const closestY = ay + t * dy;
            const dist = Math.sqrt((px - closestX) ** 2 + (py - closestY) ** 2);

            if (dist <= tolerance) {
              matchedSegments = Math.max(matchedSegments, j + 1);
              break;
            }
          }
        }

        const pathCoverage = matchedSegments / totalSegments;
        if (pathCoverage < 0.75) return false;

        if (points.length >= 3) {
          const velocities = [];
          for (let i = 1; i < points.length; i++) {
            const dx = points[i].x - points[i - 1].x;
            const dy = points[i].y - points[i - 1].y;
            const dt = (points[i].t || i) - (points[i - 1].t || (i - 1));
            if (dt > 0) {
              velocities.push(Math.sqrt(dx * dx + dy * dy) / dt);
            }
          }

          if (velocities.length > 2) {
            const mean = velocities.reduce((a, b) => a + b, 0) / velocities.length;
            const variance = velocities.reduce((a, b) => a + (b - mean) ** 2, 0) / velocities.length;
            const cv = Math.sqrt(variance) / mean;

            if (cv < 0.05) return false;
          }

          let directionChanges = 0;
          for (let i = 2; i < points.length; i++) {
            const dx1 = points[i - 1].x - points[i - 2].x;
            const dy1 = points[i - 1].y - points[i - 2].y;
            const dx2 = points[i].x - points[i - 1].x;
            const dy2 = points[i].y - points[i - 1].y;
            const cross = dx1 * dy2 - dy1 * dx2;
            if (Math.abs(cross) > 0.5) directionChanges++;
          }
          const changeRate = directionChanges / points.length;
          if (changeRate < 0.02) return false;
        }

        const duration = endTime - startTime;
        const minDuration = points.length * 15;
        if (duration < minDuration) return false;

        return true;

      } catch (e) {
        return false;
      }
    }

    _generateClientPoW() {
      const difficulty = 2;
      const challenge = CryptoUtils.generateToken(16);
      return { challenge, difficulty, _clientGenerated: true };
    }

    async _verifyClientPoW(challengeData, powSolution) {
      if (!challengeData.powChallenge) return true;
      if (!powSolution) return false;

      const target = '0'.repeat(challengeData.powChallenge.difficulty);
      const data = challengeData.powChallenge.challenge + powSolution.nonce.toString();
      const hash = await CryptoUtils.hash(data);
      return hash.startsWith(target);
    }

    /**
     * Get challenge status
     * @param {string} challengeId - The challenge ID
     * @returns {Object} Challenge status
     */
    getChallengeStatus(challengeId) {
      const challenge = this.challenges.get(challengeId);
      
      if (!challenge) {
        return { exists: false, expired: true, brand: VAULTGUARD.name };
      }

      const expired = Date.now() - challenge.createdAt > challenge.expiryTime;
      
      return {
        exists: true,
        expired: expired,
        solved: challenge.solved,
        attempts: this.attempts.get(challengeId) || 0,
        maxAttempts: challenge.maxAttempts,
        type: challenge.type,
        brand: VAULTGUARD.name
      };
    }

    /**
     * Clean up expired challenges
     */
    cleanup() {
      const now = Date.now();
      
      for (const [id, challenge] of this.challenges) {
        if (now - challenge.createdAt > challenge.expiryTime) {
          this.challenges.delete(id);
          this.attempts.delete(id);
        }
      }
    }

    /**
     * Invalidate a challenge manually
     * @param {string} challengeId - The challenge ID to invalidate
     */
    invalidateChallenge(challengeId) {
      this.challenges.delete(challengeId);
      this.attempts.delete(challengeId);
    }

    /**
     * Get library statistics
     * @returns {Object} Statistics object
     */
    getStats() {
      return {
        activeChallenges: this.challenges.size,
        totalAttempts: Array.from(this.attempts.values()).reduce((a, b) => a + b, 0),
        brand: VAULTGUARD.name,
        version: VAULTGUARD.version
      };
    }

    /**
     * Reset all challenges and attempts
     */
    reset() {
      this.challenges.clear();
      this.attempts.clear();
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // VAULTGUARD UI COMPONENTS
  // ═══════════════════════════════════════════════════════════════════════════════

  const VaultGuardUI = {
    /**
     * Create a branded CAPTCHA form element
     * @param {string} containerId - Container element ID
     * @param {Object} options - UI options
     * @returns {HTMLFormElement} The created form element
     */
    createForm(containerId, options = {}) {
      const container = document.getElementById(containerId);
      if (!container) {
        throw new Error(`Container element with id "${containerId}" not found`);
      }

      const form = document.createElement('form');
      form.className = 'vaultguard-captcha-form';
      form.setAttribute('data-vg-version', VAULTGUARD.version);
      form.setAttribute('novalidate', 'novalidate');
      
      form.innerHTML = `
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
          
          .vaultguard-captcha-form {
            font-family: ${VAULTGUARD.typography.fontFamily};
            max-width: 340px;
            padding: 0;
            border: 2px solid ${VAULTGUARD.brandColors.border};
            border-radius: 16px;
            background: ${VAULTGUARD.brandColors.surface};
            box-shadow: 0 10px 40px rgba(30, 58, 95, 0.15), 0 2px 8px rgba(0, 0, 0, 0.08);
            overflow: hidden;
            position: relative;
          }
          
          /* Header with branding */
          .vg-header {
            background: linear-gradient(135deg, ${VAULTGUARD.brandColors.primary} 0%, #0f172a 100%);
            padding: 20px;
            display: flex;
            align-items: center;
            gap: 12px;
          }
          
          .vg-logo {
            width: 48px;
            height: 48px;
            flex-shrink: 0;
          }
          
          .vg-brand-text {
            color: white;
          }
          
          .vg-brand-name {
            font-size: 18px;
            font-weight: 700;
            letter-spacing: -0.5px;
            margin: 0;
            display: flex;
            align-items: center;
            gap: 6px;
          }
          
          .vg-brand-badge {
            background: ${VAULTGUARD.brandColors.secondary};
            color: ${VAULTGUARD.brandColors.primary};
            font-size: 9px;
            font-weight: 700;
            padding: 2px 6px;
            border-radius: 4px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          
          .vg-brand-tagline {
            font-size: 11px;
            color: rgba(255, 255, 255, 0.7);
            margin: 4px 0 0 0;
            font-weight: 400;
          }
          
          /* Content area */
          .vg-content {
            padding: 24px;
          }
          
          .vg-loading {
            display: none;
            text-align: center;
            padding: 32px 24px;
            color: ${VAULTGUARD.brandColors.textMuted};
          }
          
          .vg-spinner {
            display: inline-block;
            width: 32px;
            height: 32px;
            border: 3px solid ${VAULTGUARD.brandColors.border};
            border-top: 3px solid ${VAULTGUARD.brandColors.primary};
            border-radius: 50%;
            animation: vg-spin 1s linear infinite;
            margin-bottom: 12px;
          }
          
          @keyframes vg-spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          
          .vg-loading-text {
            font-size: 13px;
            font-weight: 500;
          }
          
          /* Challenge area */
          .vg-challenge-area {
            display: none;
          }
          
          .vg-question-label {
            font-size: 11px;
            font-weight: 600;
            color: ${VAULTGUARD.brandColors.textMuted};
            text-transform: uppercase;
            letter-spacing: 1px;
            margin-bottom: 8px;
          }
          
          .vg-question {
            font-size: 16px;
            font-weight: 600;
            color: ${VAULTGUARD.brandColors.text};
            margin-bottom: 20px;
            line-height: 1.5;
            padding: 16px;
            background: ${VAULTGUARD.brandColors.background};
            border-radius: 10px;
            border-left: 4px solid ${VAULTGUARD.brandColors.secondary};
          }
          
          .vg-input-group {
            margin-bottom: 16px;
          }
          
          .vg-input {
            width: 100%;
            padding: 14px 16px;
            border: 2px solid ${VAULTGUARD.brandColors.border};
            border-radius: 10px;
            font-size: 15px;
            font-family: ${VAULTGUARD.typography.fontFamily};
            transition: all 0.2s ease;
            box-sizing: border-box;
            color: ${VAULTGUARD.brandColors.text};
          }
          
          .vg-input:focus {
            outline: none;
            border-color: ${VAULTGUARD.brandColors.secondary};
            box-shadow: 0 0 0 4px rgba(0, 212, 170, 0.15);
          }
          
          .vg-input::placeholder {
            color: ${VAULTGUARD.brandColors.textMuted};
          }
          
          .vg-button {
            width: 100%;
            padding: 14px 20px;
            background: linear-gradient(135deg, ${VAULTGUARD.brandColors.primary} 0%, #0f172a 100%);
            color: white;
            border: none;
            border-radius: 10px;
            font-size: 15px;
            font-weight: 600;
            font-family: ${VAULTGUARD.typography.fontFamily};
            cursor: pointer;
            transition: all 0.2s ease;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
          }
          
          .vg-button:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 20px rgba(30, 58, 95, 0.3);
          }
          
          .vg-button:active {
            transform: translateY(0);
          }
          
          .vg-button:disabled {
            background: ${VAULTGUARD.brandColors.textMuted};
            cursor: not-allowed;
            transform: none;
            box-shadow: none;
          }
          
          .vg-button-icon {
            width: 18px;
            height: 18px;
          }
          
          /* Message area */
          .vg-message {
            margin-top: 16px;
            padding: 12px 16px;
            border-radius: 10px;
            font-size: 13px;
            font-weight: 500;
            display: none;
            align-items: center;
            gap: 10px;
          }
          
          .vg-message.error {
            background: #fef2f2;
            color: ${VAULTGUARD.brandColors.error};
            border: 1px solid #fecaca;
          }
          
          .vg-message.success {
            background: #f0fdf4;
            color: ${VAULTGUARD.brandColors.success};
            border: 1px solid #bbf7d0;
          }
          
          .vg-message.info {
            background: #eff6ff;
            color: ${VAULTGUARD.brandColors.primary};
            border: 1px solid #bfdbfe;
          }
          
          .vg-message-icon {
            width: 20px;
            height: 20px;
            flex-shrink: 0;
          }
          
          /* Footer */
          .vg-footer {
            padding: 16px 24px;
            background: ${VAULTGUARD.brandColors.background};
            border-top: 1px solid ${VAULTGUARD.brandColors.border};
            display: flex;
            align-items: center;
            justify-content: space-between;
          }
          
          .vg-footer-brand {
            display: flex;
            align-items: center;
            gap: 8px;
            font-size: 11px;
            color: ${VAULTGUARD.brandColors.textMuted};
            font-weight: 500;
          }
          
          .vg-footer-logo {
            width: 16px;
            height: 16px;
          }
          
          .vg-footer-links {
            display: flex;
            gap: 12px;
          }
          
          .vg-footer-link {
            font-size: 11px;
            color: ${VAULTGUARD.brandColors.textMuted};
            text-decoration: none;
            transition: color 0.2s;
          }
          
          .vg-footer-link:hover {
            color: ${VAULTGUARD.brandColors.primary};
          }
          
          /* Attempts indicator */
          .vg-attempts {
            display: flex;
            gap: 4px;
            margin-top: 12px;
          }
          
          .vg-attempt-dot {
            width: 8px;
            height: 8px;
            border-radius: 50%;
            background: ${VAULTGUARD.brandColors.border};
            transition: background 0.2s;
          }
          
          .vg-attempt-dot.used {
            background: ${VAULTGUARD.brandColors.error};
          }
          
          .vg-attempt-dot.remaining {
            background: ${VAULTGUARD.brandColors.secondary};
          }
          
          /* Image Puzzle Styles */
          .vg-image-puzzle {
            display: none;
          }
          
          .vg-image-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 8px;
            margin-bottom: 16px;
          }
          
          .vg-image-cell {
            aspect-ratio: 1;
            border: 3px solid ${VAULTGUARD.brandColors.border};
            border-radius: 10px;
            cursor: pointer;
            transition: all 0.2s ease;
            overflow: hidden;
            position: relative;
            background: ${VAULTGUARD.brandColors.background};
          }
          
          .vg-image-cell:hover {
            border-color: ${VAULTGUARD.brandColors.secondary};
            transform: scale(1.02);
          }
          
          .vg-image-cell.selected {
            border-color: ${VAULTGUARD.brandColors.secondary};
            box-shadow: 0 0 0 3px rgba(0, 212, 170, 0.3);
          }
          
          .vg-image-cell.selected::after {
            content: '✓';
            position: absolute;
            top: 4px;
            right: 4px;
            width: 24px;
            height: 24px;
            background: ${VAULTGUARD.brandColors.secondary};
            color: ${VAULTGUARD.brandColors.primary};
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 14px;
            font-weight: bold;
          }
          
          .vg-image-cell img {
            width: 100%;
            height: 100%;
            object-fit: cover;
            border-radius: 7px;
            display: block;
          }
          
          .vg-image-cell.vg-image-error {
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 24px;
          }

          .vg-image-cell.vg-image-retrying {
            opacity: 0.6;
          }

          .vg-image-cell.vg-image-retrying::before {
            content: '';
            position: absolute;
            top: 50%;
            left: 50%;
            width: 20px;
            height: 20px;
            margin: -10px 0 0 -10px;
            border: 2px solid ${VAULTGUARD.brandColors.border};
            border-top: 2px solid ${VAULTGUARD.brandColors.primary};
            border-radius: 50%;
            animation: vg-spin 0.8s linear infinite;
            z-index: 2;
          }
          
          .vg-image-cell .vg-image-placeholder {
            width: 100%;
            height: 100%;
            display: flex;
            align-items: center;
            justify-content: center;
            color: ${VAULTGUARD.brandColors.textMuted};
            font-size: 12px;
          }
          
          .vg-verify-button {
            margin-top: 8px;
          }

          .vg-illusion-challenge,
          .vg-audio-challenge,
          .vg-path-challenge {
            display: none;
          }

          .vg-illusion-canvas-container {
            margin-bottom: 12px;
          }

          .vg-audio-controls {
            display: flex;
            gap: 8px;
            margin-bottom: 12px;
          }

          .vg-audio-visualizer {
            display: flex;
            align-items: flex-end;
            justify-content: center;
            gap: 3px;
            height: 32px;
            margin-bottom: 12px;
          }

          .vg-path-canvas-container {
            margin-bottom: 12px;
          }

          .vg-path-status {
            font-size: 13px;
            color: ${VAULTGUARD.brandColors.textMuted};
            margin-bottom: 12px;
          }
        </style>
        
        <!-- Header -->
        <div class="vg-header">
          <div class="vg-logo">
            ${VAULTGUARD.logo.svg}
          </div>
          <div class="vg-brand-text">
            <div class="vg-brand-name">
              ${VAULTGUARD.name}
              <span class="vg-brand-badge">v${VAULTGUARD.version}</span>
            </div>
            <div class="vg-brand-tagline">Privacy-First Verification</div>
          </div>
        </div>
        
        <!-- Content -->
        <div class="vg-content">
          <!-- Loading State -->
          <div class="vg-loading">
            <div class="vg-spinner"></div>
            <div class="vg-loading-text">Generating secure challenge...</div>
          </div>
          
          <!-- Challenge Area -->
          <div class="vg-challenge-area">
            <div class="vg-question-label">Security Challenge</div>
            <div class="vg-question"></div>
            
            <!-- Text/Math/Pattern Challenge Input -->
            <div class="vg-text-challenge">
              <div class="vg-input-group">
                <input type="text" class="vg-input" placeholder="Enter your answer" required autocomplete="off">
              </div>
              
              <button type="submit" class="vg-button">
                <svg class="vg-button-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M12 2L3 7V12C3 17.5 6.8 22.9 12 24C17.2 22.9 21 17.5 21 12V7L12 2Z"/>
                  <path d="M8.5 12L11 14.5L15.5 9.5" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
                Verify Identity
              </button>
            </div>
            
            <!-- Image Puzzle Challenge -->
            <div class="vg-image-puzzle">
              <div class="vg-image-grid"></div>
              <button type="button" class="vg-button vg-verify-button">
                <svg class="vg-button-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M12 2L3 7V12C3 17.5 6.8 22.9 12 24C17.2 22.9 21 17.5 21 12V7L12 2Z"/>
                  <path d="M8.5 12L11 14.5L15.5 9.5" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
                Verify Selection
              </button>
            </div>

            <!-- Text Illusion Challenge -->
            <div class="vg-illusion-challenge">
              <div class="vg-illusion-canvas-container"></div>
              <div class="vg-input-group">
                <input type="text" class="vg-input vg-illusion-input" placeholder="Type the word you see" required autocomplete="off">
              </div>
              <button type="submit" class="vg-button">
                <svg class="vg-button-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M12 2L3 7V12C3 17.5 6.8 22.9 12 24C17.2 22.9 21 17.5 21 12V7L12 2Z"/>
                  <path d="M8.5 12L11 14.5L15.5 9.5" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
                Verify Identity
              </button>
            </div>

            <!-- Audio Challenge -->
            <div class="vg-audio-challenge">
              <div class="vg-audio-controls">
                <button type="button" class="vg-button vg-audio-play-btn">
                  <svg class="vg-button-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polygon points="5 3 19 12 5 21 5 3"/>
                  </svg>
                  Play Audio
                </button>
                <button type="button" class="vg-button vg-audio-replay-btn" style="display:none;">
                  <svg class="vg-button-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M1 4V10H7"/>
                    <path d="M3.51 15A9 9 0 1 0 2.13 10.9L1 10"/>
                  </svg>
                  Replay
                </button>
              </div>
              <div class="vg-audio-visualizer"></div>
              <div class="vg-input-group">
                <input type="text" class="vg-input vg-audio-input" placeholder="Type the digits you hear" required autocomplete="off" inputmode="numeric" pattern="[0-9]*">
              </div>
              <button type="submit" class="vg-button">
                <svg class="vg-button-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M12 2L3 7V12C3 17.5 6.8 22.9 12 24C17.2 22.9 21 17.5 21 12V7L12 2Z"/>
                  <path d="M8.5 12L11 14.5L15.5 9.5" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
                Verify Identity
              </button>
            </div>

            <!-- Visual Path Challenge -->
            <div class="vg-path-challenge">
              <div class="vg-path-canvas-container"></div>
              <div class="vg-path-status">Trace the line from <strong>S</strong> to <strong>E</strong></div>
              <button type="button" class="vg-button vg-path-reset-btn">
                <svg class="vg-button-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M1 4V10H7"/>
                  <path d="M3.51 15A9 9 0 1 0 2.13 10.9L1 10"/>
                </svg>
                Reset Trace
              </button>
              <button type="button" class="vg-button vg-verify-button">
                <svg class="vg-button-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M12 2L3 7V12C3 17.5 6.8 22.9 12 24C17.2 22.9 21 17.5 21 12V7L12 2Z"/>
                  <path d="M8.5 12L11 14.5L15.5 9.5" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
                Verify Trace
              </button>
            </div>

            <div class="vg-attempts">
              <div class="vg-attempt-dot remaining"></div>
              <div class="vg-attempt-dot remaining"></div>
              <div class="vg-attempt-dot remaining"></div>
            </div>
          </div>
          
          <!-- Message -->
          <div class="vg-message">
            <svg class="vg-message-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"/>
              <path d="M12 8V12M12 16H12.01"/>
            </svg>
            <span class="vg-message-text"></span>
          </div>
        </div>
        
        <!-- Footer -->
        <div class="vg-footer">
          <div class="vg-footer-brand">
            <div class="vg-footer-logo">${VAULTGUARD.logo.icon}</div>
            <span>Protected by ${VAULTGUARD.name}</span>
          </div>
          <div class="vg-footer-links">
            <a href="${VAULTGUARD.baseUrl}/${VAULTGUARD.urls.privacy}" class="vg-footer-link" target="_blank">Privacy</a>
            <a href="${VAULTGUARD.baseUrl}/${VAULTGUARD.urls.terms}" class="vg-footer-link" target="_blank">Terms</a>
          </div>
        </div>
      `;

      container.appendChild(form);

      return form;
    },

    /**
     * Initialize CAPTCHA with form
     * @param {HTMLFormElement} formElement - The form element
     * @param {VaultGuardCaptcha} captchaInstance - CAPTCHA instance
     * @param {Object} callbacks - Event callbacks
     * @returns {Object} Controller methods
     */
    async init(formElement, captchaInstance, callbacks = {}) {
      if (!formElement || !captchaInstance) {
        throw new Error('Form element and CAPTCHA instance are required');
      }

      // Initialize client-side security protections
      if (typeof SecurityModule !== 'undefined') {
        SecurityModule.init(callbacks.security);

        const secConfig = captchaInstance._securityConfig || {};

        if (secConfig.enableHoneypot !== false) {
          SecurityModule.deployHoneypot(formElement);
        }

        if (secConfig.enableCSRF !== false) {
          SecurityModule.injectCSRFField(formElement);
        }
      }

      const loadingEl = formElement.querySelector('.vg-loading');
      const challengeAreaEl = formElement.querySelector('.vg-challenge-area');
      const questionEl = formElement.querySelector('.vg-question');
      const textChallengeEl = formElement.querySelector('.vg-text-challenge');
      const imagePuzzleEl = formElement.querySelector('.vg-image-puzzle');
      const imageGridEl = formElement.querySelector('.vg-image-grid');
      const imageVerifyButtonEl = formElement.querySelector('.vg-image-puzzle .vg-verify-button');
      const pathVerifyButtonEl = formElement.querySelector('.vg-path-challenge .vg-verify-button');
      const inputEl = formElement.querySelector('.vg-input');
      const buttonEl = formElement.querySelector('.vg-button');
      const messageEl = formElement.querySelector('.vg-message');
      const messageTextEl = formElement.querySelector('.vg-message-text');
      const attemptDots = formElement.querySelectorAll('.vg-attempt-dot');

      let currentChallenge = null;
      let attemptsUsed = 0;
      let selectedImages = [];

      const updateAttemptDots = (used, total) => {
        attemptDots.forEach((dot, index) => {
          dot.classList.remove('used', 'remaining');
          if (index < used) {
            dot.classList.add('used');
          } else if (index < total) {
            dot.classList.add('remaining');
          }
        });
      };

      const generateFallbackSVG = (index) => {
        const colors = [
          ['#1e3a5f', '#00d4aa'], ['#0f172a', '#10b981'], ['#1e293b', '#f59e0b'],
          ['#334155', '#60a5fa'], ['#475569', '#c084fc'], ['#1e3a5f', '#f472b6'],
          ['#0f172a', '#34d399'], ['#1e293b', '#fbbf24'], ['#334155', '#818cf8']
        ];
        const [bg, fg] = colors[index % colors.length];
        const patterns = [
          `<rect width="100" height="100" fill="${bg}"/><circle cx="50" cy="50" r="30" fill="${fg}" opacity="0.8"/><rect x="35" y="35" width="30" height="30" fill="${bg}" transform="rotate(45 50 50)"/>`,
          `<rect width="100" height="100" fill="${bg}"/><rect x="20" y="20" width="60" height="60" rx="10" fill="${fg}" opacity="0.7"/><rect x="35" y="35" width="30" height="30" fill="${bg}"/>`,
          `<rect width="100" height="100" fill="${bg}"/><polygon points="50,15 85,85 15,85" fill="${fg}" opacity="0.7"/><rect x="40" y="40" width="20" height="20" fill="${bg}"/>`,
          `<rect width="100" height="100" fill="${bg}"/><circle cx="35" cy="35" r="20" fill="${fg}" opacity="0.6"/><circle cx="65" cy="65" r="20" fill="${fg}" opacity="0.6"/>`,
          `<rect width="100" height="100" fill="${bg}"/><path d="M10 50 L50 10 L90 50 L50 90 Z" fill="${fg}" opacity="0.7"/><circle cx="50" cy="50" r="15" fill="${bg}"/>`,
          `<rect width="100" height="100" fill="${bg}"/><rect x="15" y="15" width="25" height="25" fill="${fg}" opacity="0.7"/><rect x="60" y="15" width="25" height="25" fill="${fg}" opacity="0.5"/><rect x="15" y="60" width="25" height="25" fill="${fg}" opacity="0.5"/><rect x="60" y="60" width="25" height="25" fill="${fg}" opacity="0.7"/>`,
          `<rect width="100" height="100" fill="${bg}"/><circle cx="50" cy="50" r="35" fill="none" stroke="${fg}" stroke-width="8" opacity="0.7"/><line x1="25" y1="25" x2="75" y2="75" stroke="${bg}" stroke-width="6"/>`,
          `<rect width="100" height="100" fill="${bg}"/><path d="M50 10 L61 35 L88 35 L67 55 L75 82 L50 68 L25 82 L33 55 L12 35 L39 35 Z" fill="${fg}" opacity="0.7"/>`,
          `<rect width="100" height="100" fill="${bg}"/><rect x="10" y="40" width="80" height="20" rx="10" fill="${fg}" opacity="0.7"/><rect x="40" y="10" width="20" height="80" rx="10" fill="${fg}" opacity="0.7"/>`
        ];
        const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">${patterns[index % patterns.length]}</svg>`;
        return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
      };

      const loadImageWithRetry = (img, cell, imgSrc, index, retryCount = 0) => {
        const maxRetries = 3;

        img.onerror = function() {
          if (retryCount < maxRetries) {
            const separator = imgSrc.includes('?') ? '&' : '?';
            const retrySrc = `${imgSrc}${separator}_t=${Date.now()}_r=${retryCount}`;
            cell.classList.add('vg-image-retrying');
            if (captchaInstance && typeof captchaInstance._emitHook === 'function') {
              captchaInstance._emitHook('onImageRetry', { index, retryCount: retryCount + 1, maxRetries, src: imgSrc });
            }
            img.src = retrySrc;
          } else {
            img.style.display = 'none';
            cell.classList.remove('vg-image-retrying');
            cell.classList.add('vg-image-error');
            const fallbackImg = document.createElement('img');
            fallbackImg.src = generateFallbackSVG(index);
            fallbackImg.alt = `Image ${index + 1}`;
            fallbackImg.style.cssText = 'width:100%;height:100%;object-fit:cover;border-radius:7px;display:block;';
            cell.appendChild(fallbackImg);
            if (captchaInstance && typeof captchaInstance._emitHook === 'function') {
              captchaInstance._emitHook('onImageLoadFailed', { index, src: imgSrc, fallback: 'svg' });
            }
          }
        };

        img.src = imgSrc;
      };

      const renderImageGrid = (images) => {
        imageGridEl.innerHTML = '';
        selectedImages = [];

        images.forEach((imgSrc, index) => {
          const cell = document.createElement('div');
          cell.className = 'vg-image-cell';
          cell.dataset.index = index;

          const img = document.createElement('img');
          img.alt = `Image ${index + 1}`;
          img.loading = 'eager';
          img.style.cssText = 'width:100%;height:100%;object-fit:cover;border-radius:7px;display:block;';

          loadImageWithRetry(img, cell, imgSrc, index);

          cell.appendChild(img);

          cell.addEventListener('click', () => {
            cell.classList.toggle('selected');
            if (cell.classList.contains('selected')) {
              selectedImages.push(index);
            } else {
              selectedImages = selectedImages.filter(i => i !== index);
            }
          });

          imageGridEl.appendChild(cell);
        });
      };

      const illusionChallengeEl = formElement.querySelector('.vg-illusion-challenge');
      const illusionCanvasContainer = formElement.querySelector('.vg-illusion-canvas-container');
      const illusionInput = formElement.querySelector('.vg-illusion-input');
      const audioChallengeEl = formElement.querySelector('.vg-audio-challenge');
      const audioPlayBtn = formElement.querySelector('.vg-audio-play-btn');
      const audioReplayBtn = formElement.querySelector('.vg-audio-replay-btn');
      const audioVisualizer = formElement.querySelector('.vg-audio-visualizer');
      const audioInput = formElement.querySelector('.vg-audio-input');
      const pathChallengeEl = formElement.querySelector('.vg-path-challenge');
      const pathCanvasContainer = formElement.querySelector('.vg-path-canvas-container');
      const pathStatus = formElement.querySelector('.vg-path-status');
      const pathResetBtn = formElement.querySelector('.vg-path-reset-btn');

      let audioContext = null;
      let audioSourceNode = null;
      let isTracing = false;
      let tracePoints = [];
      let pathCanvas = null;
      let pathCtx = null;
      let pathAnswerData = null;

      const hideAllChallengeTypes = () => {
        textChallengeEl.style.display = 'none';
        imagePuzzleEl.style.display = 'none';
        if (illusionChallengeEl) illusionChallengeEl.style.display = 'none';
        if (audioChallengeEl) audioChallengeEl.style.display = 'none';
        if (pathChallengeEl) pathChallengeEl.style.display = 'none';
      };

      const stopAudio = () => {
        if (audioSourceNode) {
          try { audioSourceNode.stop(); } catch (e) {}
          audioSourceNode = null;
        }
      };

      const playAudioChallenge = (challenge) => {
        stopAudio();

        if (!window.AudioContext && !window.webkitAudioContext) {
          showMessage('Audio is not supported in this browser', 'error');
          return;
        }

        if (!audioContext) {
          audioContext = new (window.AudioContext || window.webkitAudioContext)();
        }
        if (audioContext.state === 'suspended') {
          audioContext.resume();
        }

        try {
          const ctx = audioContext;
          const buffer = ctx.createBuffer(1, challenge.audioSamples.length, challenge.audioSampleRate);
          buffer.getChannelData(0).set(challenge.audioSamples);

          const source = ctx.createBufferSource();
          source.buffer = buffer;

          const analyser = ctx.createAnalyser();
          analyser.fftSize = 64;
          source.connect(analyser);
          analyser.connect(ctx.destination);
          audioSourceNode = source;

          if (audioVisualizer) {
            audioVisualizer.innerHTML = '';
            const barCount = 16;
            const bars = [];
            for (let i = 0; i < barCount; i++) {
              const bar = document.createElement('div');
              bar.style.cssText = 'width:4px;min-height:2px;background:#00d4aa;border-radius:2px;transition:height 0.05s;';
              audioVisualizer.appendChild(bar);
              bars.push(bar);
            }
            const dataArray = new Uint8Array(analyser.frequencyBinCount);
            const animate = () => {
              if (!audioSourceNode) return;
              analyser.getByteFrequencyData(dataArray);
              for (let i = 0; i < barCount; i++) {
                const val = dataArray[i] || 0;
                bars[i].style.height = Math.max(2, val / 4) + 'px';
              }
              requestAnimationFrame(animate);
            };
            animate();
          }

          source.onended = () => {
            audioSourceNode = null;
            if (audioVisualizer) audioVisualizer.innerHTML = '';
            if (audioReplayBtn) audioReplayBtn.style.display = '';
          };

          source.start();
        } catch (e) {
          console.error('VaultGuard audio playback error:', e);
          showMessage('Audio playback failed. Please try again.', 'error');
        }
      };

      const setupPathChallenge = (challenge) => {
        if (!pathCanvasContainer || !challenge.canvas || !(challenge.canvas instanceof HTMLElement)) {
          console.error('VaultGuard path challenge setup error: missing container or canvas');
          return;
        }
        pathCanvasContainer.innerHTML = '';
        const canvas = challenge.canvas;
        pathCanvas = canvas;
        pathCanvasContainer.appendChild(canvas);
        pathCtx = canvas.getContext('2d', { willReadFrequently: false });
        tracePoints = [];
        pathAnswerData = { points: [], startTime: null, endTime: null };
        isTracing = false;

        const pathImageData = pathCtx.getImageData(0, 0, canvas.width, canvas.height);

        const redrawPathBackground = () => {
          if (!pathCtx) return;
          pathCtx.putImageData(pathImageData, 0, 0);
        };

        const startTrace = (e) => {
          e.preventDefault();
          isTracing = true;
          tracePoints = [];
          pathAnswerData.startTime = Date.now();
          pathAnswerData.points = [];
          const pt = getCanvasPoint(e);
          tracePoints.push(pt);
          pathAnswerData.points.push({ x: pt.x, y: pt.y, t: 0 });
          drawTrace();
          if (pathStatus) pathStatus.textContent = 'Tracing...';
        };

        const moveTrace = (e) => {
          e.preventDefault();
          if (!isTracing) return;
          const pt = getCanvasPoint(e);
          tracePoints.push(pt);
          pathAnswerData.points.push({ x: pt.x, y: pt.y, t: Date.now() - pathAnswerData.startTime });
          drawTrace();
        };

        const endTrace = (e) => {
          e.preventDefault();
          if (!isTracing) return;
          isTracing = false;
          pathAnswerData.endTime = Date.now();
          drawTrace();
          if (pathStatus) {
            const count = pathAnswerData.points.length;
            pathStatus.innerHTML = `Trace recorded (${count} points). <strong>Verify</strong> or <strong>Reset</strong>.`;
          }
        };

        const getCanvasPoint = (e) => {
          const rect = canvas.getBoundingClientRect();
          const scaleX = canvas.width / rect.width;
          const scaleY = canvas.height / rect.height;
          const clientX = e.touches ? e.touches[0].clientX : e.clientX;
          const clientY = e.touches ? e.touches[0].clientY : e.clientY;
          return {
            x: (clientX - rect.left) * scaleX,
            y: (clientY - rect.top) * scaleY
          };
        };

        const drawTrace = () => {
          if (!pathCtx) return;
          redrawPathBackground();
          pathCtx.strokeStyle = '#f59e0b';
          pathCtx.lineWidth = 3;
          pathCtx.lineCap = 'round';
          pathCtx.lineJoin = 'round';
          pathCtx.shadowColor = 'rgba(245, 158, 11, 0.5)';
          pathCtx.shadowBlur = 8;

          if (tracePoints.length > 0) {
            pathCtx.beginPath();
            pathCtx.moveTo(tracePoints[0].x, tracePoints[0].y);
            for (let i = 1; i < tracePoints.length; i++) {
              pathCtx.lineTo(tracePoints[i].x, tracePoints[i].y);
            }
            pathCtx.stroke();

            pathCtx.fillStyle = '#f59e0b';
            pathCtx.beginPath();
            pathCtx.arc(tracePoints[tracePoints.length - 1].x, tracePoints[tracePoints.length - 1].y, 4, 0, Math.PI * 2);
            pathCtx.fill();
          }
          pathCtx.shadowBlur = 0;
        };

        canvas.addEventListener('mousedown', startTrace);
        canvas.addEventListener('mousemove', moveTrace);
        canvas.addEventListener('mouseup', endTrace);
        canvas.addEventListener('mouseleave', endTrace);
        canvas.addEventListener('touchstart', startTrace, { passive: false });
        canvas.addEventListener('touchmove', moveTrace, { passive: false });
        canvas.addEventListener('touchend', endTrace, { passive: false });

        if (pathResetBtn) {
          pathResetBtn.onclick = () => {
            tracePoints = [];
            pathAnswerData = { points: [], startTime: null, endTime: null };
            isTracing = false;
            redrawPathBackground();
            if (pathStatus) pathStatus.innerHTML = 'Trace the line from <strong>S</strong> to <strong>E</strong>';
          };
        }
      };

      const loadChallenge = async () => {
        loadingEl.style.display = 'block';
        challengeAreaEl.style.display = 'none';
        messageEl.style.display = 'none';
        inputEl.value = '';
        buttonEl.disabled = true;
        if (imageVerifyButtonEl) imageVerifyButtonEl.disabled = true;
        if (pathVerifyButtonEl) pathVerifyButtonEl.disabled = true;
        attemptsUsed = 0;
        updateAttemptDots(0, 3);
        selectedImages = [];
        stopAudio();

        try {
          currentChallenge = await captchaInstance.generateChallenge();
          questionEl.textContent = currentChallenge.question;

          hideAllChallengeTypes();

          switch (currentChallenge.type) {
            case 'imagePuzzle':
              imagePuzzleEl.style.display = 'block';
              renderImageGrid(currentChallenge.images);
              if (imageVerifyButtonEl) imageVerifyButtonEl.disabled = false;
              break;

            case 'textIllusion':
              if (illusionChallengeEl) illusionChallengeEl.style.display = 'block';
              if (illusionCanvasContainer) {
                illusionCanvasContainer.innerHTML = '';
                if (currentChallenge.canvas instanceof HTMLElement) {
                  illusionCanvasContainer.appendChild(currentChallenge.canvas);
                }
              }
              if (illusionInput) {
                illusionInput.value = '';
                buttonEl.disabled = false;
                setTimeout(() => illusionInput.focus(), 100);
              }
              break;

            case 'audio':
              if (audioChallengeEl) audioChallengeEl.style.display = 'block';
              if (audioInput) audioInput.value = '';
              if (audioReplayBtn) audioReplayBtn.style.display = 'none';
              if (audioVisualizer) audioVisualizer.innerHTML = '';
              buttonEl.disabled = false;
              if (audioPlayBtn) {
                audioPlayBtn.onclick = () => playAudioChallenge(currentChallenge);
              }
              break;

            case 'visualPath':
              if (pathChallengeEl) pathChallengeEl.style.display = 'block';
              setupPathChallenge(currentChallenge);
              if (pathVerifyButtonEl) pathVerifyButtonEl.disabled = false;
              break;

            default:
              textChallengeEl.style.display = 'block';
              buttonEl.disabled = false;
              inputEl.focus();
              break;
          }

          loadingEl.style.display = 'none';
          challengeAreaEl.style.display = 'block';

          if (currentChallenge.powChallenge && typeof CryptoUtils !== 'undefined' && CryptoUtils.solveProofOfWork) {
            currentChallenge.powSolution = null;
            CryptoUtils.solveProofOfWork(
              currentChallenge.powChallenge.challenge,
              currentChallenge.powChallenge.difficulty
            ).then(solution => {
              if (solution && currentChallenge && currentChallenge.powChallenge) {
                currentChallenge.powSolution = solution;
              }
            }).catch(() => {});
          }

          if (callbacks.onChallengeLoaded) {
            callbacks.onChallengeLoaded(currentChallenge);
          }
        } catch (error) {
          showMessage('Failed to load challenge. Please try again.', 'error');
          loadingEl.style.display = 'none';
          console.error(`${VAULTGUARD.name} load error:`, error);
        }
      };

      const showMessage = (text, type) => {
        messageTextEl.textContent = text;
        messageEl.className = `vg-message ${type}`;
        messageEl.style.display = 'flex';
      };

      const disableVerifyButtons = () => {
        if (imageVerifyButtonEl) imageVerifyButtonEl.disabled = true;
        if (pathVerifyButtonEl) pathVerifyButtonEl.disabled = true;
      };

      const enableVerifyButtons = () => {
        if (currentChallenge && currentChallenge.type === 'imagePuzzle' && imageVerifyButtonEl) {
          imageVerifyButtonEl.disabled = false;
        } else if (currentChallenge && currentChallenge.type === 'visualPath' && pathVerifyButtonEl) {
          pathVerifyButtonEl.disabled = false;
        }
      };

      const verifyAnswer = async (userAnswer) => {
        if (!currentChallenge) return;

        if (currentChallenge.powChallenge && !currentChallenge.powSolution) {
          showMessage('Computing proof-of-work...', 'info');
          buttonEl.disabled = true;
          disableVerifyButtons();

          const powWaitStart = Date.now();
          const powTimeout = 60000;
          while (!currentChallenge.powSolution && (Date.now() - powWaitStart) < powTimeout) {
            await new Promise(resolve => setTimeout(resolve, 100));
          }

          if (!currentChallenge.powSolution) {
            showMessage('Proof-of-Work timed out. Please try again.', 'error');
            buttonEl.disabled = false;
            enableVerifyButtons();
            return;
          }
        }

        buttonEl.disabled = true;
        disableVerifyButtons();
        showMessage('Verifying...', 'info');

        try {
          const result = await captchaInstance.verifyAnswer(currentChallenge.id, userAnswer, formElement);
          
          if (result.success && result.verified) {
            showMessage('✓ Identity verified successfully!', 'success');
            updateAttemptDots(0, 3);
            if (callbacks.onSuccess) {
              callbacks.onSuccess(result, currentChallenge.id);
            }
          } else {
            attemptsUsed++;
            const maxAttempts = 3;
            updateAttemptDots(attemptsUsed, maxAttempts);
            
            showMessage(result.error || 'Incorrect answer', 'error');
            
            if (currentChallenge.type === 'imagePuzzle') {
              selectedImages = [];
              document.querySelectorAll('.vg-image-cell').forEach(cell => {
                cell.classList.remove('selected');
              });
            } else {
              inputEl.value = '';
              inputEl.focus();
            }
            
            if (callbacks.onError) {
              callbacks.onError(result, currentChallenge.id);
            }

            if (result.error === 'Maximum attempts exceeded' || result.error === 'Challenge expired') {
              setTimeout(loadChallenge, 1500);
            } else {
              buttonEl.disabled = false;
              enableVerifyButtons();
            }
          }
        } catch (error) {
          showMessage('Verification failed. Please try again.', 'error');
          console.error(`${VAULTGUARD.name} verification error:`, error);
          buttonEl.disabled = false;
          enableVerifyButtons();
        }
      };

      formElement.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (!currentChallenge) return;
        if (currentChallenge.type === 'imagePuzzle' || currentChallenge.type === 'visualPath') return;

        let userAnswer = '';
        if (currentChallenge.type === 'textIllusion') {
          userAnswer = illusionInput ? illusionInput.value.trim() : '';
        } else if (currentChallenge.type === 'audio') {
          userAnswer = audioInput ? audioInput.value.trim() : '';
        } else {
          userAnswer = inputEl.value.trim();
        }

        if (!userAnswer) {
          showMessage('Please enter an answer', 'error');
          return;
        }

        await verifyAnswer(userAnswer);
      });

      if (imageVerifyButtonEl) {
        imageVerifyButtonEl.addEventListener('click', async () => {
          if (!currentChallenge) return;
          if (selectedImages.length === 0) {
            showMessage('Please select at least one image', 'error');
            return;
          }
          const sortedSelection = [...selectedImages].sort((a, b) => a - b);
          await verifyAnswer(sortedSelection.join(','));
        });
      }

      if (pathVerifyButtonEl) {
        pathVerifyButtonEl.addEventListener('click', async () => {
          if (!currentChallenge) return;
          if (!pathAnswerData || !pathAnswerData.points || pathAnswerData.points.length === 0) {
            showMessage('Please trace the line first', 'error');
            return;
          }
          if (!pathAnswerData.endTime) {
            showMessage('Please complete your trace', 'error');
            return;
          }
          const tracePayload = JSON.stringify(pathAnswerData);
          await verifyAnswer(tracePayload);
        });
      }

      await loadChallenge();

      return {
        reload: loadChallenge,
        getChallenge: () => currentChallenge
      };
    }
  };

  // ═══════════════════════════════════════════════════════════════════════════════
  // VAULTGUARD HOOKS SYSTEM — Lifecycle Events
  // ═══════════════════════════════════════════════════════════════════════════════
  // Built-in hooks for extending VaultGuard behavior at key lifecycle points.
  // All hooks are optional. Hooks fire asynchronously and errors are caught
  // so they never break the CAPTCHA flow.
  //
  // Available hooks:
  //   onChallengeGenerated  — Fired when a new challenge is created
  //   onChallengeExpired    — Fired when a challenge expires
  //   onClientVerified      — Fired after client-side verification (before server gate)
  //   onServerVerified      — Fired after server-side verification (Double-Gate)
  //   onServerRejected      — Fired when server rejects a client-verified challenge
  //   onSecurityFlag        — Fired when any security check triggers a flag
  //   onBotDetected         — Fired when behavioral analysis flags a bot
  //   onHoneypotTriggered   — Fired when a honeypot field is filled
  //   onCSRFInvalid         — Fired when CSRF validation fails
  //   onFingerprintMismatch — Fired when browser fingerprint doesn't match
  //   onImageLoadFailed     — Fired when an image puzzle image fails to load
  //   onImageRetry          — Fired when an image puzzle retries loading
  //   onMaxAttemptsExceeded — Fired when max attempts are exceeded
  //   onSuccess             — Fired on fully verified success (both gates passed)
  //   onError               — Fired on any verification error
  //
  // Usage:
  //   const hooks = new VaultGuard.Hooks();
  //   hooks.on('onBotDetected', (data) => { /* custom logic */ });
  //   hooks.on('onSuccess', (data) => { /* proceed */ });
  //   captchaInstance.setHooks(hooks);

  class VaultGuardHooks {
    constructor() {
      this._handlers = {};
      this._globalHandlers = [];
    }

    on(event, handler) {
      if (typeof handler !== 'function') {
        throw new Error(`VaultGuardHooks: handler for "${event}" must be a function`);
      }
      if (!this._handlers[event]) {
        this._handlers[event] = [];
      }
      this._handlers[event].push(handler);
      return this;
    }

    off(event, handler) {
      if (!this._handlers[event]) return this;
      if (!handler) {
        delete this._handlers[event];
      } else {
        this._handlers[event] = this._handlers[event].filter(h => h !== handler);
        if (this._handlers[event].length === 0) {
          delete this._handlers[event];
        }
      }
      return this;
    }

    onAny(handler) {
      if (typeof handler !== 'function') {
        throw new Error('VaultGuardHooks: global handler must be a function');
      }
      this._globalHandlers.push(handler);
      return this;
    }

    offAny(handler) {
      if (!handler) {
        this._globalHandlers = [];
      } else {
        this._globalHandlers = this._globalHandlers.filter(h => h !== handler);
      }
      return this;
    }

    async emit(event, data = {}) {
      const eventData = { event, timestamp: Date.now(), ...data };

      for (const handler of this._globalHandlers) {
        try {
          await handler(eventData);
        } catch (e) {
          // Hooks must never break the CAPTCHA flow
        }
      }

      const handlers = this._handlers[event] || [];
      for (const handler of handlers) {
        try {
          await handler(eventData);
        } catch (e) {
          // Hooks must never break the CAPTCHA flow
        }
      }

      return this;
    }

    hasHandlers(event) {
      return !!(this._handlers[event] && this._handlers[event].length > 0);
    }

    clear() {
      this._handlers = {};
      this._globalHandlers = [];
      return this;
    }

    static get availableEvents() {
      return [
        'onChallengeGenerated',
        'onChallengeExpired',
        'onClientVerified',
        'onServerVerified',
        'onServerRejected',
        'onSecurityFlag',
        'onBotDetected',
        'onHoneypotTriggered',
        'onCSRFInvalid',
        'onFingerprintMismatch',
        'onImageLoadFailed',
        'onImageRetry',
        'onMaxAttemptsExceeded',
        'onSuccess',
        'onError'
      ];
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // VAULTGUARD SERVER EXTENSION — Double-Gate Validation
  // ═══════════════════════════════════════════════════════════════════════════════
  // Optional server-side companion for enhanced security.
  // VaultGuard works fully serverless by default. This extension adds a second
  // validation gate: the client generates and verifies challenges locally (Gate 1),
  // then the server independently re-verifies the challenge answer (Gate 2).
  //
  // Usage with hooks:
  //   const hooks = new VaultGuard.Hooks();
  //   hooks.on('onServerVerified', (data) => { console.log('Gate 2 passed'); });
  //   hooks.on('onServerRejected', (data) => { console.log('Gate 2 blocked'); });
  //
  //   const server = new VaultGuard.ServerExtension({
  //     endpoint: '/api/vaultguard',
  //     secret: 'your-server-secret',
  //     hooks: hooks
  //   });
  //   server.attach(captchaInstance);
  //
  // Server endpoint receives: { challengeId, answer, clientToken, fingerprint }
  // Server responds: { valid: boolean, serverToken?: string, error?: string }

  class VaultGuardServerExtension {
    constructor(options = {}) {
      this.options = {
        endpoint: options.endpoint || '/api/vaultguard',
        secret: options.secret || '',
        timeout: options.timeout || 10000,
        retries: options.retries || 2,
        retryDelay: options.retryDelay || 1000,
        enabled: options.enabled !== false,
        onServerVerified: options.onServerVerified || null,
        onServerError: options.onServerError || null,
        hooks: options.hooks || null,
        ...options
      };

      this._attachedCaptcha = null;
      this._pendingVerifications = new Map();
    }

    setHooks(hooks) {
      this.options.hooks = hooks;
      return this;
    }

    getHooks() {
      return this.options.hooks;
    }

    async _emitHook(event, data = {}) {
      if (this.options.hooks && typeof this.options.hooks.emit === 'function') {
        try {
          await this.options.hooks.emit(event, data);
        } catch (e) {
          // Hooks must never break the flow
        }
      }

      if (event === 'onServerVerified' && typeof this.options.onServerVerified === 'function') {
        try { this.options.onServerVerified(data); } catch (e) {}
      }
      if (event === 'onServerRejected' && typeof this.options.onServerError === 'function') {
        try { this.options.onServerError(data); } catch (e) {}
      }
    }

    attach(captchaInstance) {
      if (!captchaInstance || typeof captchaInstance.verifyAnswer !== 'function') {
        throw new Error('VaultGuardServerExtension: Invalid captcha instance');
      }

      this._attachedCaptcha = captchaInstance;
      this._originalVerify = captchaInstance.verifyAnswer.bind(captchaInstance);

      const originalVerify = this._originalVerify;

      const self = this;
      captchaInstance.verifyAnswer = async (challengeId, userAnswer, formElement = null) => {
        if (!self.options.enabled) {
          return originalVerify(challengeId, userAnswer, formElement);
        }

        const clientResult = await originalVerify(challengeId, userAnswer, formElement);

        if (!clientResult.success) {
          return clientResult;
        }

        const serverResult = await self._serverVerify(challengeId, userAnswer, clientResult);

        if (!serverResult.valid) {
          self._emitHook('onServerRejected', {
            challengeId,
            error: serverResult.error,
            clientResult
          });
          self._emitHook('onSecurityFlag', {
            challengeId,
            flag: 'server_rejected'
          });
          return {
            success: false,
            error: serverResult.error || 'Server verification failed',
            securityFlag: 'server_rejected',
            brand: VAULTGUARD.name
          };
        }

        self._emitHook('onServerVerified', {
          challengeId,
          serverToken: serverResult.serverToken,
          clientResult
        });
        self._emitHook('onSuccess', {
          challengeId,
          serverVerified: true,
          serverToken: serverResult.serverToken
        });

        return {
          ...clientResult,
          serverVerified: true,
          serverToken: serverResult.serverToken || null
        };
      };

      return this;
    }

    detach() {
      if (this._attachedCaptcha && this._originalVerify) {
        this._attachedCaptcha.verifyAnswer = this._originalVerify;
      }
      this._attachedCaptcha = null;
      return this;
    }

    async _serverVerify(challengeId, userAnswer, clientResult) {
      let lastError = null;

      for (let attempt = 0; attempt <= this.options.retries; attempt++) {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), this.options.timeout);

          const behavioralData = typeof SecurityModule !== 'undefined'
            ? SecurityModule.analyzeBehavior()
            : null;

          const response = await fetch(this.options.endpoint, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-VaultGuard-Client': VAULTGUARD.version
            },
            body: JSON.stringify({
              challengeId,
              answer: userAnswer,
              behavioral: behavioralData ? {
                mouseMovements: behavioralData.mouseMovements || [],
                keyPresses: behavioralData.keyPresses || [],
                timeOnPage: behavioralData.timeOnPage || 0,
                interactionCount: behavioralData.interactionCount || 0
              } : null,
              timestamp: Date.now()
            }),
            signal: controller.signal
          });

          clearTimeout(timeoutId);

          if (!response.ok) {
            throw new Error(`Server returned ${response.status}`);
          }

          const data = await response.json();

          if (typeof this.options.onServerVerified === 'function') {
            this.options.onServerVerified(data, challengeId);
          }

          return { valid: true, serverToken: data.serverToken, trustScore: data.trustScore };

        } catch (err) {
          lastError = err;

          if (attempt < this.options.retries) {
            await this._delay(this.options.retryDelay * (attempt + 1));
          }
        }
      }

      if (typeof this.options.onServerError === 'function') {
        this.options.onServerError(lastError, challengeId);
      }

      return {
        valid: false,
        error: lastError ? lastError.message : 'Server verification unavailable'
      };
    }

    _delay(ms) {
      return new Promise(resolve => setTimeout(resolve, ms));
    }

    enable() {
      this.options.enabled = true;
      return this;
    }

    disable() {
      this.options.enabled = false;
      return this;
    }

    isEnabled() {
      return this.options.enabled;
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // VAULTGUARD EXPORT
  // ═══════════════════════════════════════════════════════════════════════════════

  const VaultGuard = {
    // Brand info
    brand: VAULTGUARD,

    // Core classes
    Captcha: VaultGuardCaptcha,
    UI: VaultGuardUI,

    // Utilities
    Crypto: CryptoUtils,
    Challenges: ChallengeGenerators,

    // Security module
    Security: SecurityModule,

    // Hooks system
    Hooks: VaultGuardHooks,

    // Server extension (Double-Gate Validation)
    ServerExtension: VaultGuardServerExtension,

    /**
     * Quick setup helper
     * @param {string} containerId - Container element ID
     * @param {Object} options - Configuration options
     * @param {Object} options.captcha - Captcha constructor options
     * @param {Object} options.callbacks - Event callbacks
     * @param {Object} options.security - Security module init options
     * @returns {Object} Setup result with captcha, form, and controller
     */
    async quickSetup(containerId, options = {}) {
      const captcha = new VaultGuardCaptcha(options.captcha);
      const form = VaultGuardUI.createForm(containerId, options);
      const controller = await VaultGuardUI.init(form, captcha, {
        ...options.callbacks,
        security: options.security
      });

      return {
        captcha,
        form,
        controller
      };
    },

    /**
     * Get version info
     * @returns {Object} Version information
     */
    getVersion() {
      return {
        name: VAULTGUARD.name,
        product: VAULTGUARD.product,
        version: VAULTGUARD.version,
        codename: VAULTGUARD.codename,
        fullVersion: `${VAULTGUARD.name} ${VAULTGUARD.product} v${VAULTGUARD.version} "${VAULTGUARD.codename}"`
      };
    }
  };

  // Export for different environments
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = VaultGuard;
  } else if (typeof define === 'function' && define.amd) {
    define(() => VaultGuard);
  } else {
    global.VaultGuard = VaultGuard;
  }

})(typeof globalThis !== 'undefined' ? globalThis : 
   typeof window !== 'undefined' ? window : 
   typeof global !== 'undefined' ? global : this);