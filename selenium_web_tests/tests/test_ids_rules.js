const IDSPage = require('../pages/ids_page');

async function testIDSRulesVerification(driver) {
  const start = Date.now();
  const page = new IDSPage(driver);
  await page.checkRules();
  const duration = ((Date.now() - start) / 1000).toFixed(3);
  return {
    module: 'Intrusion Detection System',
    name: 'TC_WEB_005: Protected Ports (22, 23, 445, 3389) Rule Verification',
    status: 'PASSED',
    duration: parseFloat(duration),
    error: 'N/A'
  };
}

module.exports = { testIDSRulesVerification };
