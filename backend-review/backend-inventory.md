# Backend Inventory Report

## Executive Summary
This document provides a comprehensive technical inventory of the **SNSOC Security Operations Center** backend codebase located in `SOC_Project`.

---

## 🛠️ Technology Stack

| Layer | Technology | Details |
| :--- | :--- | :--- |
| **Language** | Python 3.10+ | Primary backend programming language |
| **Framework** | Flask 3.0+ | Microservices web framework |
| **WSGI Server** | Gunicorn 21.2.0 | Production HTTP / WSGI application server |
| **Database** | SQLite (`snsoc.db`) | Relational database (SQLite 3) |
| **ORM** | Flask-SQLAlchemy 3.1+ | Object-Relational Mapping & DB session management |
| **Authentication** | Flask-Login 0.6.3 + Bcrypt 4.1 | Session-based cookie authentication & password hashing |
| **Real-time WebSockets** | Flask-SocketIO 5.3+ | Real-time threat stats & packet streaming |
| **Network Engine** | Scapy 2.5+ | Live packet capture and protocol analyzer |
| **Rate Limiting** | Flask-Limiter 3.5+ | Endpoint rate limiting and request throttling |
| **ML Engine** | Scikit-Learn 1.4+ / NumPy 1.26 | Threat scoring & anomaly detection |
| **IP Geo Location** | GeoIP2 4.8+ | IP location & country mapping |

---

## 📁 Project Directory Structure

```
SOC_Project/
├── app.py                  # Primary application entry point & context builder
├── config.py               # Centralized configuration & environment loader
├── auth.py                 # Operator authentication blueprint
├── models.py               # Database schemas (Operator, Alert, IDSRule, APIDataLog, etc.)
├── extensions.py           # Shared Flask extensions
├── requirements.txt        # Python dependency manifest
├── render.yaml             # Render cloud deployment blueprint
├── api/                    # Modular API Blueprints
│   ├── dashboard.py        # Dashboard stats & alert endpoints
│   ├── ids.py              # Intrusion Detection System rule management
│   ├── intel.py            # Threat Intelligence lookup & AbuseIPDB proxy
│   ├── block.py            # IP blocking & firewall rule management
│   └── telemetry.py        # Cross-platform data consumption & sync API
├── engine/                 # Network Analysis & Threat Engine
│   ├── capture.py          # Background packet capture thread (Scapy)
│   ├── scorer.py           # ML Threat Level calculation engine
│   ├── threat_intel.py     # Threat intel scoring algorithm
│   └── rules.py            # Rule engine matcher
├── firewall/               # Operating System Firewall Integration
│   ├── base.py             # Abstract firewall interface
│   ├── netsh.py            # Windows Firewall (netsh advfirewall) driver
│   └── none.py             # No-op fallback firewall driver
├── templates/              # HTML Jinja2 templates (dashboard.html, login.html)
└── static/                 # Static CSS, JS, and chart rendering assets
```

---

## 🔐 Security & Middleware Inventory

- **Session Handling**: Flask encrypted session cookie signed via `SECRET_KEY`.
- **Password Hashing**: Bcrypt with salted hashes (`bcrypt.hashpw`).
- **CORS Middleware**: Explicit `after_request` hook adding `Access-Control-Allow-Origin: *`.
- **Rate Limiting**: Integrated `Flask-Limiter` for request throttling.
- **Third-Party Integrations**:
  - `AbuseIPDB API` (Optional live IP reputation checks).
  - `GeoIP2` database for IP geolocations.
