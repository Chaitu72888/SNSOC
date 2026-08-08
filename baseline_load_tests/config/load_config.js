const path = require('path');

module.exports = {
  targetUrl: process.env.TARGET_URL || 'http://127.0.0.1:5000',
  virtualUsers: parseInt(process.env.VIRTUAL_USERS || '100', 10),
  durationSeconds: parseInt(process.env.DURATION_SECONDS || '60', 10),
  reportPath: path.join(__dirname, '..', 'reports', 'Load_Test_Report.xlsx'),
  endpoints: [
    { name: 'Authentication Login', path: '/auth/login', method: 'POST', body: { username: 'sivachaitanya72@gmail.com', password: 'siva2580' } },
    { name: 'Threat Intel Lookup', path: '/api/intel/lookup', method: 'POST', body: { ip: '185.15.1.100', zone: 'Zone 1 (Main Stadium)' } },
    { name: 'Telemetry Settings', path: '/api/telemetry/settings', method: 'GET' },
    { name: 'Platform Sync Status', path: '/api/telemetry/sync', method: 'GET', headers: { 'X-Platform': 'Android App' } },
    { name: 'IDS Protected Rules', path: '/api/ids/rules', method: 'GET' }
  ]
};
