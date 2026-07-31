export function showToast(message, type = 'info') {
    let container = document.getElementById('toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        document.body.appendChild(container);
    }
    
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    let icon = 'info';
    if (type === 'success') icon = 'check-circle';
    if (type === 'error') icon = 'alert-circle';
    
    toast.innerHTML = `
        <i data-lucide="${icon}"></i>
        <span>${message}</span>
    `;
    
    container.appendChild(toast);
    
    if (window.lucide) {
        window.lucide.createIcons({ root: toast });
    }
    
    // Auto remove after 3 seconds
    setTimeout(() => {
        toast.classList.add('fadeOut');
        toast.addEventListener('animationend', () => {
            toast.remove();
        });
    }, 3000);
}
