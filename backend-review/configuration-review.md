# Configuration & Quality Review

## 1. Overview
This report reviews the environment variable management, secret keys, CORS settings, database configuration, and logging defaults across the SNSOC codebase.

---

## 2. Configuration Analysis Matrix

| Setting Area | Current Implementation | Status | Recommendation |
| :--- | :--- | :---: | :--- |
| **Secret Key** | Fallback to `'dev-secret-key-change-in-production'` | ⚠️ Weak Default | Require `SECRET_KEY` in environment; block startup if default is used in production. |
| **CORS Policy** | `Access-Control-Allow-Origin: *` hardcoded in `app.py` | ⚠️ Permissive | Restrict allowed origins to specific trusted web/mobile domain origins. |
| **Database URI** | Defaults to `sqlite:///snsoc.db` | ℹ️ SQLite | Production deployments should migrate to PostgreSQL or MySQL for concurrency. |
| **Debug Mode** | Environment controlled (`DEBUG = True/False`) | ✅ Configured | Ensure `FLASK_DEBUG=0` in production environments. |
| **API Credentials** | `ABUSEIPDB_API_KEY` read via `os.environ` | ✅ Externalized | Keep API keys strictly in environment variables or cloud secrets manager. |
| **HTTPS Assumptions** | Standard HTTP headers returned | ⚠️ Missing HSTS | Enable Flask-Talisman or set HTTP Strict Transport Security (HSTS) headers. |

---

## 3. Environment Variables Reference

```bash
# Recommended Production Setup
FLASK_ENV=production
SECRET_KEY=super-secret-cryptographically-secure-random-key
DATABASE_URL=sqlite:///snsoc.db
PORT=5000
ABUSEIPDB_API_KEY=your_optional_abuseipdb_key
MOCK_TI_MODE=true
```
