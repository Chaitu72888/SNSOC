# Dependency Summary & Maintenance Observations

## 1. Dependency Inventory

The application dependencies are defined in `SOC_Project/requirements.txt`:

```text
Flask>=3.0
gunicorn>=21.2.0
Flask-SQLAlchemy>=3.1
Flask-Login>=0.6.3
Flask-SocketIO>=5.3
Flask-Limiter>=3.5
python-dotenv>=1.0
werkzeug>=3.0
bcrypt>=4.1
scikit-learn>=1.4
numpy>=1.26
scapy>=2.5
requests>=2.31
geoip2>=4.8
```

---

## 2. Package Health Analysis

| Package | Minimum Version | Category | Purpose | Maintenance Recommendation |
| :--- | :--- | :--- | :--- | :--- |
| **Flask** | `3.0` | Core Web Framework | WSGI application routing & blueprint management | Keep updated to latest 3.x release. |
| **Gunicorn** | `21.2.0` | WSGI Server | Multi-process production HTTP server | Up-to-date. Ensure worker process scaling (`-w 4`). |
| **Flask-SQLAlchemy**| `3.1` | Database ORM | Database models and connection session management | Up-to-date. |
| **Flask-Login** | `0.6.3` | Authentication | Operator session cookie management | Up-to-date. |
| **Flask-SocketIO**| `5.3` | Real-time Sockets | WebSocket event handler for live packet stream | Up-to-date. Ensure eventlet/gevent installed if needed. |
| **Bcrypt** | `4.1` | Cryptography | Secure password hashing & verification | Up-to-date. Strong salted hashing algorithm. |
| **Scapy** | `2.5` | Networking | Asynchronous packet sniffing engine | Requires root/Administrator privileges on physical interfaces. |

---

## 3. Maintenance Recommendations
- Pin exact dependency versions using `pip freeze > requirements.lock` or `uv pip compile` to ensure reproducible builds in CI/CD.
- Regularly run `pip list --outdated` to monitor upstream patches.
