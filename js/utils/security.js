export function escapeHTML(str) {
    if (!str) return '';
    return String(str).replace(/[&<>'"]/g, 
        tag => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            "'": '&#39;',
            '"': '&quot;'
        }[tag] || tag)
    );
}

export function renderCreatorBadges(item, includeSupporter = false) {
    if (!item) return '';
    let html = '';
    if (item.owner_is_trusted_creator || item.is_trusted_creator) {
        html += `<span title="Trusted Creator" style="display:inline-flex; align-items:center; margin-left:4px; color:#10b981; font-size:0.95em; filter:drop-shadow(0 0 4px rgba(16,185,129,0.4)); vertical-align:middle;" aria-label="Trusted Creator">★</span>`;
    }
    if (item.owner_halal_verified || item.halal_verified) {
        html += `<span title="Halal Verified" style="display:inline-flex; align-items:center; margin-left:4px; color:#3b82f6; font-size:0.95em; filter:drop-shadow(0 0 4px rgba(59,130,246,0.4)); vertical-align:middle;" aria-label="Halal Verified">🛡️</span>`;
    }
    if (includeSupporter && (item.role === 'SUPPORTER' || item.user_role === 'SUPPORTER' || item.owner_role === 'SUPPORTER')) {
        html += `<span title="Phryco Supporter" style="display:inline-flex; align-items:center; margin-left:6px; background:linear-gradient(135deg, rgba(236,72,153,0.15), rgba(168,85,247,0.15)); color:#ec4899; border:1px solid rgba(236,72,153,0.4); font-size:0.75rem; font-weight:700; padding:1px 8px; border-radius:9999px; filter:drop-shadow(0 0 6px rgba(236,72,153,0.35)); vertical-align:middle; letter-spacing: 0.5px;" aria-label="Phryco Supporter">💖 SUPPORTER</span>`;
    }
    return html;
}
