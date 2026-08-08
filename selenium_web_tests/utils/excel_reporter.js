const fs = require('fs');
const path = require('path');

class SeleniumExcelReporter {
  constructor(outputPath) {
    this.outputPath = outputPath;
    const dir = path.dirname(outputPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  async generateReport(testResults, executionMeta = {}) {
    let ExcelJS = null;
    try {
      ExcelJS = require('exceljs');
    } catch (e) {
      ExcelJS = null;
    }

    if (ExcelJS) {
      const workbook = new ExcelJS.Workbook();

      const total = testResults.length;
      const passed = testResults.filter(r => r.status === 'PASSED').length;
      const failed = testResults.filter(r => r.status === 'FAILED').length;
      const passRate = total > 0 ? (passed / total * 100).toFixed(1) : '0.0';

      // SHEET 1: Executive Summary
      const wsSummary = workbook.addWorksheet('Executive Summary', { views: [{ showGridLines: true }] });

      wsSummary.mergeCells('A1:F2');
      const titleCell = wsSummary.getCell('A1');
      titleCell.value = 'WEB APPLICATION SELENIUM E2E TEST ANALYSIS REPORT';
      titleCell.font = { name: 'Arial', size: 16, bold: true, color: { argb: 'FFFFFF' } };
      titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '1F6FEB' } };
      titleCell.alignment = { horizontal: 'center', vertical: 'middle' };

      const metaRows = [
        ['Execution Timestamp:', new Date().toLocaleString()],
        ['Browser Engine:', executionMeta.browser || 'Google Chrome / Headless'],
        ['Target Web Application:', executionMeta.url || 'http://127.0.0.1:5000'],
        ['Framework:', 'Node.js + Selenium WebDriver'],
        ['Environment:', executionMeta.env || 'Staging / Local Node Server']
      ];

      metaRows.forEach((r, idx) => {
        const rowNum = 4 + idx;
        wsSummary.getCell(`A${rowNum}`).value = r[0];
        wsSummary.getCell(`A${rowNum}`).font = { bold: true, color: { argb: '30363D' } };
        wsSummary.getCell(`B${rowNum}`).value = r[1];
      });

      const kpis = [
        { range: 'A10:B12', title: 'TOTAL TESTS', val: total, color: '1F6FEB' },
        { range: 'C10:C12', title: 'PASSED', val: passed, color: '2EA043' },
        { range: 'D10:D12', title: 'FAILED', val: failed, color: failed > 0 ? 'DA3633' : '8B949E' },
        { range: 'E10:F12', title: 'PASS RATE', val: `${passRate}%`, color: parseFloat(passRate) >= 80 ? '238636' : 'D29922' }
      ];

      kpis.forEach(kpi => {
        wsSummary.mergeCells(kpi.range);
        const topCell = wsSummary.getCell(kpi.range.split(':')[0]);
        topCell.value = `${kpi.title}\n\n${kpi.val}`;
        topCell.font = { name: 'Arial', size: 13, bold: true, color: { argb: 'FFFFFF' } };
        topCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: kpi.color } };
        topCell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
      });

      wsSummary.getCell('A15').value = 'Web Module Breakdown Summary';
      wsSummary.getCell('A15').font = { size: 12, bold: true, color: { argb: '1F6FEB' } };

      const headers = ['Module', 'Total Tests', 'Passed', 'Failed', 'Pass Rate', 'Status'];
      headers.forEach((h, i) => {
        const cell = wsSummary.getCell(16, i + 1);
        cell.value = h;
        cell.font = { bold: true, color: { argb: 'FFFFFF' } };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '161B22' } };
        cell.alignment = { horizontal: 'center' };
      });

      const modules = {};
      testResults.forEach(r => {
        const mod = r.module || 'Web Core';
        if (!modules[mod]) modules[mod] = { total: 0, passed: 0, failed: 0 };
        modules[mod].total++;
        if (r.status === 'PASSED') modules[mod].passed++;
        else if (r.status === 'FAILED') modules[mod].failed++;
      });

      let currRow = 17;
      Object.keys(modules).forEach(mod => {
        const m = modules[mod];
        const pr = ((m.passed / m.total) * 100).toFixed(1);
        const st = pr === '100.0' ? 'HEALTHY' : (parseFloat(pr) >= 50 ? 'NEEDS ATTENTION' : 'CRITICAL');

        wsSummary.getCell(currRow, 1).value = mod;
        wsSummary.getCell(currRow, 2).value = m.total;
        wsSummary.getCell(currRow, 3).value = m.passed;
        wsSummary.getCell(currRow, 4).value = m.failed;
        wsSummary.getCell(currRow, 5).value = `${pr}%`;
        wsSummary.getCell(currRow, 6).value = st;

        for (let c = 1; c <= 6; c++) {
          wsSummary.getCell(currRow, c).alignment = { horizontal: 'center' };
        }
        currRow++;
      });

      // SHEET 2: Test Execution Details
      const wsDetails = workbook.addWorksheet('Test Execution Details', { views: [{ showGridLines: true }] });

      const detHeaders = ['Test ID', 'Module', 'Test Case Title', 'Status', 'Duration (s)', 'Timestamp', 'Error / Log'];
      detHeaders.forEach((h, i) => {
        const cell = wsDetails.getCell(1, i + 1);
        cell.value = h;
        cell.font = { bold: true, color: { argb: 'FFFFFF' } };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '1F6FEB' } };
        cell.alignment = { horizontal: 'center' };
      });

      testResults.forEach((r, idx) => {
        const rowNum = 2 + idx;
        const stColor = r.status === 'PASSED' ? '2EA043' : 'DA3633';

        wsDetails.getCell(rowNum, 1).value = `WEB_TC_${(idx + 1).toString().padStart(3, '0')}`;
        wsDetails.getCell(rowNum, 2).value = r.module || 'Web';
        wsDetails.getCell(rowNum, 3).value = r.name || 'Test Case';

        const stCell = wsDetails.getCell(rowNum, 4);
        stCell.value = r.status;
        stCell.font = { bold: true, color: { argb: 'FFFFFF' } };
        stCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: stColor } };
        stCell.alignment = { horizontal: 'center' };

        wsDetails.getCell(rowNum, 5).value = r.duration || 0.1;
        wsDetails.getCell(rowNum, 6).value = r.timestamp || new Date().toLocaleTimeString();
        wsDetails.getCell(rowNum, 7).value = r.error || 'N/A - Clean Execution';

        wsDetails.getCell(rowNum, 1).alignment = { horizontal: 'center' };
        wsDetails.getCell(rowNum, 2).alignment = { horizontal: 'center' };
        wsDetails.getCell(rowNum, 5).alignment = { horizontal: 'center' };
        wsDetails.getCell(rowNum, 6).alignment = { horizontal: 'center' };
      });

      [wsSummary, wsDetails].forEach(ws => {
        ws.columns.forEach(col => {
          let maxLen = 12;
          col.eachCell({ includeEmpty: true }, cell => {
            const len = String(cell.value || '').length;
            if (len > maxLen) maxLen = len;
          });
          col.width = Math.min(maxLen + 4, 50);
        });
      });

      await workbook.xlsx.writeFile(this.outputPath);
      return this.outputPath;
    } else {
      // Fallback structured CSV/Excel summary output
      const lines = [
        'Test ID,Module,Test Case Title,Status,Duration (s),Timestamp,Error Log',
        ...testResults.map((r, i) =>
          `WEB_TC_${(i + 1).toString().padStart(3, '0')},"${r.module || 'Web'}","${r.name || 'Test Case'}",${r.status},${r.duration || 0.1},"${r.timestamp || new Date().toLocaleTimeString()}","${r.error || 'N/A'}"`
        )
      ];
      const csvPath = this.outputPath.replace(/\.xlsx$/, '.csv');
      fs.writeFileSync(csvPath, lines.join('\n'));
      return csvPath;
    }
  }
}

module.exports = SeleniumExcelReporter;
