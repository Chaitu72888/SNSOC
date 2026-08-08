const LoginPage = require('../pages/login_page');
const DashboardPage = require('../pages/dashboard_page');
const ThreatIntelPage = require('../pages/threat_intel_page');

async function testFullWebUserFlow(driver) {
  const start = Date.now();
  const loginPage = new LoginPage(driver);
  const dashboardPage = new DashboardPage(driver);
  const intelPage = new ThreatIntelPage(driver);

  await loginPage.login('sivachaitanya72@gmail.com', 'siva2580');
  await dashboardPage.loadDashboard();
  await intelPage.lookupIp('45.33.32.156');

  const duration = ((Date.now() - start) / 1000).toFixed(3);
  return {
    module: 'End to End Web Journey',
    name: 'TC_WEB_006: Complete Web Operator User Flow',
    status: 'PASSED',
    duration: parseFloat(duration),
    error: 'N/A'
  };
}

module.exports = { testFullWebUserFlow };
