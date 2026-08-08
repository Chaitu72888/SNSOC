const path = require('path');

module.exports = {
  baseUrl: process.env.BASE_URL || 'http://127.0.0.1:5000',
  browser: process.env.BROWSER || 'chrome',
  headless: process.env.HEADLESS === 'true',
  timeout: parseInt(process.env.TIMEOUT || '10000', 10),
  reportPath: path.join(__dirname, '..', 'reports', 'Selenium_Web_Test_Report.xlsx')
};
