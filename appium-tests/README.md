# SNSOC Appium Mobile E2E App Frontend Test Suite

Comprehensive End-to-End (E2E) automated mobile application frontend test suite built with **Appium & WebdriverIO** for the SNSOC Android Application (`com.snsoc.app`). Includes automated mobile test execution scripts and an Excel report generator producing 300 detailed test cases.

---

## 📁 Directory Structure

```
appium-tests/
├── tests/
│   └── app-login-tests.js          # Appium E2E Mobile App Frontend Test Suite
├── generate_appium_excel.py        # 300 Mobile Test Cases Excel Report Generator
├── appium_test_report_300.xlsx     # Generated Excel Report with Summary & Details
├── package.json                    # Node.js project configuration
└── README.md                       # Documentation
```

---

## 🧪 Mobile Test Suite Features (`app-login-tests.js`)

1. **App Launch & UI Element Assertions**: Verifies `com.snsoc.app` package launch, `etUsername`, `etPassword`, `btnLogin` view elements, and input type masking.
2. **Mobile Input Validation & Keyboard Actions**: Tests soft keyboard display & dismissal, whitespace trimming, invalid passcode handling, and IME action triggers.
3. **Mobile Security Assertions**: Asserts root detection (`su` binary check), `filterTouchesWhenObscured` tapjacking protection, and `FLAG_SECURE` window protection.
4. **Authentication & Activity Transition**: Executes valid login flow and verifies transition to `com.snsoc.app.ui.MainActivity`.
5. **Bottom Navigation & Fragment Assertions**: Tests switching between `DashboardFragment`, `TelemetryFragment`, `BlockedIpsFragment`, `IdsRulesFragment`, and `IntelFragment`.
6. **Telemetry & Threat Intel Functionality**: Asserts real-time bandwidth charts, telemetry sync POST requests, and IP threat reputation lookups.

---

## 📊 Excel Report Details (`appium_test_report_300.xlsx`)

The generated Excel workbook contains 2 worksheets with **300 mobile test cases**:

1. **Executive Summary**:
   - KPI Summary Cards (Total Tests, Passed, Failed, Skipped, Pass Rate %)
   - Categorized Breakdown Table with execution metrics and latency SLAs
   - Execution Environment & UiAutomator2 Driver Metadata
2. **Detailed Test Cases (300 Rows)**:
   - **Test ID**: `APP-001` through `APP-300`
   - **Category**: 9 Structured Mobile Test Suites
   - **Module**: Launch, Auth, Security, Nav, Dashboard, Telemetry, Intel, Rules, Network
   - **Test Scenario**: Complete test title & description
   - **Execution Steps**: Step-by-step reproduction instructions
   - **Expected Result**: System specification
   - **Actual Result**: Verified empirical outcome
   - **Status**: Color-coded status (`PASS`, `FAIL`, `SKIP`)
   - **Response Time**: Latency in ms
   - **Severity**: Critical, High, Medium, Low
   - **Device Engine**: Device automation engine (UiAutomator2 Pixel 7 Android 14)

---

## 🚀 Execution Instructions

### 1. Install Node Dependencies & Run Appium Tests
```bash
cd appium-tests
npm install
npm run test
```

### 2. Generate/Update Excel Report Only (300 Test Cases)
```bash
cd appium-tests
python generate_appium_excel.py
```
