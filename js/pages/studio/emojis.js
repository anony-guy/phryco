import { API_BASE_URL } from '../../utils/config.js';
import { apiFetch } from '../../api/client.js';

const packsContainer = document.getElementById('packs-container');

async function loadPacks() {
    try {
        const packs = await apiFetch('/api/emojis/my-packs');
        packsContainer.innerHTML = '';
        
        if (packs.length === 0) {
            packsContainer.innerHTML = '<p style="color: var(--text-secondary);">You haven\'t created any emoji packs yet.</p>';
            return;
        }
        
        packs.forEach(pack => {
            const packDiv = document.createElement('div');
            packDiv.style = 'background: var(--bg-secondary); border: 1px solid var(--border-color); border-radius: var(--radius-lg); padding: 1.5rem;';
            
            let emojisHtml = '';
            pack.emojis.forEach(e => {
                emojisHtml += `
                    <div style="background: rgba(0,0,0,0.2); padding: 0.5rem; border-radius: var(--radius-md); text-align: center; border: 1px solid var(--border-color);">
                        <img src="${API_BASE_URL}${e.image_url}" style="width: 32px; height: 32px; object-fit: contain; margin-bottom: 0.25rem;">
                        <div style="font-size: 0.75rem; color: var(--text-secondary);">:${e.name}:</div>
                    </div>
                `;
            });
            
            packDiv.innerHTML = `
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; border-bottom: 1px solid var(--border-color); padding-bottom: 1rem;">
                    <h3 style="margin: 0;">${pack.name} <span style="font-size: 0.875rem; color: var(--text-secondary); font-weight: normal;">(${pack.emojis.length}/50 emojis)</span></h3>
                    ${pack.emojis.length < 50 ? `<button class="btn-primary upload-btn" data-pack-id="${pack.id}" style="padding: 0.5rem 1rem; font-size: 0.875rem;">Upload Emoji</button>` : '<span style="color: #ef4444; font-size: 0.875rem;">Pack Full</span>'}
                </div>
                <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(100px, 1fr)); gap: 1rem;">
                    ${emojisHtml || '<p style="color: var(--text-secondary); grid-column: 1/-1;">No emojis in this pack yet.</p>'}
                </div>
            `;
            packsContainer.appendChild(packDiv);
        });
        
        document.querySelectorAll('.upload-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.getElementById('modal-pack-id').value = e.target.dataset.packId;
                document.getElementById('upload-emoji-modal').style.display = 'flex';
                document.getElementById('emoji-msg').textContent = '';
                document.getElementById('upload-emoji-form').reset();
            });
        });
        
    } catch (e) {
        packsContainer.innerHTML = `<p style="color: #ef4444;">Failed to load packs: ${e.message}</p>`;
    }
}

document.getElementById('create-pack-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = e.target.querySelector('button');
    const msg = document.getElementById('pack-msg');
    btn.disabled = true;
    
    try {
        const formData = new FormData();
        formData.append('name', document.getElementById('pack-name').value);
        
        await apiFetch('/api/emojis/studio/pack', {
            method: 'POST',
            body: formData
        });
        
        msg.textContent = 'Pack created successfully!';
        msg.style.color = '#10b981';
        e.target.reset();
        loadPacks();
    } catch (err) {
        msg.textContent = err.message;
        msg.style.color = '#ef4444';
    } finally {
        btn.disabled = false;
    }
});

document.getElementById('cancel-upload').addEventListener('click', () => {
    document.getElementById('upload-emoji-modal').style.display = 'none';
});

document.getElementById('upload-emoji-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = e.target.querySelector('button[type="submit"]');
    const msg = document.getElementById('emoji-msg');
    const packId = document.getElementById('modal-pack-id').value;
    btn.disabled = true;
    
    try {
        const formData = new FormData();
        formData.append('name', document.getElementById('emoji-name').value);
        formData.append('file', document.getElementById('emoji-file').files[0]);
        
        await apiFetch(`/api/emojis/studio/pack/${packId}/emoji`, {
            method: 'POST',
            body: formData
        });
        
        msg.textContent = 'Emoji uploaded successfully!';
        msg.style.color = '#10b981';
        setTimeout(() => {
            document.getElementById('upload-emoji-modal').style.display = 'none';
            loadPacks();
        }, 1000);
    } catch (err) {
        msg.textContent = err.message;
        msg.style.color = '#ef4444';
    } finally {
        btn.disabled = false;
    }
});

document.addEventListener('DOMContentLoaded', loadPacks);
