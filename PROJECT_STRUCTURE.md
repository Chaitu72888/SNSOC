# SNSOC Project Architecture & Folder Structure

This document provides a clean, comprehensive overview of the repository directory layout for the **Backend Engine**, **Web Application**, **Android Applications (Native & Capacitor)**, and **Automated Test Suites**.

---

## 📁 Repository High-Level Layout

```text
SOC_Project/
├── app.py                      # Flask Application Entrypoint & Startup
├── render.yaml                 # Render Cloud Deployment Specification
├── requirements.txt            # Python Dependencies
├── snsoc.db                    # SQLite Local Database File
├── SNSOC_Live.apk              # 📱 Standalone Android APK (Ready for USB/WhatsApp transfer)
├── PROJECT_STRUCTURE.md        # Architecture & Folder Guide
│
├── capacitor_app/              # Hybrid Capacitor Mobile App Project
│   ├── capacitor.config.json   # Capacitor App Settings (App ID: com.snsoc.live)
│   ├── www/                    # Web App Assets & Splash Loader
│   └── android/                # Native Android Studio Project Root for Capacitor
│
├── backend/                    # Core Python Backend Modules
│   ├── auth.py                 # Authentication Controller & Email Dispatch
│   ├── config.py               # Environment Configuration Loader
│   ├── extensions.py           # SocketIO & Rate Limiter Extensions
│   ├── models.py               # SQLAlchemy Database Schemas
│   ├── api/                    # REST API Blueprint Handlers (dashboard, ids, intel, block, telemetry)
│   ├── engine/                 # Traffic Capture & Threat Scorer Engine
│   └── firewall/               # OS Firewall Adapters (Netsh/IPtables/None)
│
├── frontend/                   # Web Application Assets
│   ├── templates/              # Web Application Jinja2 HTML Views
│   ├── static/                 # Web Application CSS & JavaScript Assets
│   └── src/                    # Web Client Configuration
│
├── android/                    # Native Android Mobile App (Java / Android Studio)
│   └── android_application/    # Native Android Project Root
│
└── tests/                      # Automated Testing Suites & Security Audits
    ├── selenium-tests/         # Web UI End-to-End Automation Tests
    ├── appium-tests/           # Mobile UI Automation Tests (Android)
    ├── baseline_load_tests/    # Performance & Load Test Suite
    └── security-tests/         # Security Review & Audit Reports
```

---

## 📱 Capacitor Mobile App & APK Delivery

* **App ID**: `com.snsoc.live`
* **App Name**: `SNSOC Live`
* **Target Server**: `https://snsoc-4.onrender.com`
* **APK File Location**: [SNSOC_Live.apk](file:///d:/SNSOC/SOC_Project/SNSOC_Live.apk) (Size: ~4.1 MB)

### Transfer Methods:
1. **USB Cable**: Connect your phone to your PC in File Transfer (MTP) mode and copy `SNSOC_Live.apk` to your phone's Downloads folder.
2. **WhatsApp**: Attach `SNSOC_Live.apk` as a **Document** in WhatsApp Desktop or Web and send it to your phone.
