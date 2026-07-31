import { apiFetch } from '../../api/client.js';

let campaignId = null;
let currentAd = null;
let trendChartInstance = null;
let countryChartInstance = null;
let deviceChartInstance = null;

document.addEventListener('DOMContentLoaded', async () => {
    const urlParams = new URLSearchParams(window.location.search);
    campaignId = urlParams.get('id');
    
    if (!campaignId) {
        window.location.href = 'ads.html';
        return;
    }
    
    await loadCampaignDetails();
    await loadCampaignMetrics();
    
    document.getElementById('targeting-form').addEventListener('submit', handleTargetingSubmit);
    document.getElementById('toggle-status-btn').addEventListener('click', handleToggleStatus);
});

async function loadCampaignDetails() {
    try {
        currentAd = await apiFetch(`/api/ads/me/${campaignId}`);
        
        document.getElementById('campaign-title').textContent = currentAd.title;
        
        // Setup Progress Bar
        const targetViews = currentAd.target_audience * currentAd.target_times;
        const progress = targetViews > 0 ? (currentAd.times_shown / targetViews) * 100 : 0;
        document.getElementById('progress-text').textContent = `${currentAd.times_shown.toLocaleString()} / ${targetViews.toLocaleString()} Views`;
        document.getElementById('progress-bar').style.width = `${Math.min(progress, 100)}%`;
        
        // Setup Status Badge
        updateStatusBadge(currentAd.is_active, currentAd.times_shown >= targetViews);
        
        // Populate Form
        document.getElementById('target-country').value = currentAd.target_country || '';
        document.getElementById('target-device').value = currentAd.target_device || '';
        
        const isSkippableSelect = document.getElementById('is-skippable');
        const skipSecondsGroup = document.getElementById('skip-seconds-group');
        const skipSecondsInput = document.getElementById('skip-after-seconds');
        
        isSkippableSelect.value = currentAd.is_skippable ? "true" : "false";
        skipSecondsInput.value = currentAd.skip_after_seconds || 5;
        
        if (!currentAd.is_skippable) {
            skipSecondsGroup.style.display = 'none';
        }
        
        isSkippableSelect.addEventListener('change', (e) => {
            if (e.target.value === "true") {
                skipSecondsGroup.style.display = 'block';
            } else {
                skipSecondsGroup.style.display = 'none';
            }
        });
        
    } catch (error) {
        console.error('Error loading campaign details:', error);
        alert('Failed to load campaign details.');
    }
}

function updateStatusBadge(isActive, isCompleted) {
    const btn = document.getElementById('toggle-status-btn');
    btn.style.display = 'inline-flex';
    
    if (isCompleted) {
        btn.className = 'status-badge active';
        btn.innerHTML = '<i data-lucide="check-circle" style="width:16px;height:16px;"></i> Completed';
        btn.disabled = true;
        btn.style.cursor = 'not-allowed';
    } else if (isActive) {
        btn.className = 'status-badge active';
        btn.innerHTML = '<i data-lucide="pause" style="width:16px;height:16px;"></i> Pause Campaign';
    } else {
        btn.className = 'status-badge inactive';
        btn.innerHTML = '<i data-lucide="play" style="width:16px;height:16px;"></i> Resume Campaign';
    }
    
    if (typeof lucide !== 'undefined') lucide.createIcons();
}

async function handleToggleStatus() {
    if (!currentAd) return;
    
    const newStatus = !currentAd.is_active;
    try {
        const updatedAd = await apiFetch(`/api/ads/me/${campaignId}`, {
            method: 'PUT',
            body: { is_active: newStatus }
        });
        
        currentAd = updatedAd;
        updateStatusBadge(currentAd.is_active, false);
    } catch (error) {
        console.error('Failed to toggle status:', error);
        alert('Failed to update campaign status.');
    }
}

async function handleTargetingSubmit(e) {
    e.preventDefault();
    
    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.textContent = 'Saving...';
    submitBtn.disabled = true;
    
    const data = {
        target_country: document.getElementById('target-country').value || null,
        target_device: document.getElementById('target-device').value || null,
        is_skippable: document.getElementById('is-skippable').value === "true",
        skip_after_seconds: parseInt(document.getElementById('skip-after-seconds').value)
    };
    
    // UI Validation for Skippable
    if (!data.is_skippable) {
        data.skip_after_seconds = null;
    }
    
    try {
        const updatedAd = await apiFetch(`/api/ads/me/${campaignId}`, {
            method: 'PUT',
            body: data
        });
        currentAd = updatedAd;
        
        // Show success
        submitBtn.textContent = 'Saved!';
        submitBtn.style.background = '#2ecc71';
        setTimeout(() => {
            submitBtn.textContent = originalText;
            submitBtn.style.background = '';
            submitBtn.disabled = false;
        }, 2000);
        
    } catch (error) {
        console.error('Failed to update targeting:', error);
        alert(error.message || 'Failed to save targeting settings.');
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
    }
}

async function loadCampaignMetrics() {
    try {
        const metrics = await apiFetch(`/api/ads/me/${campaignId}/metrics`);
        renderTrendChart(metrics.time_series);
        renderCountryChart(metrics.countries);
        renderDeviceChart(metrics.devices);
    } catch (error) {
        console.error('Error loading metrics:', error);
    }
}

function renderTrendChart(timeSeriesData) {
    const ctx = document.getElementById('trendChart').getContext('2d');
    
    // Ensure we have 7 days of data by filling gaps
    const labels = [];
    const data = [];
    
    // Process data to match Chart.js format
    timeSeriesData.forEach(item => {
        labels.push(item.date);
        data.push(item.views);
    });

    if (trendChartInstance) trendChartInstance.destroy();
    
    trendChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Views',
                data: data,
                borderColor: '#a855f7',
                backgroundColor: 'rgba(168, 85, 247, 0.1)',
                borderWidth: 2,
                fill: true,
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: { color: 'rgba(255, 255, 255, 0.05)' },
                    ticks: { color: '#9ca3af' }
                },
                x: {
                    grid: { display: false },
                    ticks: { color: '#9ca3af' }
                }
            }
        }
    });
}

function renderCountryChart(countryData) {
    const ctx = document.getElementById('countryChart').getContext('2d');
    
    const labels = countryData.map(item => item.country);
    const data = countryData.map(item => item.views);
    
    if (countryChartInstance) countryChartInstance.destroy();
    
    countryChartInstance = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: [
                    '#a855f7', '#ec4899', '#3b82f6', '#10b981', '#f59e0b', '#ef4444'
                ],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'right',
                    labels: { color: '#e5e7eb' }
                }
            }
        }
    });
}

function renderDeviceChart(deviceData) {
    const ctx = document.getElementById('deviceChart').getContext('2d');
    
    const labels = deviceData.map(item => item.device);
    const data = deviceData.map(item => item.views);
    
    if (deviceChartInstance) deviceChartInstance.destroy();
    
    deviceChartInstance = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: [
                    '#3b82f6', '#ec4899', '#a855f7'
                ],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: { color: '#e5e7eb' }
                }
            }
        }
    });
}
