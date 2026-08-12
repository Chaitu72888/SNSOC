# SNSOC Project Architecture & Folder Structure

This document provides a clean, comprehensive overview of the repository directory layout for the **Backend Engine**, **Web Application**, **Android Application**, and **Automated Test Suites**.

---

## 📁 Repository High-Level Layout

```text
SOC_Project/
├── app.py                      # Flask Application Entrypoint & Startup
├── auth.py                     # Authentication Controller & Email Dispatch
├── config.py                   # Application Environment Configuration
├── extensions.py               # SocketIO & Rate Limiter Extensions
├── models.py                   # SQLAlchemy Database Schemas
├── render.yaml                 # Render Cloud Deployment Specification
├── requirements.txt            # Python Dependencies
├── snsoc.db                    # SQLite Local Database File
│
├── api/                        # REST API Blueprint Handlers
├── engine/                     # Traffic Capture & Threat Scorer Engine
├── firewall/                   # OS Firewall Adapters (Netsh/IPtables/None)
│
├── templates/                  # Web Application Jinja2 HTML Views
├── static/                     # Web Application CSS & JavaScript Assets
│
├── android_application/        # Native Android Mobile App (Java / Android Studio)
│
├── selenium-tests/             # Web UI End-to-End Automation Tests
├── appium-tests/               # Mobile UI Automation Tests (Android)
├── baseline_load_tests/        # Performance & Load Test Suite
└── Vulnerability Test Results/ # Security Review & Audit Reports
```

---

## 1. ⚙️ Flask Backend & Core Engine

The backend is built with Python 3, Flask 3, Flask-SocketIO (Eventlet), and SQLAlchemy.

* **[app.py](file:///d:/SNSOC/SOC_Project/app.py)**: Application factory, blueprint registrations, database migrations (`migrate_db`), initial seeding (`seed_db`), security headers, and background thread activation.
* **[auth.py](file:///d:/SNSOC/SOC_Project/auth.py)**: User authentication handling (`/auth/login`, `/auth/signup`, `/auth/logout`, `/auth/forgot-password`, `/auth/reset-password`). Includes secure `send_reset_email` helper using **SMTP** and **Resend API**.
* **[config.py](file:///d:/SNSOC/SOC_Project/config.py)**: Environment configuration loader for secret keys, session lifetime, AbuseIPDB keys, and email service options.
* **[extensions.py](file:///d:/SNSOC/SOC_Project/extensions.py)**: SocketIO (`cors_allowed_origins="*"`, `async_mode='eventlet'`) and Flask-Limiter instances.
* **[models.py](file:///d:/SNSOC/SOC_Project/models.py)**: Database models:
  * `Operator`: User authentication & reset token store.
  * `IDSRule`: Protected ports & rate threshold rules.
  * `APIDataLog`: Network API packet log history.
  * `PlatformSync`: Multi-platform status (Android App / Web Dashboard).
  * `DataUsageSetting`: Alert thresholds & refresh settings.
  * `Alert`: Security threat alerts.
  * `BlockedIP`: Active firewall IP blocklist.

### 🔌 REST API Router Blueprints (`api/`)
* **[api/dashboard.py](file:///d:/SNSOC/SOC_Project/api/dashboard.py)**: Endpoint `/api/dashboard` returning packet statistics, threat level, top source IPs, and alert counts.
* **[api/ids.py](file:///d:/SNSOC/SOC_Project/api/ids.py)**: Endpoints `/api/ids/rules` and `/api/ids/threshold` for viewing and managing IDS protection rules.
* **[api/intel.py](file:///d:/SNSOC/SOC_Project/api/intel.py)**: Endpoint `/api/intel/lookup` querying IP reputation via AbuseIPDB API with caching.
* **[api/block.py](file:///d:/SNSOC/SOC_Project/api/block.py)**: Endpoints `/api/blocked-ips` for adding/removing firewall IP blocks.
* **[api/telemetry.py](file:///d:/SNSOC/SOC_Project/api/telemetry.py)**: Endpoint `/api/telemetry/logs` for monitoring multi-platform data transfer logs.

### 🧠 Traffic Capture & Scorer Engine (`engine/`)
* **[engine/capture.py](file:///d:/SNSOC/SOC_Project/engine/capture.py)**: Live background thread simulating and capturing network packet statistics. Emits WebSocket `new_packet` events.
* **[engine/scorer.py](file:///d:/SNSOC/SOC_Project/engine/scorer.py)**: Calculates overall threat level (`LOW`, `MEDIUM`, `HIGH`, `CRITICAL`) based on packet volume, blocked IPs, and active alerts.
* **[engine/rules.py](file:///d:/SNSOC/SOC_Project/engine/rules.py)**: Evaluates incoming packets against IDS rules (protected ports, packet thresholds).
* **[engine/threat_intel.py](file:///d:/SNSOC/SOC_Project/engine/threat_intel.py)**: AbuseIPDB API integration handler with response caching.

### 🛡️ Firewall Drivers (`firewall/`)
* **[firewall/base.py](file:///d:/SNSOC/SOC_Project/firewall/base.py)**: Abstract base class interface for cross-platform firewall managers.
* **[firewall/netsh.py](file:///d:/SNSOC/SOC_Project/firewall/netsh.py)**: Windows Firewall integration (`netsh advfirewall firewall`).
* **[firewall/iptables.py](file:///d:/SNSOC/SOC_Project/firewall/iptables.py)**: Linux Firewall integration (`iptables`).
* **[firewall/none.py](file:///d:/SNSOC/SOC_Project/firewall/none.py)**: Safe fallback driver for local testing environments.

---

## 2. 🌐 Web Application Frontend

The web dashboard provides a real-time SOC interface built with responsive HTML5, modern vanilla CSS, Chart.js, and WebSocket connection.

### HTML Templates (`templates/`)
* **[templates/dashboard.html](file:///d:/SNSOC/SOC_Project/templates/dashboard.html)**: Main SOC Operations Dashboard featuring overview metrics, traffic charts, IDS rules management, Threat Intel lookups, and settings.
* **[templates/login.html](file:///d:/SNSOC/SOC_Project/templates/login.html)**: Secure Operator authentication login interface.
* **[templates/signup.html](file:///d:/SNSOC/SOC_Project/templates/signup.html)**: New Operator registration interface.
* **[templates/forgot_password.html](file:///d:/SNSOC/SOC_Project/templates/forgot_password.html)**: Passcode reset request view.
* **[templates/reset_password.html](file:///d:/SNSOC/SOC_Project/templates/reset_password.html)**: New passcode entry view with token validation.

### Static Assets (`static/`)
* **[static/style.css](file:///d:/SNSOC/SOC_Project/static/style.css)**: Unified dark-mode UI design system with curated HSL color palette, smooth transitions, and responsive grid layouts.
* **[static/charts.js](file:///d:/SNSOC/SOC_Project/static/charts.js)**: Dashboard interactive charts (Protocol Distribution Doughnut & Live Traffic Line Chart) updated in real-time via SocketIO.
* **[static/firebase-init.js](file:///d:/SNSOC/SOC_Project/static/firebase-init.js)**: Modular Firebase Web SDK initialization.

---

## 3. 📱 Android Mobile Application (`android_application/`)

Native Android Studio application built with Java, Retrofit2, and SocketIO under package `com.snsoc.app`.

```text
android_application/app/src/main/java/com/snsoc/app/
├── adapters/
│   ├── AlertsAdapter.java          # Security Alerts RecyclerView Adapter
│   ├── BlockedIpsAdapter.java      # Blocked IPs RecyclerView Adapter
│   └── TelemetryLogsAdapter.java   # Telemetry Logs RecyclerView Adapter
├── api/
│   ├── ApiService.java             # Retrofit REST API Interfaces
│   ├── RetrofitClient.java         # HTTP Client Singleton
│   └── SocketManager.java          # WebSocket Connection Manager
├── models/
│   ├── AlertItem.java              # Alert Data Model
│   ├── BlockedIpItem.java          # Blocked IP Data Model
│   ├── DashboardResponse.java      # Dashboard API Response Model
│   ├── IdsRulesResponse.java       # IDS Rules Response Model
│   ├── IntelResponse.java          # Threat Intel Response Model
│   ├── LoginRequest.java           # Login Payload Model
│   ├── LoginResponse.java          # Login Response Model
│   ├── TelemetryResponse.java      # Telemetry Response Model
│   └── ThresholdRequest.java       # Threshold Payload Model
├── ui/
│   ├── LoginActivity.java          # Mobile Login Screen Activity
│   ├── MainActivity.java           # Main Navigation Shell Activity
│   ├── DashboardFragment.java      # Mobile SOC Dashboard Fragment
│   ├── IdsFragment.java            # IDS Management Fragment
│   ├── IntelFragment.java          # Threat Intel Fragment
│   ├── TelemetryFragment.java      # Telemetry Logs Fragment
│   └── SettingsFragment.java       # App Settings Fragment
└── utils/
    └── NetworkUtils.java           # Network Status Helper Utilities
```

---

## 4. 🧪 Test Automation & CI/CD Pipelines

* **[selenium-tests/](file:///d:/SNSOC/SOC_Project/selenium-tests)**: Selenium Web UI test suite generating `selenium-test-report.xlsx`.
* **[appium-tests/](file:///d:/SNSOC/SOC_Project/appium-tests)**: Appium Mobile automation test suite generating `appium-test-report.xlsx`.
* **[baseline_load_tests/](file:///d:/SNSOC/SOC_Project/baseline_load_tests)**: Locust & HTTP performance load test suite generating `baseline-load-test-report.xlsx`.
* **[Vulnerability Test Results/](file:///d:/SNSOC/SOC_Project/Vulnerability Test Results)**: Security assessment docs generating `security-test-report.xlsx`.
* **[.github/workflows/](file:///d:/SNSOC/SOC_Project/.github/workflows)**: GitHub Actions workflow automating build, linting, test suite executions, and ZIP artifact creation.

---

## ☁️ Deployment & Infrastructure

* **[render.yaml](file:///d:/SNSOC/SOC_Project/render.yaml)**: Service specification for Render Cloud Deployment (`gunicorn app:app` with Python 3.10).
* **Render Live Service**: [https://snsoc-4.onrender.com](https://snsoc-4.onrender.com)
* **Local Development Server**: `http://localhost:5000`
