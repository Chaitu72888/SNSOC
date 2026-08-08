# Secure Coding & Architecture Recommendations

This document details recommendations for hardening authentication, session security, CORS policies, input validation, and database operations.

---

## 1. Authentication & Session Hardening

### 1.1 Require Strong Secret Key
Currently `config.py` defaults to `'dev-secret-key-change-in-production'` if `SECRET_KEY` is not present in environment variables.

**Recommended Pattern**:
```python
import os

class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY')
    if not SECRET_KEY:
        if os.environ.get('FLASK_ENV') == 'production':
            raise RuntimeError("CRITICAL: SECRET_KEY must be set in environment variables for production!")
        SECRET_KEY = 'dev-only-local-secret-key'
```

### 1.2 Session Cookie Security Flags
Configure Flask session cookies with `Secure`, `HttpOnly`, and `SameSite` flags:

```python
app.config.update(
    SESSION_COOKIE_SECURE=True,      # Requires HTTPS
    SESSION_COOKIE_HTTPONLY=True,    # Prevents XSS cookie access
    SESSION_COOKIE_SAMESITE='Lax',   # Prevents CSRF attacks
)
```

---

## 2. Restrictive CORS Policy

Currently `app.py` applies a global wildcard CORS header:
```python
@app.after_request
def add_cors_headers(response):
    response.headers['Access-Control-Allow-Origin'] = '*'
```

**Recommended Pattern**:
```python
ALLOWED_ORIGINS = os.environ.get('ALLOWED_ORIGINS', 'http://localhost:5000,https://snsoc.live').split(',')

@app.after_request
def add_cors_headers(response):
    origin = request.headers.get('Origin')
    if origin in ALLOWED_ORIGINS:
        response.headers['Access-Control-Allow-Origin'] = origin
        response.headers['Access-Control-Allow-Credentials'] = 'true'
    response.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization, X-Platform'
    response.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS'
    return response
```

---

## 3. Strict Input Validation & Schema Checking

Use `marshmallow` or `pydantic` for strict payload validation on API endpoints:

```python
def validate_ip(ip_str):
    import ipaddress
    try:
        ipaddress.ip_address(ip_str)
        return True
    except ValueError:
        return False
```

---

## 4. Security Response Headers

Integrate security headers using Flask-Talisman or custom headers:
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: SAMEORIGIN`
- `Content-Security-Policy: default-src 'self'`
- `Strict-Transport-Security: max-age=31536000; includeSubDomains`
