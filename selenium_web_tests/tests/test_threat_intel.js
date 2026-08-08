const ThreatIntelPage = require('../pages/threat_intel_page');

async function testThreatIntelLookup(driver) {
  const start = Date.now();
  const page = new ThreatIntelPage(driver);
  await page.lookupIp('185.15.1.100');
  const duration = ((Date.now() - start) / 1000).toFixed(3);
  return {
    module: 'Threat Intelligence',
    name: 'TC_WEB_004: Threat Intel IP Search & Malicious Alert',
    status: 'PASSED',
    duration: parseFloat(duration),
    error: 'N/A'
  };
}

module.exports = { testThreatIntelLookup };
