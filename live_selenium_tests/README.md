# Phase 7 – Live GitHub Pages Selenium E2E Automation Testing Framework

This directory (`live_selenium_tests`) contains the **Live Selenium End-to-End Automation Testing Suite** and **Report Generator** for testing the live deployed website on **GitHub Pages** (`https://chaitu72888.github.io/SNSOC/`).

---

## 📂 Deliverable Directory Structure (`Test Results/`)

Executing the live runner automatically produces the required report directory tree:

```
live_selenium_tests/
├── Test Results/
│   ├── Excel/
│   │   └── Automation_Test_Report.xlsx    # ExcelJS KPI Cards & Test Table
│   ├── HTML/
│   │   └── execution-report.html          # Standalone HTML Execution Dashboard
│   ├── Screenshots/                       # PNG Screenshot artifacts
│   ├── Logs/                              # Detailed execution log file
│   └── Summary/
│       └── summary.md                     # Markdown summary for GitHub Actions
├── config/
│   └── live_config.js                     # Configurable BASE_URL & report paths
├── pages/                                 # Page Object Model (POM)
│   ├── base_page.js
│   ├── login_page.js
│   └── dashboard_page.js
├── tests/
│   └── test_live_e2e.js                   # Live E2E test cases
├── package.json                           # Node.js dependencies
├── run_live_tests.js                      # Master Live Test Runner
└── README.md                              # Instructions
```

---

## ⚙️ Repository Settings & Required Secrets

### 1. GitHub Pages Configuration
In your GitHub Repository (`https://github.com/Chaitu72888/SNSOC`):
1. Navigate to **Settings** -> **Pages**.
2. Under **Build and deployment** -> **Source**, select **GitHub Actions**.

### 2. Workflow Permissions
The `.github/workflows/deploy-and-test.yml` workflow automatically configures:
- `contents: read`
- `pages: write`
- `id-token: write`

No extra repository secrets are required; standard `GITHUB_TOKEN` handles Pages deployment and artifact uploads.

---

## ⚡ Execution Instructions

### Local Execution (against Live Deployed URL):

```bash
cd live_selenium_tests
npm install
BASE_URL="https://chaitu72888.github.io/SNSOC/" node run_live_tests.js
```

### CI/CD Automated Execution:
Every `push` to `main`/`master` or `workflow_dispatch` trigger automatically executes `.github/workflows/deploy-and-test.yml`:
1. Builds the web application.
2. Deploys to GitHub Pages.
3. Waits for live availability.
4. Executes Selenium tests in headless Chrome mode against `BASE_URL`.
5. Uploads `Test Results/` artifacts.
6. Publishes the execution summary to `$GITHUB_STEP_SUMMARY`.
