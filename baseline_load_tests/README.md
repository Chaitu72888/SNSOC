# SNSOC 100 Virtual Users Baseline & Load Testing Suite

This directory (`baseline_load_tests`) contains the automated **Baseline & Load Testing Engine** and **Excel Performance Analysis Reporter** for stress testing the SNSOC Web & Mobile API under 100 concurrent virtual users.

---

## 📁 Directory Structure

```
baseline_load_tests/
├── config/
│   └── load_config.js      # 100 VUs, 60s duration, target endpoints config
├── utils/
│   ├── load_engine.js      # High-resolution microsecond load generator
│   └── excel_reporter.js   # ExcelJS reporter generating Excel performance analysis
├── reports/                # Generated performance reports
│   └── Load_Test_Report.xlsx
├── package.json            # Node.js dependencies
├── run_load_tests.js       # Master load test runner script
└── README.md               # Instructions
```

---

## ⚡ Execution

Run the 100 VU 1-Minute Load Test:

```bash
node run_load_tests.js
```
