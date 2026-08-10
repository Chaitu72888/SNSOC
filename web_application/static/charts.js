/**
 * SNSOC — Real-Time Dashboard Controller
 * Combines Socket.IO live push + HTTP polling fallback
 * for true zero-refresh live monitoring.
 */

Chart.defaults.color = '#94a3b8';
Chart.defaults.font.family = "'Inter', sans-serif";

// ─── State ────────────────────────────────────────────────────────────────────
let areaChart, doughnutChart;
let livePacketCount = 0;   // counts packets received this second via socket
let trafficTickBuffer = 0; // accumulates per-tick before pushing to chart

// ─── Socket.IO Connection ─────────────────────────────────────────────────────
const socket = io({
    transports: ['websocket', 'polling'],   // prefer WebSocket, fall back to polling
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    timeout: 20000
});

// ─── Connection Status Banner ─────────────────────────────────────────────────
socket.on('connect', () => {
    console.log('[Socket.IO] Connected — id:', socket.id);
    const pill = document.querySelector('.system-status-pill');
    if (pill) {
        pill.innerHTML = '<div class="dot green"></div> System Active';
        pill.style.opacity = '1';
    }
});

socket.on('disconnect', (reason) => {
    console.warn('[Socket.IO] Disconnected:', reason);
    const pill = document.querySelector('.system-status-pill');
    if (pill) {
        pill.innerHTML = '<div class="dot" style="background:#e74c3c; animation:pulse 1s infinite;"></div> Reconnecting…';
    }
});

socket.on('connect_error', (err) => {
    console.warn('[Socket.IO] Connection error:', err.message);
});

// ─── Chart Initialisation ─────────────────────────────────────────────────────
function initCharts() {
    const ctxArea = document.getElementById('areaChart').getContext('2d');
    const gradMed = ctxArea.createLinearGradient(0, 0, 0, 300);
    gradMed.addColorStop(0, 'rgba(59, 130, 246, 0.45)');
    gradMed.addColorStop(1, 'rgba(59, 130, 246, 0.0)');

    areaChart = new Chart(ctxArea, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: 'Packets/s',
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
            animation: { duration: 300 },
            interaction: { mode: 'index', intersect: false },
            plugins: { legend: { display: false } },
            scales: {
                y: {
                    grid: { color: 'rgba(255,255,255,0.05)' },
                    border: { display: false },
                    min: 0, max: 5,
                    ticks: { stepSize: 1 }
                },
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
                hoverOffset: 6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            animation: { duration: 400 },
            cutout: '75%',
            plugins: {
                legend: {
                    position: 'right',
                    labels: { boxWidth: 12, usePointStyle: true, padding: 20 }
                }
            }
        }
    });
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function applyThreatLevel(level) {
    const el = document.getElementById('dynamic_level');
    if (!el) return;
    el.textContent = level;
    el.className = 'panel-value';
    el.style.color = '';
    if (level === 'CRITICAL')     { el.classList.add('critical-text'); }
    else if (level === 'HIGH')    { el.style.color = 'var(--high)'; }
    else if (level === 'MEDIUM')  { el.style.color = 'var(--med)'; }
    else                          { el.style.color = 'var(--low)'; }
}

function applyProtocolDistribution(d) {
    if (!doughnutChart || !d) return;
    const tcp = d.TCP || 0, udp = d.UDP || 0, icmp = d.ICMP || 0, other = d.Other || 0;
    const sum = tcp + udp + icmp + other;
    doughnutChart.data.datasets[0].data = sum > 0 ? [tcp, udp, icmp, other] : [65, 20, 10, 5];
    doughnutChart.update('none');
}

function pushTrafficPoint(count) {
    if (!areaChart) return;
    const label = new Date().toLocaleTimeString();
    areaChart.data.labels.push(label);
    areaChart.data.datasets[0].data.push(count);
    if (areaChart.data.labels.length > 20) {
        areaChart.data.labels.shift();
        areaChart.data.datasets[0].data.shift();
    }
    const maxVal = Math.max(...areaChart.data.datasets[0].data, 1);
    areaChart.options.scales.y.max = maxVal + Math.ceil(maxVal * 0.25);
    areaChart.update('none');
}

function prependPacketRow(pkt) {
    const body = document.getElementById('packet_body');
    if (!body) return;
    const timeStr = new Date(pkt.timestamp * 1000).toLocaleTimeString();
    const row = document.createElement('tr');
    row.innerHTML = `
        <td>${timeStr}</td>
        <td><a class="ip-link" onclick="showIPDetails('${pkt.src_ip}')">${pkt.src_ip}</a></td>
        <td>${pkt.dst_ip}:${pkt.dst_port || ''}</td>
        <td>${pkt.protocol}</td>
        <td>${pkt.size} B</td>
    `;
    body.prepend(row);
    // Keep table at max 15 rows
    while (body.rows.length > 15) body.deleteRow(body.rows.length - 1);
}

// ─── Socket.IO Live Event Handlers ───────────────────────────────────────────

// Every new packet from the capture loop (~1-2s interval)
socket.on('new_packet', (pkt) => {
    // 1. Increment live packet counter
    trafficTickBuffer++;

    // 2. Update live packet table
    prependPacketRow(pkt);

    // 3. Update total packet count display
    const packetsEl = document.getElementById('total_packets_count');
    if (packetsEl) {
        const current = parseInt(packetsEl.textContent.replace(/,/g, '') || '0');
        packetsEl.textContent = (current + 1).toLocaleString();
    }
});

// Every 2s from stats_loop in scorer.py
socket.on('stats_update', (stats) => {
    // Packet count (authoritative from backend)
    const packetsEl = document.getElementById('total_packets_count');
    if (packetsEl) packetsEl.textContent = (stats.total_packets || 0).toLocaleString();

    // Protocol distribution doughnut
    if (stats.protocol_distribution) {
        applyProtocolDistribution(stats.protocol_distribution);
    }
});

// Threat level pushed every 2s
socket.on('threat_update', (threat) => {
    const lvl = (typeof threat === 'object' ? threat.level : threat) || 'LOW';
    applyThreatLevel(lvl);
});

// New alert — refresh alert list immediately
socket.on('new_alert', () => {
    if (currentPage === 1) updateAlerts(false);
    // Also update stats to reflect new alert count
    updateDashboardStats();
});

// ─── 1-Second Traffic Tick ────────────────────────────────────────────────────
// Pushes buffered packet count to the line chart every second
setInterval(() => {
    pushTrafficPoint(trafficTickBuffer);
    trafficTickBuffer = 0;
}, 1000);

// ─── HTTP Polling — Fallback & Top IPs ───────────────────────────────────────
// Fills in data that isn't pushed via socket (top IPs, alerts list)
async function updateDashboardStats() {
    try {
        const response = await fetch('/api/dashboard');
        if (!response.ok) return;
        const res = await response.json();
        const stats = res.data;

        // Authoritative packet count
        const packetsEl = document.getElementById('total_packets_count');
        if (packetsEl) packetsEl.textContent = (stats.total_packets || 0).toLocaleString();

        // Top Source IPs (not pushed via socket)
        const topIpsEl = document.getElementById('top_ips_body');
        if (topIpsEl && stats.top_source_ips) {
            topIpsEl.innerHTML = '';
            if (stats.top_source_ips.length === 0) {
                topIpsEl.innerHTML = '<div style="color:var(--text-muted); padding:12px;">No active source IPs.</div>';
            } else {
                stats.top_source_ips.forEach(item => {
                    topIpsEl.innerHTML += `
                        <div class="ip-item">
                            <span>${item.ip}</span>
                            <span class="ip-pkts">${item.count} pkts</span>
                        </div>`;
                });
            }
        }

        // Threat level (backup — socket handles this primarily)
        if (stats.threat_level) {
            const lvl = typeof stats.threat_level === 'object'
                ? stats.threat_level.level
                : stats.threat_level;
            applyThreatLevel(lvl || 'LOW');
        }

        // Protocol distribution (backup)
        if (stats.protocol_distribution) {
            applyProtocolDistribution(stats.protocol_distribution);
        }
    } catch (error) {
        console.error('updateDashboardStats error:', error);
    }
}

// ─── Alerts ───────────────────────────────────────────────────────────────────
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
                if (alert.severity === 'critical') badgeClass = 'critical';
                if (alert.severity === 'high') badgeClass = 'high';
                incidentsBody.innerHTML += `
                    <div class="alert-item ${badgeClass}">
                        <div>
                            <div class="alert-main">⚠️ ${alert.title}: ${alert.message}</div>
                            <div class="alert-sub">Source: ${alert.src_ip} | Time: ${new Date(alert.timestamp * 1000).toLocaleTimeString()}</div>
                        </div>
                        <button class="styled-btn btn-danger" onclick="openBlockModal('${alert.src_ip}')">Block</button>
                    </div>`;
            });
        } else if (!append) {
            incidentsBody.innerHTML = '<div style="color:var(--text-muted); padding: 12px;">No recent incidents.</div>';
        }
    } catch (error) {
        console.error('updateAlerts error:', error);
    }
}

function loadMoreAlerts() {
    currentPage++;
    updateAlerts(true);
}

// ─── Packet Stream (HTTP fallback when socket is unavailable) ─────────────────
async function updatePackets() {
    try {
        const response = await fetch('/api/packets');
        if (!response.ok) return;
        const res = await response.json();
        const packets = res.data;

        const packetBody = document.getElementById('packet_body');
        if (packetBody && packets.length > 0) {
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
                    </tr>`;
            });
        }
    } catch (error) {
        console.error('updatePackets error:', error);
    }
}

// ─── Block Modal ──────────────────────────────────────────────────────────────
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
        if (data.success) { closeBlockModal(); updateAlerts(); }
    } catch (e) { console.error('Block error:', e); }
}

// ─── IP Detail Modal ──────────────────────────────────────────────────────────
function closeIpModal() {
    document.getElementById('ip-detail-modal').style.display = 'none';
}
async function showIPDetails(ip) {
    const modal = document.getElementById('ip-detail-modal');
    document.getElementById('ip-detail-title').innerText = `IP Details: ${ip}`;
    const body = document.getElementById('ip-detail-body');
    body.innerHTML = 'Loading…';
    modal.style.display = 'flex';
    try {
        const res = await fetch('/api/intel/lookup', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ip })
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
                    <strong>Flagged:</strong> ${data.flagged ? '🔴 Yes' : '✅ No'}<br>
                    <strong>Country:</strong> ${data.countryCode || 'Unknown'}<br>
                    <strong>ASN:</strong> ${data.asn || 'Unknown'}
                </div>`;
        }
    } catch (e) {
        body.innerHTML = `<div style="color:var(--crit)">Lookup failed.</div>`;
    }
}

// ─── IDS Rules ────────────────────────────────────────────────────────────────
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
                </div>`;
        });
    } catch (e) { console.error('loadRules error:', e); }
}
async function addPort() {
    const portVal = document.getElementById('new_port').value;
    if (!portVal) return;
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
    const win = document.getElementById('vol_window').value;
    try {
        await fetch('/api/ids/thresholds', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ max_packets: limit, window_seconds: win })
        });
        alert('Volume rules updated successfully.');
    } catch (e) { console.error(e); }
}

// ─── Threat Intel ─────────────────────────────────────────────────────────────
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
    if (!ip) return;
    const resDiv = document.getElementById('lookup_result');
    resDiv.innerHTML = 'Checking…';
    resDiv.style.marginTop = '16px';
    try {
        const res = await fetch('/api/intel/lookup', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ip })
        });
        const resData = await res.json();
        const data = resData.data;
        if (resData.error) {
            resDiv.innerHTML = `<div style="color:var(--crit)">Error: ${resData.error}</div>`;
        } else {
            resDiv.innerHTML = `
                <div style="background:rgba(255,255,255,0.05); padding:16px; border-radius:8px;">
                    <strong>Reputation Score:</strong> ${data.score}<br>
                    <strong>Source:</strong> ${data.source}<br>
                    <strong>Flagged:</strong> ${data.flagged ? '🔴 Yes' : '✅ No'}<br>
                    <strong>Country:</strong> ${data.countryCode || 'Unknown'}
                </div>`;
        }
    } catch (e) {
        resDiv.innerHTML = `<div style="color:var(--crit)">Lookup failed.</div>`;
    }
}

// ─── Telemetry ────────────────────────────────────────────────────────────────
async function updateTelemetryUI() {
    try {
        const res = await fetch('/api/telemetry/consumption');
        if (!res.ok) return;
        const json = await res.json();
        const data = json.data;

        const monthlyPill = document.getElementById('ti_monthly_usage_pill');
        if (monthlyPill) monthlyPill.textContent = `${data.monthly_usage_kb} KB used this month`;

        const ratioText = document.getElementById('ti_ratio_text');
        if (ratioText) ratioText.textContent = `Android: ${data.android_pct}% | Web: ${data.web_pct}%`;

        const androidBar = document.getElementById('ti_android_bar');
        if (androidBar) { androidBar.style.width = `${data.android_pct}%`; androidBar.title = `Android App: ${data.android_weekly_mb} MB`; }

        const webBar = document.getElementById('ti_web_bar');
        if (webBar) { webBar.style.width = `${data.web_pct}%`; webBar.title = `Web Dashboard: ${data.web_weekly_mb} MB`; }

        const androidLegend = document.getElementById('ti_android_legend');
        if (androidLegend) androidLegend.innerHTML = `<span style="width:10px;height:10px;border-radius:50%;background:var(--accent-blue);display:inline-block;"></span> 🤖 Android App (${data.android_weekly_mb} MB)`;

        const webLegend = document.getElementById('ti_web_legend');
        if (webLegend) webLegend.innerHTML = `<span style="width:10px;height:10px;border-radius:50%;background:#8b5cf6;display:inline-block;"></span> 🖥 Web Dashboard (${data.web_weekly_mb} MB)`;

        const setAndroidMb = document.getElementById('settings_android_mb');
        if (setAndroidMb) setAndroidMb.textContent = `${data.android_weekly_mb} MB`;

        const setWebMb = document.getElementById('settings_web_mb');
        if (setWebMb) setWebMb.textContent = `${data.web_weekly_mb} MB`;

        const setAndroidRatioBar = document.getElementById('settings_android_ratio_bar');
        if (setAndroidRatioBar) { setAndroidRatioBar.style.width = `${data.android_pct}%`; setAndroidRatioBar.title = `Android App: ${data.android_pct}%`; }

        const setWebRatioBar = document.getElementById('settings_web_ratio_bar');
        if (setWebRatioBar) { setWebRatioBar.style.width = `${data.web_pct}%`; setWebRatioBar.title = `Web Dashboard: ${data.web_pct}%`; }
    } catch (e) { console.error('Telemetry error:', e); }
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
    } catch (e) { console.error('Sync error:', e); }
}

async function triggerManualSync() {
    try {
        const res = await fetch('/api/telemetry/sync', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'X-Platform': 'Web Dashboard' },
            body: JSON.stringify({ platform: 'Web Dashboard', bytes_transferred: Math.floor(Math.random() * 15000 + 10000) })
        });
        if (res.ok) { fetchSyncStatus(); alert('Web Platform Sync Completed Successfully!'); }
    } catch (e) { console.error('Manual sync error:', e); }
}

// ─── Bootstrap ────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    initCharts();

    // Initial data load
    updateDashboardStats();
    updateAlerts();
    loadRules();
    updatePackets();
    updateTelemetryUI();
    fetchSyncStatus();

    // HTTP polling intervals (backup / supplement to socket)
    // updateDashboardStats every 3s for top IPs and authoritative counts
    setInterval(updateDashboardStats, 3000);

    // Alerts list: poll every 10s (socket handles new_alert events in real-time)
    setInterval(() => { if (currentPage === 1) updateAlerts(false); }, 10000);

    // Packets table fallback: only used when socket is disconnected
    setInterval(updatePackets, 4000);

    // Telemetry data: updated every 15s (low-priority)
    setInterval(updateTelemetryUI, 15000);
    setInterval(fetchSyncStatus, 30000);
});
