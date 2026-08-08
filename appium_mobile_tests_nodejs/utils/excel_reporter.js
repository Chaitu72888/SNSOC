const fs = require('fs');
const path = require('path');

class AppiumExcelReporter {
  constructor(outputPath) {
    this.outputPath = outputPath;
    const dir = path.dirname(outputPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  async generateReport(testResults, executionMeta = {}) {
    const buildNum = process.env.BUILD_NUMBER || '001';
    const buildStr = `build-${buildNum.toString().padStart(3, '0')}`;
    const username = process.env.GITHUB_USERNAME || 'Chaitu72888';
    const repoName = process.env.REPOSITORY_NAME || 'SNSOC';
    const reportUrl = `https://${username}.github.io/${repoName}/reports/latest/execution-report.html`;

    const total = testResults.length;
    const passed = testResults.filter(r => r.status === 'PASSED').length;
    const failed = testResults.filter(r => r.status === 'FAILED').length;
    const skipped = testResults.filter(r => r.status === 'SKIPPED').length;
    const passRate = total > 0 ? ((passed / total) * 100).toFixed(1) : '0.0';

    const reportData = {
      buildNum,
      buildStr,
      username,
      repoName,
      reportUrl,
      total,
      passed,
      failed,
      skipped,
      passRate,
      results: testResults,
      meta: executionMeta
    };

    // 1. Generate Excel Report (Automation_Test_Report.xlsx)
    await this.writeExcelFile(reportData);

    // 2. Generate Published Reports Tree (reports/latest & reports/history)
    this.generatePublishedReportsTree(reportData);

    return this.outputPath;
  }

  async writeExcelFile(data) {
    let ExcelJS = null;
    try {
      ExcelJS = require('exceljs');
    } catch (e) {
      ExcelJS = null;
    }

    if (ExcelJS) {
      const workbook = new ExcelJS.Workbook();
      const wsSummary = workbook.addWorksheet('Executive Summary', { views: [{ showGridLines: true }] });

      wsSummary.mergeCells('A1:F2');
      const titleCell = wsSummary.getCell('A1');
      titleCell.value = 'ANDROID APPIUM MOBILE E2E AUTOMATION TEST REPORT';
      titleCell.font = { name: 'Arial', size: 16, bold: true, color: { argb: 'FFFFFF' } };
      titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '1F6FEB' } };
      titleCell.alignment = { horizontal: 'center', vertical: 'middle' };

      const metaRows = [
        ['Execution Timestamp:', new Date().toLocaleString()],
        ['Build Number:', `#${data.buildNum}`],
        ['Device / Automation:', data.meta.device || 'Android Emulator / UiAutomator2'],
        ['Published Report URL:', data.reportUrl],
        ['Overall Pass Rate:', `${data.passRate}%`]
      ];

      metaRows.forEach((r, idx) => {
        const rowNum = 4 + idx;
        wsSummary.getCell(`A${rowNum}`).value = r[0];
        wsSummary.getCell(`A${rowNum}`).font = { bold: true };
        wsSummary.getCell(`B${rowNum}`).value = r[1];
      });

      const kpis = [
        { range: 'A10:B12', title: 'TOTAL TESTS', val: data.total, color: '1F6FEB' },
        { range: 'C10:C12', title: 'PASSED', val: data.passed, color: '2EA043' },
        { range: 'D10:D12', title: 'FAILED', val: data.failed, color: data.failed > 0 ? 'DA3633' : '8B949E' },
        { range: 'E10:F12', title: 'PASS RATE', val: `${data.passRate}%`, color: parseFloat(data.passRate) >= 80 ? '238636' : 'D29922' }
      ];

      kpis.forEach(kpi => {
        wsSummary.mergeCells(kpi.range);
        const topCell = wsSummary.getCell(kpi.range.split(':')[0]);
        topCell.value = `${kpi.title}\n\n${kpi.val}`;
        topCell.font = { name: 'Arial', size: 13, bold: true, color: { argb: 'FFFFFF' } };
        topCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: kpi.color } };
        topCell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
      });

      const wsDetails = workbook.addWorksheet('Test Execution Details', { views: [{ showGridLines: true }] });
      const detHeaders = ['Test ID', 'Module', 'Test Case Title', 'Status', 'Duration (s)', 'Timestamp', 'Error / Log'];
      detHeaders.forEach((h, i) => {
        const cell = wsDetails.getCell(1, i + 1);
        cell.value = h;
        cell.font = { bold: true, color: { argb: 'FFFFFF' } };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '1F6FEB' } };
        cell.alignment = { horizontal: 'center' };
      });

      data.results.forEach((r, idx) => {
        const rowNum = 2 + idx;
        const stColor = r.status === 'PASSED' ? '2EA043' : 'DA3633';
        wsDetails.getCell(rowNum, 1).value = `MOB_TC_${(idx + 1).toString().padStart(3, '0')}`;
        wsDetails.getCell(rowNum, 2).value = r.module || 'Mobile';
        wsDetails.getCell(rowNum, 3).value = r.name || 'Test Case';

        const stCell = wsDetails.getCell(rowNum, 4);
        stCell.value = r.status;
        stCell.font = { bold: true, color: { argb: 'FFFFFF' } };
        stCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: stColor } };
        stCell.alignment = { horizontal: 'center' };

        wsDetails.getCell(rowNum, 5).value = r.duration || 0.1;
        wsDetails.getCell(rowNum, 6).value = r.timestamp || new Date().toLocaleTimeString();
        wsDetails.getCell(rowNum, 7).value = r.error || 'N/A - Clean Execution';
      });

      await workbook.xlsx.writeFile(this.outputPath);
    } else {
      const lines = [
        'Test ID,Module,Test Case Title,Status,Duration (s),Timestamp,Error Log',
        ...data.results.map((r, i) =>
          `MOB_TC_${(i + 1).toString().padStart(3, '0')},"${r.module || 'Mobile'}","${r.name || 'Test Case'}",${r.status},${r.duration || 0.1},"${r.timestamp || new Date().toLocaleTimeString()}","${r.error || 'N/A'}"`
        )
      ];
      fs.writeFileSync(this.outputPath.replace(/\.xlsx$/, '.csv'), lines.join('\n'));
    }
  }

  generatePublishedReportsTree(data) {
    const baseReportsDir = path.join(__dirname, '..', 'reports');
    const latestDir = path.join(baseReportsDir, 'latest');
    const historyDir = path.join(baseReportsDir, 'history', data.buildStr);

    [
      path.join(latestDir, 'screenshots'),
      path.join(latestDir, 'logs'),
      path.join(historyDir, 'screenshots'),
      path.join(historyDir, 'logs')
    ].forEach(dir => {
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    });

    const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Android Appium Execution Report #${data.buildNum}</title>
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
        <h1 class="title">Android Appium E2E Automation Execution Report</h1>
        <p>Build Number: <strong>#${data.buildNum}</strong> | Date: <strong>${new Date().toLocaleString()}</strong></p>
        <p>Live Report URL: <a href="${data.reportUrl}" style="color:#58a6ff;" target="_blank">${data.reportUrl}</a></p>
    </div>
    <div class="kpi-container">
        <div class="kpi"><div style="color:#8b949e;">TOTAL TESTS</div><div class="kpi-num total">${data.total}</div></div>
        <div class="kpi"><div style="color:#8b949e;">PASSED</div><div class="kpi-num passed">${data.passed}</div></div>
        <div class="kpi"><div style="color:#8b949e;">FAILED</div><div class="kpi-num failed">${data.failed}</div></div>
        <div class="kpi"><div style="color:#8b949e;">PASS RATE</div><div class="kpi-num passed">${data.passRate}%</div></div>
    </div>
    <table>
        <thead>
            <tr><th>Test ID</th><th>Module</th><th>Test Case Title</th><th>Status</th><th>Duration</th><th>Error / Log</th></tr>
        </thead>
        <tbody>
            ${data.results.map((r, i) => `
            <tr>
                <td>MOB_TC_${(i+1).toString().padStart(3,'0')}</td>
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

    fs.writeFileSync(path.join(latestDir, 'execution-report.html'), htmlContent);
    fs.writeFileSync(path.join(historyDir, 'execution-report.html'), htmlContent);

    const failedList = data.results.filter(r => r.status === 'FAILED');
    const failedMd = failedList.length > 0
      ? failedList.map(f => `- **${f.name}**: ${f.error}`).join('\n')
      : '- None (All tests passed cleanly)';

    const summaryMd = `# Android Appium Test Summary

**Build Number:** #${data.buildNum}  
**Execution Date:** ${new Date().toLocaleString()}  

### Execution Metrics:
- **Total Tests:** ${data.total}
- **Passed:** ${data.passed}
- **Failed:** ${data.failed}
- **Pass Rate:** **${data.passRate}%**

### Published Report URL:
[${data.reportUrl}](${data.reportUrl})

### Failed Tests:
${failedMd}
`;

    fs.writeFileSync(path.join(latestDir, 'summary.md'), summaryMd);
    fs.writeFileSync(path.join(historyDir, 'summary.md'), summaryMd);

    // Save logs
    const logContent = `[${new Date().toISOString()}] Android Appium Build #${data.buildNum} Log\n` +
      data.results.map(r => `[${r.status}] ${r.name} (${r.duration}s) - ${r.error}`).join('\n');
    fs.writeFileSync(path.join(latestDir, 'logs', 'appium_execution.log'), logContent);
    fs.writeFileSync(path.join(historyDir, 'logs', 'appium_execution.log'), logContent);
  }
}

module.exports = AppiumExcelReporter;
