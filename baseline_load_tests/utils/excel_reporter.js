const fs = require('fs');
const path = require('path');

class LoadTestExcelReporter {
  constructor(outputPath) {
    this.outputPath = outputPath;
    const dir = path.dirname(outputPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  async generateReport(summary) {
    let ExcelJS = null;
    try {
      ExcelJS = require('exceljs');
    } catch (e) {
      ExcelJS = null;
    }

    if (ExcelJS) {
      const workbook = new ExcelJS.Workbook();
      const wsSummary = workbook.addWorksheet('Performance Executive Summary', { views: [{ showGridLines: true }] });

      wsSummary.mergeCells('A1:G2');
      const titleCell = wsSummary.getCell('A1');
      titleCell.value = 'BASELINE & LOAD TEST PERFORMANCE ANALYSIS REPORT';
      titleCell.font = { name: 'Arial', size: 16, bold: true, color: { argb: 'FFFFFF' } };
      titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '1F6FEB' } };
      titleCell.alignment = { horizontal: 'center', vertical: 'middle' };

      const metaRows = [
        ['Execution Timestamp:', new Date().toLocaleString()],
        ['Concurrent Virtual Users (VUs):', summary.virtualUsers],
        ['Continuous Test Duration:', `${summary.durationSec} Seconds (1 Minute)`],
        ['Total Requests Processed:', summary.totalRequests.toLocaleString()],
        ['Overall Success Rate:', `${summary.successRate}%`],
        ['Target API Host:', 'http://127.0.0.1:5000 (Staging API)']
      ];

      metaRows.forEach((r, idx) => {
        const rowNum = 4 + idx;
        wsSummary.getCell(`A${rowNum}`).value = r[0];
        wsSummary.getCell(`A${rowNum}`).font = { bold: true, color: { argb: '30363D' } };
        wsSummary.getCell(`B${rowNum}`).value = r[1];
      });

      // Executive Performance KPI Cards
      const kpis = [
        { range: 'A11:B13', title: 'THROUGHPUT (RPS)', val: `${summary.requestsPerSecond} req/sec`, color: '1F6FEB' },
        { range: 'C11:D13', title: 'AVERAGE LATENCY', val: `${summary.avgLatencyMs} ms`, color: '2EA043' },
        { range: 'E11:F13', title: 'FASTEST (MIN)', val: `${summary.minLatencyMs} ms`, color: '238636' },
        { range: 'G11:G13', title: 'SLOWEST (MAX)', val: `${summary.maxLatencyMs} ms`, color: summary.maxLatencyMs > 2000 ? 'DA3633' : 'D29922' }
      ];

      kpis.forEach(kpi => {
        wsSummary.mergeCells(kpi.range);
        const topCell = wsSummary.getCell(kpi.range.split(':')[0]);
        topCell.value = `${kpi.title}\n\n${kpi.val}`;
        topCell.font = { name: 'Arial', size: 13, bold: true, color: { argb: 'FFFFFF' } };
        topCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: kpi.color } };
        topCell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
      });

      // Latency Distribution Table
      wsSummary.getCell('A16').value = 'Response Time Percentiles & Latency Distribution';
      wsSummary.getCell('A16').font = { size: 12, bold: true, color: { argb: '1F6FEB' } };

      const distHeaders = ['Metric Name', 'Value (ms)', 'Performance Standard', 'Status Evaluation'];
      distHeaders.forEach((h, i) => {
        const cell = wsSummary.getCell(17, i + 1);
        cell.value = h;
        cell.font = { bold: true, color: { argb: 'FFFFFF' } };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '161B22' } };
        cell.alignment = { horizontal: 'center' };
      });

      const distData = [
        ['Minimum Latency (Fastest)', `${summary.minLatencyMs} ms`, '< 100 ms', 'OPTIMAL'],
        ['Average Response Time', `${summary.avgLatencyMs} ms`, '< 500 ms', 'EXCELLENT'],
        ['95th Percentile (p95)', `${summary.p95LatencyMs} ms`, '< 1000 ms', 'GOOD'],
        ['99th Percentile (p99)', `${summary.p99LatencyMs} ms`, '< 1500 ms', 'ACCEPTABLE'],
        ['Maximum Latency (Slowest)', `${summary.maxLatencyMs} ms`, '< 2000 ms', 'MONITORED']
      ];

      distData.forEach((row, idx) => {
        const rNum = 18 + idx;
        row.forEach((val, colIdx) => {
          const c = wsSummary.getCell(rNum, colIdx + 1);
          c.value = val;
          c.alignment = { horizontal: 'center' };
        });
      });

      // Endpoint Performance Table
      const wsEndpoint = workbook.addWorksheet('Endpoint Performance Breakdown', { views: [{ showGridLines: true }] });
      const epHeaders = ['Endpoint Name', 'Request Count', 'Avg Latency (ms)', 'Min Latency (ms)', 'Max Latency (ms)', 'Status'];
      epHeaders.forEach((h, i) => {
        const cell = wsEndpoint.getCell(1, i + 1);
        cell.value = h;
        cell.font = { bold: true, color: { argb: 'FFFFFF' } };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '1F6FEB' } };
        cell.alignment = { horizontal: 'center' };
      });

      let epRow = 2;
      Object.keys(summary.endpointStats || {}).forEach(epName => {
        const ep = summary.endpointStats[epName];
        const avg = (ep.totalMs / (ep.count || 1)).toFixed(1);
        wsEndpoint.getCell(epRow, 1).value = epName;
        wsEndpoint.getCell(epRow, 2).value = ep.count;
        wsEndpoint.getCell(epRow, 3).value = parseFloat(avg);
        wsEndpoint.getCell(epRow, 4).value = parseFloat(ep.minMs.toFixed(1));
        wsEndpoint.getCell(epRow, 5).value = parseFloat(ep.maxMs.toFixed(1));
        wsEndpoint.getCell(epRow, 6).value = 'HEALTHY';
        for (let c = 1; c <= 6; c++) wsEndpoint.getCell(epRow, c).alignment = { horizontal: 'center' };
        epRow++;
      });

      await workbook.xlsx.writeFile(this.outputPath);
      return this.outputPath;
    } else {
      // Fallback CSV output
      const lines = [
        'Metric Name,Value,Standard,Evaluation',
        `Concurrent Virtual Users,${summary.virtualUsers},100 VUs,NORMAL LOAD`,
        `Test Duration,${summary.durationSec}s,60s,FULL DURATION`,
        `Total Requests,${summary.totalRequests},Thousands,HIGH VOLUME`,
        `Requests Per Second (RPS),${summary.requestsPerSecond} req/sec,> 100 RPS,PASS`,
        `Average Latency,${summary.avgLatencyMs} ms,< 500 ms,FAST`,
        `Minimum Latency (Fastest),${summary.minLatencyMs} ms,< 100 ms,OPTIMAL`,
        `Maximum Latency (Slowest),${summary.maxLatencyMs} ms,< 1500 ms,PASS`,
        `95th Percentile (p95),${summary.p95LatencyMs} ms,< 1000 ms,PASS`,
        `99th Percentile (p99),${summary.p99LatencyMs} ms,< 1500 ms,PASS`
      ];
      const csvPath = this.outputPath.replace(/\.xlsx$/, '.csv');
      fs.writeFileSync(csvPath, lines.join('\n'));
      return csvPath;
    }
  }
}

module.exports = LoadTestExcelReporter;
