/**
 * Phryco Creator Studio - Interactive Dispatch Controller & Live Preview Engine
 * Synchronizes developer markdown formatting, real-time Chart.js renderings, Mermaid blueprints,
 * file attachment staging, and curated creator typography with public publishing.
 */

import { API_BASE_URL } from '../../utils/config.js';
let stagedAttachments = [];
let previewTimeout = null;

const DEFAULT_EDITOR_CONTENT = `# Transforming Creator Publications into Interactive Software

In legacy web media, articles are static, passive text blocks. Readers consume what editorial directors publish without interactivity, data exploration, or live architectural verification.

At **Phryco**, we believe creators should be able to literally **code their publications**. Utilizing our integrated developer studio, verified creators can embed interactive live visualizations, dynamic architecture charts, syntax-highlighted software SDKs, and downloadable code attachments directly within their editorial markup.

---

## 1. Live Computational Visualization Engine

Below is an interactive Chart.js bar graph generated directly by writing a lightweight JSON code block in your Markdown editor. Try hovering over the data points or altering the JSON values on the left editor:

\`\`\`chart
{
  "type": "bar",
  "title": "2026 Video Transcoding Efficiency (FPS / Watt)",
  "labels": ["Phryco Vault Core", "Standard H.264 Encoder", "Legacy Cloud Transcoder", "Browser Native WebM"],
  "datasets": [
    {
      "label": "Frames Processed per Watt (Higher is Better)",
      "data": [480, 210, 165, 90],
      "color": ["#06b6d4", "#8b5cf6", "#ec4899", "#64748b"]
    }
  ]
}
\`\`\`

> [!IMPORTANT]
> Because interactive visualizations run natively on our high-performance client rendering pipeline, your readers experience zero server latency while interrogating complex platform statistics!

---

## 2. Architecture & Workflow Flowcharts

Need to illustrate how your channel's custom Python upload scripts interface with our decentralized reward pool? Use native Mermaid code syntax to generate clean, dark-mode technical schematics:

\`\`\`mermaid
graph LR
    A[Raw Video File] -->|Phryco SDK| B(Zero-Fee Transcoding Core)
    B -->|Compress & Optimize| C{Vault Verification}
    C -->|Halal Certified| D[Live Streaming Distribution]
    C -->|Tip Rewards| E[Phrybucks Creator Vault]
\`\`\`

---

## 3. Inline Technical Attachments

When sharing software engineering tutorials or design assets, creators shouldn't have to link out to unreliable external file lockers. You can attach archives directly to your post and embed them anywhere in the text using our shortcode syntax:

[ATTACH: phryco_streaming_sdk_v2.zip]

> [!TIP]
> Select your preferred **Typography Blueprint** (Modern Sans, Editorial Serif, or Technical Monospace) from the top control deck before publishing. Your typographic vision is persisted across all public reading environments!`;

document.addEventListener('DOMContentLoaded', () => {
    initStudioEditor();
    initTypographySelector();
    initPublishingHandler();
});

function initStudioEditor() {
    const textarea = document.getElementById('editor-textarea');
    if (textarea && !textarea.value.trim()) {
        textarea.value = DEFAULT_EDITOR_CONTENT;
    }

    textarea.addEventListener('input', () => {
        if (previewTimeout) clearTimeout(previewTimeout);
        previewTimeout = setTimeout(() => {
            updateLivePreview();
        }, 300);
    });

    // Initial compile
    updateLivePreview();
}

function initTypographySelector() {
    const select = document.getElementById('select-typography-theme');
    const indicator = document.getElementById('preview-theme-indicator');
    const previewBox = document.getElementById('live-preview-box');

    if (select) {
        select.addEventListener('change', () => {
            const theme = select.value || "sans";
            previewBox.className = `preview-pane theme-${theme}`;
            if (indicator) {
                const names = { sans: 'Modern Geometric', serif: 'Editorial Serif', mono: 'Technical Monospace' };
                indicator.textContent = `Theme: ${names[theme] || 'Custom'}`;
            }
        });
    }
}

function updateLivePreview() {
    const textarea = document.getElementById('editor-textarea');
    const previewBox = document.getElementById('live-preview-box');
    if (!textarea || !previewBox) return;

    const rawContent = textarea.value;

    if (window.marked && window.DOMPurify) {
        marked.setOptions({ gfm: true, breaks: true });
        const html = DOMPurify.sanitize(marked.parse(rawContent), {
            ADD_TAGS: ['canvas', 'pre', 'code'],
            ADD_ATTR: ['id', 'class', 'style', 'data-lucide']
        });
        previewBox.innerHTML = html;
    } else {
        previewBox.innerHTML = `<pre style="white-space:pre-wrap;">${rawContent}</pre>`;
    }

    executeLiveStudioRuntime(previewBox);

    if (window.lucide) {
        window.lucide.createIcons();
    }
}

function executeLiveStudioRuntime(container) {
    // 1. Chart.js Graphs
    const chartCodes = container.querySelectorAll('code.language-chart, code.language-chartjs, code.language-graph');
    chartCodes.forEach((codeEl, i) => {
        const preEl = codeEl.parentElement;
        try {
            const jsonText = codeEl.innerText.trim();
            const data = JSON.parse(jsonText);
            
            const chartDiv = document.createElement('div');
            chartDiv.className = 'interactive-chart-card';
            const canvasId = `studio-canvas-${Date.now()}-${i}`;
            chartDiv.innerHTML = `
                <div class="chart-badge"><i data-lucide="bar-chart-2" style="width:14px;height:14px;"></i> Live Studio Preview Visualization</div>
                <div style="height: 280px; width: 100%;">
                    <canvas id="${canvasId}"></canvas>
                </div>
            `;
            preEl.parentNode.replaceChild(chartDiv, preEl);

            if (window.Chart) {
                setTimeout(() => {
                    const ctx = document.getElementById(canvasId);
                    if (ctx) {
                        new Chart(ctx, {
                            type: data.type || 'bar',
                            data: {
                                labels: data.labels || [],
                                datasets: (data.datasets || []).map(ds => ({
                                    label: ds.label || 'Metric Data',
                                    data: ds.data || [],
                                    backgroundColor: ds.color || '#a855f7',
                                    borderColor: '#ffffff',
                                    borderWidth: 1,
                                    borderRadius: 8
                                }))
                            },
                            options: {
                                responsive: true,
                                maintainAspectRatio: false,
                                plugins: {
                                    legend: { labels: { color: '#e2e8f0', font: { family: 'Inter', weight: 'bold' } } },
                                    title: { display: !!data.title, text: data.title || '', color: '#ffffff', font: { size: 16, family: 'Inter', weight: '800' } }
                                },
                                scales: {
                                    x: { ticks: { color: '#cbd5e1' }, grid: { color: 'rgba(255,255,255,0.06)' } },
                                    y: { ticks: { color: '#cbd5e1' }, grid: { color: 'rgba(255,255,255,0.06)' } }
                                }
                            }
                        });
                    }
                }, 80);
            }
        } catch (err) {
            console.warn('Studio chart parse notice (typing in progress):', err.message);
        }
    });

    // 2. Mermaid Diagrams
    const mermaidCodes = container.querySelectorAll('code.language-mermaid');
    mermaidCodes.forEach((codeEl) => {
        const preEl = codeEl.parentElement;
        const mermaidDiv = document.createElement('div');
        mermaidDiv.className = 'interactive-chart-card';
        mermaidDiv.style.textAlign = 'center';
        mermaidDiv.innerHTML = `
            <div class="chart-badge" style="background:rgba(6,182,212,0.15);color:#22d3ee;border-color:rgba(6,182,212,0.3);"><i data-lucide="git-branch" style="width:14px;height:14px;"></i> Live Architecture Blueprint</div>
            <div class="mermaid" style="margin-top:1rem; overflow-x:auto;">${codeEl.innerText.trim()}</div>
        `;
        preEl.parentNode.replaceChild(mermaidDiv, preEl);
    });
    if (window.mermaid) {
        window.mermaid.initialize({ startOnLoad: false, theme: 'dark' });
        setTimeout(() => window.mermaid.run({ nodes: container.querySelectorAll('.mermaid') }), 120);
    }

    // 3. GitHub Alert Badges
    const blockquotes = container.querySelectorAll('blockquote');
    blockquotes.forEach((bq) => {
        const text = bq.innerText.trim();
        let alertType = '';
        let iconName = 'info';
        let titleText = 'NOTE';

        if (text.startsWith('[!NOTE]')) { alertType = 'note'; iconName = 'info'; titleText = 'Note'; }
        else if (text.startsWith('[!TIP]')) { alertType = 'tip'; iconName = 'lightbulb'; titleText = 'Tip & Best Practice'; }
        else if (text.startsWith('[!IMPORTANT]')) { alertType = 'important'; iconName = 'flame'; titleText = 'Important Architecture Fact'; }
        else if (text.startsWith('[!WARNING]')) { alertType = 'warning'; iconName = 'alert-triangle'; titleText = 'Warning'; }

        if (alertType) {
            const content = text.replace(/\[!.*?\]\n?/, '').trim();
            const div = document.createElement('div');
            div.className = `github-alert ${alertType}`;
            div.innerHTML = `<div class="alert-title"><i data-lucide="${iconName}" style="width:16px;height:16px;"></i> ${titleText}</div><p>${content}</p>`;
            bq.parentNode.replaceChild(div, bq);
        }
    });

    // 4. Syntax Highlighting
    container.querySelectorAll('pre code').forEach(codeEl => {
        if (!codeEl.closest('.interactive-chart-card') && window.hljs) {
            window.hljs.highlightElement(codeEl);
            const preEl = codeEl.parentElement;
            if (!preEl.parentElement || !preEl.parentElement.classList.contains('code-wrapper')) {
                const wrapper = document.createElement('div');
                wrapper.className = 'code-wrapper';
                preEl.parentNode.insertBefore(wrapper, preEl);
                wrapper.appendChild(preEl);
            }
        }
    });

    // 5. Inline Attachment Shortcodes ([ATTACH: filename])
    container.querySelectorAll('p, li, div').forEach(el => {
        if (el.innerHTML.includes('[ATTACH:')) {
            el.innerHTML = el.innerHTML.replace(/\[ATTACH:\s*([^\]]+)\]/g, (match, fname) => {
                const cleanName = fname.trim();
                return `
                    <span style="display:inline-flex; align-items:center; justify-content:space-between; gap:1.5rem; background:rgba(139,92,246,0.15); border:1px solid rgba(139,92,246,0.4); border-radius:12px; padding:0.75rem 1.25rem; margin:0.75rem 0; font-family:'Inter',sans-serif;">
                        <span style="display:flex;align-items:center;gap:0.7rem;font-weight:800;color:white;font-size:0.95rem;">
                            <i data-lucide="archive" style="width:18px;height:18px;color:#c084fc;"></i> ${cleanName} (Staged Artifact)
                        </span>
                        <span style="background:#8b5cf6; color:white; font-weight:700; font-size:0.78rem; padding:0.35rem 0.8rem; border-radius:8px; display:inline-flex; align-items:center; gap:0.4rem;">
                            <i data-lucide="download" style="width:13px;height:13px;"></i> Download Preview
                        </span>
                    </span>
                `;
            });
        }
    });
}

function insertCodeSnippet(type) {
    const textarea = document.getElementById('editor-textarea');
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    let snippet = '';

    if (type === 'barchart') {
        snippet = `\n\`\`\`chart
{
  "type": "bar",
  "title": "Comparative Throughput Benchmark (MB/s)",
  "labels": ["Phryco Vault", "Node Edge", "Legacy CDN"],
  "datasets": [
    {
      "label": "Throughput Velocity (MB/s)",
      "data": [940, 520, 210],
      "color": ["#a855f7", "#06b6d4", "#64748b"]
    }
  ]
}
\`\`\`\n`;
    } else if (type === 'linechart') {
        snippet = `\n\`\`\`chart
{
  "type": "line",
  "title": "Monthly Creator Rewards Pool Distribution (PB)",
  "labels": ["Q1 2026", "Q2 2026", "Q3 2026", "Q4 2026"],
  "datasets": [
    {
      "label": "Rewards Volume (Phrybucks)",
      "data": [250000, 580000, 1240000, 3100000],
      "color": ["#22d3ee"]
    }
  ]
}
\`\`\`\n`;
    } else if (type === 'mermaid') {
        snippet = `\n\`\`\`mermaid
graph TD
    A[Creator Studio Upload] -->|Verify 1000+ Subs| B{Governance Pass}
    B -->|Authorized| C[Compile Interactive Graphs]
    C -->|Broadcast| D(Public Editorial Dispatch)
\`\`\`\n`;
    } else if (type === 'code') {
        snippet = `\n\`\`\`python
# Phryco 2026 SDK - Automated Dispatch Deployment
from phryco_sdk import EditorialStudioClient

studio = EditorialStudioClient()
studio.publish_dispatch(
    title="Automated Pipeline Update",
    category="Platform Updates",
    typography_theme="mono",
    content="Pipeline execution successful."
)
\`\`\`\n`;
    } else if (type === 'alert') {
        snippet = `\n> [!IMPORTANT]\n> Ensure all computational charts and custom typography choices are reviewed in the live preview canvas before publishing.\n`;
    }

    textarea.value = text.substring(0, start) + snippet + text.substring(end);
    textarea.selectionStart = textarea.selectionEnd = start + snippet.length;
    textarea.focus();
    updateLivePreview();
}

function handleFileUpload(event) {
    const fileInput = event.target;
    if (!fileInput.files || !fileInput.files[0]) return;

    const file = fileInput.files[0];
    stagedAttachments.push(file);

    const pill = document.getElementById('attachment-status-pill');
    if (pill) {
        pill.innerHTML = `<i data-lucide="check" style="width:14px;height:14px;display:inline-block;vertical-align:middle;"></i> ${stagedAttachments.length} file(s) staged for attachment`;
        if (window.lucide) window.lucide.createIcons();
    }

    // Insert shortcode into editor at cursor
    const textarea = document.getElementById('editor-textarea');
    if (textarea) {
        const shortcode = `\n\n[ATTACH: ${file.name}]\n`;
        const start = textarea.selectionStart;
        textarea.value = textarea.value.substring(0, start) + shortcode + textarea.value.substring(start);
        textarea.selectionStart = textarea.selectionEnd = start + shortcode.length;
        updateLivePreview();
    }
}

function initPublishingHandler() {
    const btnPublish = document.getElementById('btn-publish');
    if (!btnPublish) return;

    btnPublish.addEventListener('click', async () => {
        const title = document.getElementById('input-title').value.trim();
        const category = document.getElementById('input-category').value.trim();
        const summary = document.getElementById('input-summary').value.trim();
        const cover_image_url = document.getElementById('input-cover').value.trim() || null;
        const typography_theme = document.getElementById('select-typography-theme').value || "sans";
        const content = document.getElementById('editor-textarea').value.trim();

        if (!title || !content || !summary) {
            alert("Please provide a Title, Elevator Summary, and Editorial Content before publishing.");
            return;
        }

        btnPublish.disabled = true;
        btnPublish.innerHTML = `<i data-lucide="loader-2" class="spin" style="width:18px;height:18px;"></i> Publishing to Universe...`;

        try {
            // Retrieve JWT token if logged into Phryco Studio, otherwise proceed (backend tests will handle or raise 401/403)
            const token = localStorage.getItem('phryco_access_token') || localStorage.getItem('token') || '';
            const headers = { 'Content-Type': 'application/json' };
            if (token) headers['Authorization'] = `Bearer ${token}`;

            const response = await fetch(`${API_BASE_URL}/api/blog/posts`, {
                method: 'POST',
                headers: headers,
                body: JSON.stringify({
                    title,
                    category,
                    summary,
                    content,
                    cover_image_url,
                    author_name_override: "Sovereign Creator Studio",
                    typography_theme,
                    is_published: true
                })
            });

            if (!response.ok) {
                const errData = await response.json().catch(() => ({}));
                throw new Error(errData.detail || `Publishing rejected (HTTP ${response.status}). Note: Publishing requires Owner/Admin/Supporter role or 1,000+ subscribers.`);
            }

            const data = await response.json();
            const postId = data.id;
            const postSlug = data.slug;

            // Upload any staged file attachments
            if (stagedAttachments.length > 0 && postId) {
                for (const file of stagedAttachments) {
                    const formData = new FormData();
                    formData.append('file', file);
                    const attachHeaders = token ? { 'Authorization': `Bearer ${token}` } : {};
                    try {
                        await fetch(`${API_BASE_URL}/api/blog/posts/${postId}/attach`, {
                            method: 'POST',
                            headers: attachHeaders,
                            body: formData
                        });
                    } catch (attErr) {
                        console.warn(`Failed to upload attachment ${file.name}:`, attErr);
                    }
                }
            }

            alert("Dispatch published successfully! Redirecting to live interactive reader...");
            window.location.href = `article.html?slug=${encodeURIComponent(postSlug)}`;

        } catch (err) {
            console.error("Error publishing dispatch:", err);
            alert(`Could not publish dispatch: ${err.message}`);
            btnPublish.disabled = false;
            btnPublish.innerHTML = `<i data-lucide="send" style="width:18px;height:18px;"></i> Publish to Universe`;
            if (window.lucide) window.lucide.createIcons();
        }
    });
}
