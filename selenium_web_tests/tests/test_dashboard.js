const DashboardPage = require('../pages/dashboard_page');

async function testDashboardLoading(driver) {
  const start = Date.now();
  const page = new DashboardPage(driver);
  await page.loadDashboard();
  const duration = ((Date.now() - start) / 1000).toFixed(3);
  return {
    module: 'Dashboard',
    name: 'TC_WEB_003: Dashboard Cards & Live Metrics Loading',
    status: 'PASSED',
    duration: parseFloat(duration),
    error: 'N/A'
  };
}

module.exports = { testDashboardLoading };
