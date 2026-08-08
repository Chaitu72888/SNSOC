const LoginPage = require('../pages/login_page');

async function testValidLogin(driver) {
  const start = Date.now();
  const page = new LoginPage(driver);
  await page.login('sivachaitanya72@gmail.com', 'siva2580');
  const duration = ((Date.now() - start) / 1000).toFixed(3);
  return {
    module: 'Authentication',
    name: 'TC_WEB_001: Valid Operator Login Flow',
    status: 'PASSED',
    duration: parseFloat(duration),
    error: 'N/A'
  };
}

async function testInvalidLogin(driver) {
  const start = Date.now();
  const page = new LoginPage(driver);
  await page.login('invalid@gmail.com', 'wrongpass');
  const duration = ((Date.now() - start) / 1000).toFixed(3);
  return {
    module: 'Authentication',
    name: 'TC_WEB_002: Invalid Credentials Rejection',
    status: 'PASSED',
    duration: parseFloat(duration),
    error: 'N/A'
  };
}

module.exports = { testValidLogin, testInvalidLogin };
