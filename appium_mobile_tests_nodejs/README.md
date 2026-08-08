# SNSOC Mobile Application Node.js Appium E2E Testing Suite

This directory (`appium_mobile_tests_nodejs`) contains the complete **Node.js Appium Android Mobile Application End-to-End Testing Suite** and **Excel Analysis Report Generator** for the SNSOC Mobile Application.

---

## 📁 Directory Structure

```
appium_mobile_tests_nodejs/
├── config/
│   └── capabilities.js        # Android UiAutomator2 desired capabilities
├── pages/                    # Page Object Model (POM)
│   ├── base_page.js          # Mobile touch helpers & element locators
│   ├── login_page.js          # Mobile login screen page object
│   ├── threat_intel_page.js   # Mobile threat intel page object
│   ├── settings_page.js       # Mobile telemetry & settings page object
│   └── dashboard_page.js      # Mobile dashboard page object
├── tests/                    # Appium Mobile E2E Test Suite (50 Test Cases)
│   ├── test_mobile_ui_ux.js          # MOB_UI_001 to MOB_UI_010: UI/UX tests
│   ├── test_mobile_functional.js     # MOB_FN_001 to MOB_FN_010: Functional tests
│   ├── test_mobile_unit_sync.js      # MOB_UT_001 to MOB_UT_010: Unit & sync tests
│   ├── test_mobile_validation.js     # MOB_SEC_001 to MOB_SEC_010: Validation tests
│   └── test_mobile_deployable.js     # MOB_DEP_001 to MOB_DEP_010: Deployment readiness
├── utils/
│   ├── appium_driver.js       # WebdriverIO Appium driver initializer
│   └── excel_reporter.js      # Excel report generator producing Excel report
├── reports/                  # Generated Excel reports
│   └── Appium_Mobile_Test_Report.xlsx
├── package.json              # Node.js dependencies
├── run_appium_mobile_tests.js# Master mobile test runner script
└── README.md                 # Setup & execution guide
```

---

## ⚡ Execution

Run the Appium Mobile Test Suite:

```bash
node run_appium_mobile_tests.js
```
