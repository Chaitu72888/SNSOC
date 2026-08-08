# SNSOC Web Application Node.js Selenium E2E Testing Suite

This directory (`selenium_web_tests`) contains the complete **Node.js Selenium Web End-to-End Automation Testing Suite** and **Excel Analysis Report Generator** for the SNSOC Web Application.

---

## 📁 Directory Structure

```
selenium_web_tests/
├── config/
│   └── selenium_config.js    # Browser settings, base URL, and timeouts
├── pages/                    # Page Object Model (POM)
│   ├── base_page.js          # Explicit wait locators & element interaction helpers
│   ├── login_page.js          # Web authentication page object
│   ├── dashboard_page.js      # Web dashboard metrics & charts page object
│   ├── threat_intel_page.js   # Threat Intel IP lookup form page object
│   └── ids_page.js            # Intrusion Detection rules & port page object
├── tests/                    # Selenium Web E2E Test Suite
│   ├── test_login.js          # TC_WEB_001, TC_WEB_002: Authentication tests
│   ├── test_dashboard.js      # TC_WEB_003: Dashboard metrics loading
│   ├── test_threat_intel.js   # TC_WEB_004: Threat Intel search & IP scoring
│   ├── test_ids_rules.js      # TC_WEB_005: Protected port rules verification
│   └── test_full_web_flow.js  # TC_WEB_006: Complete web operator journey
├── utils/
│   ├── driver_factory.js      # Selenium WebDriver builder
│   └── excel_reporter.js      # ExcelJS reporter generating Excel analysis
├── reports/                  # Generated Excel reports
│   └── Selenium_Web_Test_Report.xlsx
├── package.json              # Node.js dependencies
├── run_selenium_web_tests.js # Master runner script
└── README.md                 # Setup & execution guide
```

---

## ⚡ Execution

Install npm dependencies:

```bash
npm install
```

Run the Selenium Web Test Suite:

```bash
node run_selenium_web_tests.js
```
