# Production Deployment Checklist

Use this checklist prior to deploying the **SNSOC** application to staging or production environments.

---

## 📋 Deployment Verification Items

### 1. Environment & Configuration
- [ ] `FLASK_ENV` set to `production`.
- [ ] `SECRET_KEY` set to a strong, random 64-character string in environment variables.
- [ ] `FLASK_DEBUG` disabled (`0`).
- [ ] `ABUSEIPDB_API_KEY` configured in environment secrets.
- [ ] `MOCK_TI_MODE` set to `false` for live threat intelligence lookups.

### 2. Database & Storage
- [ ] Database migrations applied and verified.
- [ ] DB connection pool limits configured.
- [ ] Data directory permissions restricted to runtime user (`chmod 700`).

### 3. Server & Networking
- [ ] Gunicorn bound to `0.0.0.0:5000` with 4 worker processes (`gunicorn -w 4 app:app`).
- [ ] Reverse proxy (Nginx or Cloudflare) configured for SSL/TLS termination (HTTPS).
- [ ] Port 5000 blocked from public WAN access (accessible only via reverse proxy).
- [ ] WebSocket proxy headers (`Upgrade`, `Connection`) configured in Nginx for Socket.IO.

### 4. Render Cloud Blueprint Verification (`render.yaml`)
- [ ] `type: web` service configured.
- [ ] `env: python` environment selected.
- [ ] `buildCommand: pip install -r requirements.txt`.
- [ ] `startCommand: gunicorn app:app`.
