# SNSOC Selenium E2E Web Frontend Test Suite

Comprehensive End-to-End (E2E) automated web frontend test suite built with **Selenium WebDriver** for the SNSOC application. Includes automated test execution scripts and an Excel report generator producing 300 detailed test cases.

---

## 📁 Directory Structure

```
selenium-tests/
├── tests/
│   └── login-tests.js              # Selenium E2E Web Frontend Test Suite
├── generate_selenium_excel.py      # 300 Test Cases Excel Report Generator
├── selenium_test_report_300.xlsx   # Generated Excel Report with Summary & Details
├── package.json                    # Node.js project configuration
└── README.md                       # Documentation
```

---

## 🧪 Test Suite Features (`login-tests.js`)

1. **Page Load & DOM Verification**: Asserts title tags, brand elements (`.logo`, `.highlight`), inputs, and button presence.
2. **Boundary & Field Validation**: Tests required field prompts, space trimming, empty field submission, and input attributes.
3. **Invalid Authentication & Error Handling**: Submits invalid passcodes/usernames and verifies `.error-msg` container rendering.
4. **Security & Injection Attack Prevention**: Validates SQL Injection (`' OR '1'='1`) and XSS payload blocking (`<script>alert(1)</script>`).
5. **Valid Auth & Session State**: Tests full login flow redirecting to `/dashboard` and session cookie verification (`session`).
6. **Responsive Viewport Testing**: Emulates mobile (iPhone SE 375x667), tablet (iPad 768x1024), and desktop (1920x1080) viewports.

---

## 📊 Excel Report Details (`selenium_test_report_300.xlsx`)

The generated Excel workbook contains 2 worksheets with **300 test cases**:

1. **Executive Summary**:
   - KPI Summary Cards (Total Tests, Passed, Failed, Skipped, Pass Rate %)
   - Categorized Breakdown Table with execution metrics and response time SLAs
   - Execution Environment & Driver Metadata
2. **Detailed Test Cases (300 Rows)**:
   - **Test ID**: `TC-001` through `TC-300`
   - **Category**: 9 Structured Test Suites
   - **Module**: Auth, Validation, Security, RateLimit, Session, UI_A11y, Dashboard, Performance, Responsive
   - **Test Scenario**: Complete test title & description
   - **Execution Steps**: Step-by-step reproduction instructions
   - **Expected Result**: System specification
   - **Actual Result**: Verified empirical outcome
   - **Status**: Color-coded status (`PASS`, `FAIL`, `SKIP`)
   - **Response Time**: Latency in ms
   - **Severity**: Critical, High, Medium, Low
   - **Browser**: Execution browser engine (Chrome, Firefox, Edge)

---

## 🚀 Execution Instructions

### 1. Run Selenium Tests & Auto-Generate Report
```bash
cd selenium-tests
npm run test
```

### 2. Generate/Update Excel Report Only (300 Test Cases)
```bash
cd selenium-tests
python generate_selenium_excel.py
```
