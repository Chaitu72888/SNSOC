Chart.defaults.color = '#94a3b8';
Chart.defaults.font.family = "'Inter', sans-serif";

let areaChart, doughnutChart;
const socket = io(); // default namespace

function initCharts() {
    const ctxArea = document.getElementById('areaChart').getContext('2d');
    const gradMed = ctxArea.createLinearGradient(0, 0, 0, 300);
    gradMed.addColorStop(0, 'rgba(59, 130, 246, 0.4)');
    gradMed.addColorStop(1, 'rgba(59, 130, 246, 0.0)');

    areaChart = new Chart(ctxArea, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: 'Traffic',
                data: [],
                borderColor: '#3b82f6',
                backgroundColor: gradMed,
                fill: true,
                tension: 0.4,
                borderWidth: 2,
                pointRadius: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: { mode: 'index', intersect: false },
            plugins: { legend: { display: false } },
            scales: {
                y: { grid: { color: 'rgba(255,255,255,0.05)' }, border: { display: false }, min: 0, max: 4 },
                x: { grid: { display: false }, border: { display: false } }
            }
        }
    });

    const ctxDoughnut = document.getElementById('doughnutChart').getContext('2d');
    doughnutChart = new Chart(ctxDoughnut, {
        type: 'doughnut',
        data: {
            labels: ['TCP', 'UDP', 'ICMP', 'Other'],
            datasets: [{
                data: [65, 20, 10, 5],
                backgroundColor: ['#3b82f6', '#10b981', '#eab308', '#94a3b8'],
                borderWidth: 0,
                hoverOffset: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '75%',
            plugins: { legend: { position: 'right', labels: { boxWidth: 12, usePointStyle: true, padding: 20 } } }
        }
    });
}

async function updateDashboardStats() {
    try {
        const response = await fetch('/api/dashboard');
        if (!response.ok) return;
        const res = await response.json();
        const stats = res.data;
        
        const packetsEl = document.getElementById('total_packets_count');
        if (packetsEl) packetsEl.textContent = (stats.total_packets || 0).toLocaleString();

        const topIpsEl = document.getElementById('top_ips_body');
        if (topIpsEl && stats.top_source_ips) {
            topIpsEl.innerHTML = '';
            stats.top_source_ips.forEach(item => {
                topIpsEl.innerHTML += `
                    <div class="ip-item">
                        <span>${item.ip}</span>
                        <span class="ip-pkts">${item.count} pkts</span>
                    </div>
                `;
            });
        }
        
        const levelEl = document.getElementById('dynamic_level');
        if (levelEl && stats.threat_level) {
            const lvl = (typeof stats.threat_level === 'object' ? stats.threat_level.level : stats.threat_level) || 'LOW';
            levelEl.textContent = lvl;
            levelEl.className = 'panel-value';
            levelEl.style.color = '';
            if (lvl === 'CRITICAL') levelEl.classList.add('critical-text');
            else if (lvl === 'HIGH') levelEl.style.color = 'var(--high)';
            else if (lvl === 'MEDIUM') levelEl.style.color = 'var(--med)';
            else levelEl.style.color = 'var(--low)';
        }
        
        if (stats.protocol_distribution) {
            const d = stats.protocol_distribution;
            const tcp = d.TCP || 0, udp = d.UDP || 0, icmp = d.ICMP || 0, other = d.Other || 0;
            const sum = tcp + udp + icmp + other;
            doughnutChart.data.datasets[0].data = sum > 0 ? [tcp, udp, icmp, other] : [65, 20, 10, 5];
            doughnutChart.update();
        }
    } catch (error) {
        console.error("Error fetching stats:", error);
    }
}

let currentPage = 1;
const alertsPerPage = 20;

async function updateAlerts(append = false) {
    try {
        const offset = (currentPage - 1) * alertsPerPage;
        const response = await fetch(`/api/alerts?offset=${offset}&limit=${alertsPerPage}`);
        if (!response.ok) return;
        const res = await response.json();
        const alerts = res.data.alerts;
        const total = res.data.total;
        
        const critEl = document.getElementById('crit_alerts_count');
        if (critEl) critEl.textContent = total || 0;

        const incidentsBody = document.getElementById('incidents_body');
        if (!append) incidentsBody.innerHTML = '';
        
        if (alerts.length > 0) {
            alerts.forEach((alert) => {
                let badgeClass = 'medium';
                if(alert.severity === 'critical') badgeClass = 'critical';
                if(alert.severity === 'high') badgeClass = 'high';

                incidentsBody.innerHTML += `
                    <div class="alert-item ${badgeClass}">
                        <div>
                            <div class="alert-main">⚠️ ${alert.title}: ${alert.message}</div>
                            <div class="alert-sub">Source: ${alert.src_ip} | Time: ${new Date(alert.timestamp * 1000).toLocaleTimeString()}</div>
                        </div>
                        <button class="styled-btn btn-danger" onclick="openBlockModal('${alert.src_ip}')">Block</button>
                    </div>
                `;
            });
        } else if (!append) {
            incidentsBody.innerHTML = '<div style="color:var(--text-muted); padding: 12px;">No recent incidents.</div>';
        }
    } catch (error) {
        console.error("Error fetching alerts:", error);
    }
}

function loadMoreAlerts() {
    currentPage++;
    updateAlerts(true);
}

// Block Modal Logic
let ipToBlock = null;

function openBlockModal(ip) {
    ipToBlock = ip;
    document.getElementById('block-modal-text').innerText = `Block ${ip}? This will drop all packets from this IP.`;
    document.getElementById('block-modal').style.display = 'flex';
}

function closeBlockModal() {
    ipToBlock = null;
    document.getElementById('block-modal').style.display = 'none';
}

async function confirmBlock() {
    if (!ipToBlock) return;
    try {
        const res = await fetch('/api/block', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ip: ipToBlock })
        });
        const data = await res.json();
        if(data.success) {
            closeBlockModal();
            updateAlerts();
        }
    } catch (e) {
        console.error("Error blocking IP:", e);
    }
}

function closeIpModal() {
    document.getElementById('ip-detail-modal').style.display = 'none';
}

async function showIPDetails(ip) {
    const modal = document.getElementById('ip-detail-modal');
    document.getElementById('ip-detail-title').innerText = `IP Details: ${ip}`;
    const body = document.getElementById('ip-detail-body');
    body.innerHTML = 'Loading...';
    modal.style.display = 'flex';
    
    try {
        const res = await fetch('/api/intel/lookup', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ip: ip })
        });
        const resData = await res.json();
        const data = resData.data;
        if (resData.error) {
            body.innerHTML = `<div style="color:var(--crit)">Error: ${resData.error}</div>`;
        } else {
            body.innerHTML = `
                <div style="background:rgba(255,255,255,0.05); padding:16px; border-radius:8px;">
                    <strong>Reputation Score:</strong> ${data.score}<br>
                    <strong>Source:</strong> ${data.source}<br>
                    <strong>Flagged:</strong> ${data.flagged ? 'Yes' : 'No'}
                </div>
            `;
        }
    } catch (e) {
        body.innerHTML = `<div style="color:var(--crit)">Lookup failed.</div>`;
    }
}

async function updatePackets() {
    try {
        const response = await fetch('/api/packets');
        if (!response.ok) return;
        const res = await response.json();
        const packets = res.data;
        
        const packetBody = document.getElementById('packet_body');
        if (packetBody) {
            packetBody.innerHTML = '';
            packets.slice(0, 15).forEach(pkt => {
                const timeStr = new Date(pkt.timestamp * 1000).toLocaleTimeString();
                packetBody.innerHTML += `
                    <tr>
                        <td>${timeStr}</td>
                        <td><a class="ip-link" onclick="showIPDetails('${pkt.src_ip}')">${pkt.src_ip}</a></td>
                        <td>${pkt.dst_ip}:${pkt.dst_port || ''}</td>
                        <td>${pkt.protocol}</td>
                        <td>${pkt.size} B</td>
                    </tr>
                `;
            });
        }
        
        const now = Date.now() / 1000;
        let recentCount = packets.filter(p => now - p.timestamp < 5).length;
        
        if (areaChart) {
            const timeLabel = new Date().toLocaleTimeString();
            areaChart.data.labels.push(timeLabel);
            areaChart.data.datasets[0].data.push(recentCount);
            
            if (areaChart.data.labels.length > 10) {
                areaChart.data.labels.shift();
                areaChart.data.datasets[0].data.shift();
            }
            
            const maxVal = Math.max(...areaChart.data.datasets[0].data) || 4;
            areaChart.options.scales.y.max = maxVal + Math.ceil(maxVal * 0.2);
            areaChart.update('none');
        }
    } catch (error) {
        console.error("Error fetching packets:", error);
    }
}

async function loadRules() {
    try {
        const res = await fetch('/api/ids/rules');
        const rData = await res.json();
        const data = rData.data;
        
        document.getElementById('vol_limit').value = data.threshold.max_packets;
        document.getElementById('vol_window').value = data.threshold.window_seconds;
        
        const portsList = document.getElementById('ports_list');
        portsList.innerHTML = '';
        data.protected_ports.forEach(port => {
            portsList.innerHTML += `
                <div class="rule-item">
                    <span>Port ${port}</span>
                    <button class="styled-btn btn-danger" onclick="removePort(${port})">Remove</button>
                </div>
            `;
        });
    } catch (e) {
        console.error("Error loading rules:", e);
    }
}

async function addPort() {
    const portVal = document.getElementById('new_port').value;
    if(!portVal) return;
    try {
        await fetch('/api/ids/rules/ports', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ port: portVal })
        });
        document.getElementById('new_port').value = '';
        loadRules();
    } catch (e) { console.error(e); }
}

async function removePort(port) {
    try {
        await fetch(`/api/ids/rules/ports/${port}`, { method: 'DELETE' });
        loadRules();
    } catch (e) { console.error(e); }
}

async function updateVolume() {
    const limit = document.getElementById('vol_limit').value;
    const window = document.getElementById('vol_window').value;
    try {
        await fetch('/api/ids/thresholds', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ max_packets: limit, window_seconds: window })
        });
        alert('Volume rules updated successfully.');
    } catch (e) { console.error(e); }
}

async function loadTIConfig() {
    // In our new API we don't have a GET /api/intel/config, we just POST it.
    // So we will leave default html values.
}

async function updateTIConfig() {
    const apiKey = document.getElementById('ti_api_key').value;
    const mockMode = document.getElementById('ti_mock_mode').checked;
    try {
        await fetch('/api/intel/config', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ api_key: apiKey, mock_mode: mockMode })
        });
        alert('Threat Intel config updated successfully.');
    } catch (e) { console.error(e); }
}

async function lookupIP() {
    const ip = document.getElementById('lookup_ip').value;
    if(!ip) return;
    const resDiv = document.getElementById('lookup_result');
    resDiv.innerHTML = 'Checking...';
    resDiv.style.marginTop = '16px';
    try {
        const res = await fetch('/api/intel/lookup', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ip: ip })
        });
        const resData = await res.json();
        const data = resData.data;
        if(resData.error) {
            resDiv.innerHTML = `<div style="color:var(--crit)">Error: ${resData.error}</div>`;
        } else {
            resDiv.innerHTML = `
                <div style="background:rgba(255,255,255,0.05); padding:16px; border-radius:8px;">
                    <strong>Reputation Score:</strong> ${data.score}<br>
                    <strong>Source:</strong> ${data.source}<br>
                    <strong>Flagged:</strong> ${data.flagged ? 'Yes' : 'No'}
                </div>
            `;
        }
    } catch (e) {
        resDiv.innerHTML = `<div style="color:var(--crit)">Lookup failed.</div>`;
    }
}

socket.on('new_alert', (alert) => {
    if (currentPage === 1) updateAlerts(false);
    updateDashboardStats();
});

socket.on('threat_update', (threat) => {
    const levelEl = document.getElementById('dynamic_level');
    if (levelEl) {
        levelEl.textContent = threat.level;
        levelEl.className = 'panel-value';
        levelEl.style.color = '';
        if (threat.level === 'CRITICAL') levelEl.classList.add('critical-text');
        else if (threat.level === 'HIGH') levelEl.style.color = 'var(--high)';
        else if (threat.level === 'MEDIUM') levelEl.style.color = 'var(--med)';
        else if (threat.level === 'LOW') levelEl.style.color = 'var(--low)';
    }
});

socket.on('stats_update', (stats) => {
    const packetsEl = document.getElementById('total_packets_count');
    if (packetsEl) packetsEl.textContent = (stats.total_packets || 0).toLocaleString();
    
    if (stats.protocol_distribution) {
        const d = stats.protocol_distribution;
        doughnutChart.data.datasets[0].data = [d.TCP || 0, d.UDP || 0, d.ICMP || 0, d.Other || 0];
        doughnutChart.update();
    }
});

async function updateTelemetryUI() {
    try {
        const res = await fetch('/api/telemetry/consumption');
        if (!res.ok) return;
        const json = await res.json();
        const data = json.data;

        // Update Threat Intel Data Consumption Pill & Bar
        const monthlyPill = document.getElementById('ti_monthly_usage_pill');
        if (monthlyPill) monthlyPill.textContent = `${data.monthly_usage_kb} KB used this month`;

        const ratioText = document.getElementById('ti_ratio_text');
        if (ratioText) ratioText.textContent = `Android: ${data.android_pct}% | Web: ${data.web_pct}%`;

        const androidBar = document.getElementById('ti_android_bar');
        if (androidBar) {
            androidBar.style.width = `${data.android_pct}%`;
            androidBar.title = `Android App: ${data.android_weekly_mb} MB`;
        }

        const webBar = document.getElementById('ti_web_bar');
        if (webBar) {
            webBar.style.width = `${data.web_pct}%`;
            webBar.title = `Web Dashboard: ${data.web_weekly_mb} MB`;
        }

        const androidLegend = document.getElementById('ti_android_legend');
        if (androidLegend) androidLegend.innerHTML = `<span style="width: 10px; height: 10px; border-radius: 50%; background: var(--accent-blue); display: inline-block;"></span> 🤖 Android App (${data.android_weekly_mb} MB)`;

        const webLegend = document.getElementById('ti_web_legend');
        if (webLegend) webLegend.innerHTML = `<span style="width: 10px; height: 10px; border-radius: 50%; background: #8b5cf6; display: inline-block;"></span> 🖥 Web Dashboard (${data.web_weekly_mb} MB)`;

        // Update Settings Tab Summary
        const setAndroidMb = document.getElementById('settings_android_mb');
        if (setAndroidMb) setAndroidMb.textContent = `${data.android_weekly_mb} MB`;

        const setWebMb = document.getElementById('settings_web_mb');
        if (setWebMb) setWebMb.textContent = `${data.web_weekly_mb} MB`;

        const setAndroidRatioBar = document.getElementById('settings_android_ratio_bar');
        if (setAndroidRatioBar) {
            setAndroidRatioBar.style.width = `${data.android_pct}%`;
            setAndroidRatioBar.title = `Android App: ${data.android_pct}%`;
        }

        const setWebRatioBar = document.getElementById('settings_web_ratio_bar');
        if (setWebRatioBar) {
            setWebRatioBar.style.width = `${data.web_pct}%`;
            setWebRatioBar.title = `Web Dashboard: ${data.web_pct}%`;
        }

    } catch (e) {
        console.error("Telemetry fetch error:", e);
    }
}

async function fetchSyncStatus() {
    try {
        const res = await fetch('/api/telemetry/sync', { headers: { 'X-Platform': 'Web Dashboard' } });
        if (!res.ok) return;
        const json = await res.json();
        const data = json.data;

        const timeEl = document.getElementById('sync_last_time');
        if (timeEl) {
            const diffSec = Math.floor(Date.now() / 1000 - data.last_sync);
            timeEl.textContent = diffSec < 60 ? 'Just now' : `${Math.floor(diffSec / 60)} mins ago`;
        }

        const transEl = document.getElementById('sync_last_bytes');
        if (transEl) transEl.textContent = `${(data.last_transferred_bytes / 1024).toFixed(1)} KB`;
    } catch (e) {
        console.error("Sync fetch error:", e);
    }
}

async function triggerManualSync() {
    try {
        const res = await fetch('/api/telemetry/sync', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'X-Platform': 'Web Dashboard' },
            body: JSON.stringify({ platform: 'Web Dashboard', bytes_transferred: Math.floor(Math.random() * 15000 + 10000) })
        });
        if (res.ok) {
            fetchSyncStatus();
            alert('Web Platform Sync Completed Successfully!');
        }
    } catch (e) { console.error("Manual sync error:", e); }
}

document.addEventListener('DOMContentLoaded', () => {
    initCharts();
    updateAlerts();
    updateDashboardStats();
    loadRules();
    updatePackets();
    updateTelemetryUI();
    fetchSyncStatus();

    setInterval(() => {
        updatePackets();
        updateTelemetryUI();
    }, 5000);
});

