import { apiFetch } from '../../../js/api/client.js';
import { checkAndPromptLegalReagreement } from '../../../js/components/legal_reagreement_modal.js';

document.addEventListener('DOMContentLoaded', async () => {
    // 1. Verify OWNER Role Access
    try {
        const user = await apiFetch('/api/users/me');
        if (!user || (user.role !== 'OWNER' && user.role !== 'ADMIN')) {
            alert("ACCESS DENIED: The Secret Testing Lab is restricted to the platform OWNER.");
            window.location.href = '/';
            return;
        }
    } catch (err) {
        alert("Authentication required to access OWNER Secret Testing Lab.");
        window.location.href = '/pages/login/';
        return;
    }

    // 2. Test 1 Handler: Preview Legal Re-Agreement Modal
    const btnPreview = document.getElementById('btn-test-preview-reagreement');
    if (btnPreview) {
        btnPreview.addEventListener('click', () => {
            checkAndPromptLegalReagreement({ legal_reagreement_required: true });
        });
    }
});
