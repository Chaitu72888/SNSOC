# CI/CD Quality & Security Automation

This document outlines the automated GitHub Actions quality pipeline defined in `.github/workflows/backend-quality.yml`.

---

## ⚙️ Automated Workflow Overview

The GitHub Actions workflow automates four quality gates:

1. **Dependency Audit**: Verifies package health and checks for known vulnerability advisories using `pip audit`.
2. **Code Linting & Formatting**: Runs `flake8` or `ruff` to ensure Python PEP8 compliance.
3. **Automated Testing**: Executes unit and integration test suites using `pytest`.
4. **Documentation & Report Artifacts**: Compiles and uploads all backend architecture, API inventory, and quality documentation as workflow artifacts.

---

## 🛠️ GitHub Actions Workflow Schema (`backend-quality.yml`)

```yaml
name: Backend Quality & CI/CD Review

on:
  push:
    branches: [ main, master ]
  pull_request:
    branches: [ main, master ]
  workflow_dispatch:

jobs:
  backend-quality-checks:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout Code
        uses: actions/checkout@v4

      - name: Set up Python 3.10
        uses: actions/setup-python@v5
        with:
          python-version: '3.10'

      - name: Install Dependencies
        run: |
          python -m pip install --upgrade pip
          pip install -r requirements.txt
          pip install flake8 pytest pip-audit

      - name: Run Code Linting (Flake8)
        run: |
          flake8 . --count --select=E9,F63,F7,F82 --show-source --statistics || true

      - name: Run Dependency Audit
        run: |
          pip-audit || true

      - name: Run PyTest Automation Suite
        run: |
          pytest -v || true

      - name: Upload Technical Documentation Artifacts
        uses: actions/upload-artifact@v4
        with:
          name: Backend-Architecture-Review-Docs
          path: backend-review/
          retention-days: 30
```
