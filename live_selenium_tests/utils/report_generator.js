const fs = require('fs');
const path = require('path');
const config = require('../config/live_config');

class LiveReportGenerator {
  constructor() {
    // Ensure all 5 output subdirectories exist
    [
      path.join(config.resultsDir, 'Excel'),
      path.join(config.resultsDir, 'HTML'),
      config.screenshotsDir,
      config.logsDir,
      path.join(config.resultsDir, 'Summary')
    ].forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });
  }

  async generateAllReports(results, meta = {}) {
    const total = results.length;
    const passed = results.filter(r => r.status === 'PASSED').length;
    const failed = results.filter(r => r.status === 'FAILED').length;
    const skipped = results.filter(r => r.status === 'SKIPPED').length;
    const passPercentage = total > 0 ? ((passed / total) * 100).toFixed(1) : '0.0';

    const summaryData = {
      baseUrl: config.baseUrl,
      repoUrl: config.repoUrl,
      total,
      passed,
      failed,
      skipped,
      passPercentage,
      results,
      meta
    };

    // 1. Generate Excel Report (Automation_Test_Report.xlsx)
    await this.generateExcelReport(summaryData);

    // 2. Generate Standalone HTML Dashboard Report (execution-report.html)
    this.generateHtmlReport(summaryData);

    // 3. Generate Execution Logs (Logs/live_execution.log)
    this.generateLogs(summaryData);

    // 4. Generate GitHub Actions Step Summary (summary.md)
    this.generateSummaryMarkdown(summaryData);

    return summaryData;
  }

  async generateExcelReport(data) {
    let ExcelJS = null;
    try {
      ExcelJS = require('exceljs');
    } catch (e) {
      ExcelJS = null;
    }

    if (ExcelJS) {
      const workbook = new ExcelJS.Workbook();
      const ws = workbook.addWorksheet('Live E2E Test Summary', { views: [{ showGridLines: true }] });

      ws.mergeCells('A1:F2');
      const titleCell = ws.getCell('A1');
      titleCell.value = 'LIVE GITHUB PAGES SELENIUM E2E AUTOMATION TEST REPORT';
      titleCell.font = { name: 'Arial', size: 16, bold: true, color: { argb: 'FFFFFF' } };
      titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '1F6FEB' } };
      titleCell.alignment = { horizontal: 'center', vertical: 'middle' };

      const metaInfo = [
        ['Live Deployed URL:', data.baseUrl],
        ['Repository:', data.repoUrl],
        ['Execution Timestamp:', new Date().toLocaleString()],
        ['Browser Engine:', 'Headless Google Chrome'],
        ['Pass Percentage:', `${data.passPercentage}%`]
      ];

      metaInfo.forEach((r, idx) => {
        const rNum = 4 + idx;
        ws.getCell(`A${rNum}`).value = r[0];
        ws.getCell(`A${rNum}`).font = { bold: true };
        ws.getCell(`B${rNum}`).value = r[1];
      });

      const kpis = [
        { range: 'A10:A12', title: 'TOTAL TESTS', val: data.total, color: '1F6FEB' },
        { range: 'B10:B12', title: 'PASSED', val: data.passed, color: '2EA043' },
        { range: 'C10:C12', title: 'FAILED', val: data.failed, color: data.failed > 0 ? 'DA3633' : '8B949E' },
        { range: 'D10:D12', title: 'SKIPPED', val: data.skipped, color: '8B949E' },
        { range: 'E10:F12', title: 'PASS %', val: `${data.passPercentage}%`, color: parseFloat(data.passPercentage) >= 80 ? '238636' : 'D29922' }
      ];

      kpis.forEach(kpi => {
        ws.mergeCells(kpi.range);
        const topCell = ws.getCell(kpi.range.split(':')[0]);
        topCell.value = `${kpi.title}\n\n${kpi.val}`;
        topCell.font = { name: 'Arial', size: 13, bold: true, color: { argb: 'FFFFFF' } };
        topCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: kpi.color } };
        topCell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
      });

      const headers = ['Test ID', 'Module', 'Test Case Title', 'Status', 'Duration (s)', 'Error Details'];
      headers.forEach((h, i) => {
        const c = ws.getCell(15, i + 1);
        c.value = h;
        c.font = { bold: true, color: { argb: 'FFFFFF' } };
        c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '161B22' } };
        c.alignment = { horizontal: 'center' };
      });

      data.results.forEach((r, idx) => {
        const rNum = 16 + idx;
        ws.getCell(rNum, 1).value = `LIVE_TC_${(idx + 1).toString().padStart(3, '0')}`;
        ws.getCell(rNum, 2).value = r.module || 'Live E2E';
        ws.getCell(rNum, 3).value = r.name || 'Test Case';

        const stCell = ws.getCell(rNum, 4);
        stCell.value = r.status;
        stCell.font = { bold: true, color: { argb: 'FFFFFF' } };
        stCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: r.status === 'PASSED' ? '2EA043' : 'DA3633' } };
        stCell.alignment = { horizontal: 'center' };

        ws.getCell(rNum, 5).value = r.duration || 0.1;
        ws.getCell(rNum, 6).value = r.error || 'N/A';
      });

      await workbook.xlsx.writeFile(config.excelReportPath);
    } else {
      // CSV Fallback
      const lines = [
        'Test ID,Module,Test Case Title,Status,Duration (s),Error',
        ...data.results.map((r, i) => `LIVE_TC_${(i + 1).toString().padStart(3, '0')},"${r.module}","${r.name}",${r.status},${r.duration},"${r.error}"`)
      ];
      fs.writeFileSync(config.excelReportPath.replace(/\.xlsx$/, '.csv'), lines.join('\n'));
    }
  }

  generateHtmlReport(data) {
    const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Live GitHub Pages E2E Execution Report</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background-color: #0d1117; color: #c9d1d9; margin: 0; padding: 30px; }
        .header { border-bottom: 1px solid #30363d; padding-bottom: 20px; margin-bottom: 30px; }
        .title { color: #58a6ff; font-size: 24px; font-weight: bold; margin: 0 0 10px 0; }
        .kpi-container { display: flex; gap: 20px; margin-bottom: 30px; }
        .kpi { flex: 1; background: #161b22; border: 1px solid #30363d; border-radius: 8px; padding: 20px; text-align: center; }
        .kpi-num { font-size: 28px; font-weight: bold; margin-top: 5px; }
        .passed { color: #3fb950; } .failed { color: #f85149; } .total { color: #58a6ff; }
        table { width: 100%; border-collapse: collapse; background: #161b22; border-radius: 8px; overflow: hidden; }
        th, td { padding: 12px 16px; text-align: left; border-bottom: 1px solid #30363d; }
        th { background: #21262d; color: #8b949e; font-weight: 600; }
        .badge { display: inline-block; padding: 4px 8px; border-radius: 4px; font-weight: bold; font-size: 12px; }
        .badge-pass { background: rgba(63,185,80,0.15); color: #3fb950; border: 1px solid rgba(63,185,80,0.4); }
        .badge-fail { background: rgba(248,81,73,0.15); color: #f85149; border: 1px solid rgba(248,81,73,0.4); }
    </style>
</head>
<body>
    <div class="header">
        <h1 class="title">Live GitHub Pages Selenium E2E Test Report</h1>
        <p>Target URL: <a href="${data.baseUrl}" style="color:#58a6ff;" target="_blank">${data.baseUrl}</a></p>
        <p>Execution Time: ${new Date().toLocaleString()}</p>
    </div>
    <div class="kpi-container">
        <div class="kpi"><div style="color:#8b949e;">TOTAL TESTS</div><div class="kpi-num total">${data.total}</div></div>
        <div class="kpi"><div style="color:#8b949e;">PASSED</div><div class="kpi-num passed">${data.passed}</div></div>
        <div class="kpi"><div style="color:#8b949e;">FAILED</div><div class="kpi-num failed">${data.failed}</div></div>
        <div class="kpi"><div style="color:#8b949e;">PASS RATE</div><div class="kpi-num passed">${data.passPercentage}%</div></div>
    </div>
    <table>
        <thead>
            <tr><th>Test ID</th><th>Module</th><th>Test Name</th><th>Status</th><th>Duration</th><th>Error / Details</th></tr>
        </thead>
        <tbody>
            ${data.results.map((r, i) => `
            <tr>
                <td>LIVE_TC_${(i+1).toString().padStart(3,'0')}</td>
                <td>${r.module}</td>
                <td>${r.name}</td>
                <td><span class="badge ${r.status === 'PASSED' ? 'badge-pass' : 'badge-fail'}">${r.status}</span></td>
                <td>${r.duration}s</td>
                <td>${r.error || 'Clean Execution'}</td>
            </tr>`).join('')}
        </tbody>
    </table>
</body>
</html>`;
    fs.writeFileSync(config.htmlReportPath, htmlContent);
  }

  generateLogs(data) {
    const logLines = [
      `[${new Date().toISOString()}] LIVE SELENIUM E2E EXECUTION LOG`,
      `Target BASE_URL: ${data.baseUrl}`,
      `Total Executed: ${data.total} | Passed: ${data.passed} | Failed: ${data.failed} | Pass Rate: ${data.passPercentage}%`,
      '-'.repeat(80),
      ...data.results.map(r => `[${r.status}] ${r.name} - Duration: ${r.duration}s - Details: ${r.error}`)
    ];
    fs.writeFileSync(path.join(config.logsDir, 'live_execution.log'), logLines.join('\n'));
  }

  generateSummaryMarkdown(data) {
    const failedList = data.results.filter(r => r.status === 'FAILED');
    const failedMd = failedList.length > 0
      ? failedList.map(f => `- **${f.name}**: ${f.error}`).join('\n')
      : '- None (All tests passed cleanly)';

    const mdContent = `# Live GitHub Pages E2E Test Summary

### Deployment URL:
[${data.baseUrl}](${data.baseUrl})

### Execution Metrics:
- **Total Tests:** ${data.total}
- **Passed:** ${data.passed}
- **Failed:** ${data.failed}
- **Skipped:** ${data.skipped}
- **Pass Percentage:** **${data.passPercentage}%**

### Failed Tests:
${failedMd}
`;
    fs.writeFileSync(config.summaryPath, mdContent);
  }
}

module.exports = LiveReportGenerator;
