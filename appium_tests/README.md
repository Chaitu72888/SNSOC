# SNSOC Mobile Application Appium E2E Automation & Excel Reporter

This directory (`appium_tests`) contains the complete **Appium End-to-End (E2E) Automation Testing Suite** and **Excel Analysis Report Generator** for the **SNSOC Android Mobile Application**.

---

## 📁 Directory Structure

```
appium_tests/
├── config/
│   └── capabilities.py       # Appium Android UiAutomator2 / Device capabilities
├── pages/                    # Page Object Model (POM)
│   ├── base_page.py          # Common element locating & wait strategies
│   ├── login_page.py         # Login screen elements & credentials submit
│   ├── threat_intel_page.py  # Threat Intel IP lookup & score evaluation
│   ├── settings_page.py      # Telemetry & sync settings controls
│   └── dashboard_page.py     # Mobile dashboard & metrics verification
├── tests/                    # PyTest E2E Test Suite
│   ├── test_e2e_login.py          # TC_001, TC_002: Authentication tests
│   ├── test_e2e_threat_intel.py   # TC_003, TC_004: IP threat lookup tests
│   ├── test_e2e_settings.py       # TC_005, TC_006, TC_007: Telemetry & sync tests
│   ├── test_e2e_ids_rules.py      # TC_008: Protected ports & IDS rules tests
│   └── test_e2e_full_flow.py      # TC_009: Complete end-to-end user journey
├── utils/
│   ├── appium_helper.py      # Driver lifecycle & screenshot capture
│   └── excel_reporter.py     # Excel Report Generator (OpenPyXL)
├── reports/                  # Generated Excel reports and screenshot artifacts
│   └── Appium_Test_Report.xlsx
├── conftest.py               # PyTest driver setup & result tracking fixture
├── requirements_appium.txt   # Dependencies file
├── run_appium_tests.py       # Master runner script (Executes tests + Generates Excel)
└── README.md                 # Documentation
```

---

## 🛠️ Prerequisites

1. **Python 3.9+**
2. **Appium Server (Optional for Live Devices/Emulators)**:
   ```bash
   npm install -g appium
   appium driver install uiautomator2
   ```
3. **Android SDK / Emulator** (Set `ANDROID_HOME` in environment variables if testing real APK/emulator).

---

## ⚡ Installation

Install the Appium testing dependencies:

```bash
pip install -r requirements_appium.txt
```

---

## 🚀 Running Appium E2E Tests & Generating Excel Report

Run the master test runner from the `appium_tests` directory:

```bash
python run_appium_tests.py
```

### Execution Details:
- The script initializes the Appium test driver.
- If an Appium server is running on `http://127.0.0.1:4723`, it connects to your connected Android Device or Emulator.
- If Appium server is offline, it automatically executes in **Mock / Direct API mode** to validate business logic without failing.
- Once tests finish, `utils/excel_reporter.py` compiles all test metrics and generates the formatted Excel Analysis Report:
  `reports/Appium_Test_Report.xlsx`

---

## 📊 Excel Report Structure (`Appium_Test_Report.xlsx`)

The generated Excel report contains 3 professionally styled sheets:

1. **Executive Summary**:
   - Executive Title Banner & Timestamp
   - Summary KPI Cards: **TOTAL TESTS**, **PASSED**, **FAILED**, **PASS RATE %**
   - Module Summary Breakdown table with status indicators (**HEALTHY**, **NEEDS ATTENTION**, **CRITICAL**)
2. **Test Execution Details**:
   - Tabular log listing `Test ID`, `Module`, `Test Case Title`, `Status` (Color-coded GREEN/RED), `Duration (s)`, `Execution Time`, and `Error Logs`.
3. **Analysis & Insights**:
   - Component risk assessment and strategic recommendations for mobile security and API optimization.
