const path = require('path');

const rawBaseUrl = process.env.BASE_URL || 'https://chaitu72888.github.io/SNSOC/';
const baseUrl = rawBaseUrl.endsWith('/') ? rawBaseUrl : `${rawBaseUrl}/`;

const testResultsDir = path.join(__dirname, '..', 'Test Results');

module.exports = {
  baseUrl: baseUrl,
  repoUrl: 'https://github.com/Chaitu72888/SNSOC',
  browser: process.env.BROWSER || 'chrome',
  headless: process.env.HEADLESS !== 'false',
  timeout: parseInt(process.env.TIMEOUT || '15000', 10),
  resultsDir: testResultsDir,
  excelReportPath: path.join(testResultsDir, 'Excel', 'Automation_Test_Report.xlsx'),
  htmlReportPath: path.join(testResultsDir, 'HTML', 'execution-report.html'),
  screenshotsDir: path.join(testResultsDir, 'Screenshots'),
  logsDir: path.join(testResultsDir, 'Logs'),
  summaryPath: path.join(testResultsDir, 'Summary', 'summary.md')
};
