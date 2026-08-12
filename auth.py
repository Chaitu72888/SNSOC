import time
import secrets
import re
import os
import urllib.request
import json
from flask import Blueprint, request, jsonify, render_template, redirect, url_for, current_app
from flask_login import login_user, logout_user, login_required, current_user
from models import db, Operator
from extensions import socketio
import bcrypt

auth_bp = Blueprint('auth', __name__)

EMAIL_REGEX = re.compile(r"^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$")

# Active session tracking store
active_sessions = {}
last_auth_activity = {"event": "system_start", "user": "system", "timestamp": time.time()}

def get_active_sessions_count():
    now = time.time()
    expired = [k for k, v in active_sessions.items() if now - v.get('last_seen', 0) > 3600]
    for k in expired:
        del active_sessions[k]
    return len(active_sessions)

def emit_auth_event(event_type, username):
    global last_auth_activity
    last_auth_activity = {
        "event": event_type,
        "user": username,
        "timestamp": time.time()
    }
    try:
        socketio.emit('auth_update', {
            'event': event_type,
            'user': username,
            'timestamp': time.time(),
            'active_sessions': get_active_sessions_count(),
            'message': f'Operator {username} {event_type} live'
        })
    except Exception as e:
        print(f"[Socket.IO] Auth emit error: {e}")

@auth_bp.route('/auth/status', methods=['GET'])
@auth_bp.route('/api/auth/status', methods=['GET'])
def auth_status():
    """Real-time auth status endpoint for polling fallback and session health verification."""
    is_auth = current_user.is_authenticated
    username = current_user.name if is_auth else None
    
    if is_auth:
        active_sessions[current_user.id] = {
            'username': current_user.name,
            'last_seen': time.time()
        }

    return jsonify({
        "status": "success",
        "authenticated": is_auth,
        "username": username,
        "full_name": getattr(current_user, 'full_name', username) if is_auth else None,
        "active_sessions_count": max(1 if is_auth else 0, get_active_sessions_count()),
        "last_auth_activity": last_auth_activity,
        "timestamp": time.time()
    })

# ─── 1. SIGN IN ───────────────────────────────────────────────────────────────
@auth_bp.route('/auth/login', methods=['GET', 'POST'])
@auth_bp.route('/api/auth/login', methods=['GET', 'POST'])
def login():
    if request.method == 'GET':
        if current_user.is_authenticated:
            return redirect(url_for('dashboard'))
        google_client_id = os.environ.get('GOOGLE_CLIENT_ID', '') or current_app.config.get('GOOGLE_CLIENT_ID', '')
        return render_template('login.html', google_client_id=google_client_id)

        
    data = request.form if request.form else (request.get_json(silent=True) or {})
    username = (data.get('username') or '').strip().lower()
    password = data.get('password') or ''

    if not username or not password:
        err = "Please enter both Operator Name (email) and Passcode."
        if request.is_json:
            return jsonify({"status": "error", "error": err}), 400
        return render_template('login.html', error=err)

    if not EMAIL_REGEX.match(username):
        err = "Please enter a valid email address."
        if request.is_json:
            return jsonify({"status": "error", "error": err}), 400
        return render_template('login.html', error=err)

    operator = Operator.query.filter_by(name=username).first()
    if operator and operator.passcode_hash and bcrypt.checkpw(password.encode('utf-8'), operator.passcode_hash.encode('utf-8')):
        login_user(operator)
        active_sessions[operator.id] = {'username': operator.name, 'last_seen': time.time()}
        emit_auth_event('login', operator.name)

        if request.is_json:
            return jsonify({"status": "success", "user": operator.name, "redirect": url_for('dashboard')})
        return redirect(url_for('dashboard'))

    err = "Invalid credentials. Please check your Operator Name and Passcode."
    if request.is_json:
        return jsonify({"status": "error", "error": err}), 401
    return render_template('login.html', error=err)



# ─── 2. SIGN UP ───────────────────────────────────────────────────────────────
@auth_bp.route('/auth/signup', methods=['GET', 'POST'])
@auth_bp.route('/api/auth/signup', methods=['GET', 'POST'])
def signup():
    if request.method == 'GET':
        if current_user.is_authenticated:
            return redirect(url_for('dashboard'))
        google_client_id = os.environ.get('GOOGLE_CLIENT_ID', '') or current_app.config.get('GOOGLE_CLIENT_ID', '')
        return render_template('signup.html', google_client_id=google_client_id)


    data = request.form if request.form else (request.get_json(silent=True) or {})
    full_name = (data.get('full_name') or '').strip()
    username = (data.get('username') or '').strip().lower()
    password = data.get('password') or ''
    confirm_password = data.get('confirm_password') or ''

    # Validations
    if not full_name or not username or not password or not confirm_password:
        err = "All fields are required."
        if request.is_json: return jsonify({"status": "error", "error": err}), 400
        return render_template('signup.html', error=err)

    if not EMAIL_REGEX.match(username):
        err = "Please enter a valid email address."
        if request.is_json: return jsonify({"status": "error", "error": err}), 400
        return render_template('signup.html', error=err)

    if password != confirm_password:
        err = "Passcodes do not match."
        if request.is_json: return jsonify({"status": "error", "error": err}), 400
        return render_template('signup.html', error=err)

    if len(password) < 8 or not re.search(r'[0-9!@#$%^&*(),.?":{}|<>]', password):
        err = "Passcode must be at least 8 characters long and contain at least one number or special symbol."
        if request.is_json: return jsonify({"status": "error", "error": err}), 400
        return render_template('signup.html', error=err)

    existing = Operator.query.filter_by(name=username).first()
    if existing:
        err = "An account with this email already exists."
        if request.is_json: return jsonify({"status": "error", "error": err}), 409
        return render_template('signup.html', error=err)

    # Create user
    hashed = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
    operator = Operator(name=username, full_name=full_name, passcode_hash=hashed)
    db.session.add(operator)
    db.session.commit()

    login_user(operator)
    active_sessions[operator.id] = {'username': operator.name, 'last_seen': time.time()}
    emit_auth_event('signup', operator.name)

    if request.is_json:
        return jsonify({"status": "success", "user": operator.name, "redirect": url_for('dashboard')})
    return redirect(url_for('dashboard'))


import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

def send_reset_email(to_email, reset_url):
    """Sends passcode reset link to user email via SMTP or Resend API if configured."""
    resend_key = current_app.config.get('RESEND_API_KEY') or os.environ.get('RESEND_API_KEY', '')
    smtp_user = current_app.config.get('SMTP_USERNAME') or os.environ.get('SMTP_USERNAME', '')
    smtp_pass = current_app.config.get('SMTP_PASSWORD') or os.environ.get('SMTP_PASSWORD', '')

    subject = "SNSOC.live - Passcode Reset Request"
    body_text = f"Hello,\n\nYou requested a passcode reset for your SNSOC.live account.\nClick the link below to reset your passcode:\n{reset_url}\n\nThis link will expire in 1 hour.\nIf you did not request this, please ignore this email."
    body_html = f"""
    <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px; border: 1px solid #1e293b; background-color: #0f172a; color: #f8fafc; border-radius: 8px;">
        <h2 style="color: #3b82f6; margin-top: 0;">SNSOC.live Passcode Reset</h2>
        <p>Hello,</p>
        <p>You requested a passcode reset for your SNSOC.live account. Click the button below to reset your passcode:</p>
        <div style="text-align: center; margin: 25px 0;">
            <a href="{reset_url}" style="background-color: #3b82f6; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Reset Passcode</a>
        </div>
        <p style="font-size: 0.85rem; color: #94a3b8;">This link will expire in 1 hour. If you did not request a passcode reset, no action is required.</p>
    </div>
    """

    # 1. Try Resend API if key is set
    if resend_key:
        try:
            import requests
            from_address = os.environ.get('RESEND_FROM_EMAIL', 'onboarding@resend.dev')
            resp = requests.post(
                "https://api.resend.com/emails",
                headers={"Authorization": f"Bearer {resend_key}", "Content-Type": "application/json"},
                json={
                    "from": f"SNSOC Security <{from_address}>",
                    "to": [to_email],
                    "subject": subject,
                    "html": body_html,
                    "text": body_text
                },
                timeout=10
            )
            if resp.status_code in (200, 201):
                print(f"[AUTH EMAIL] Reset email successfully sent to {to_email} via Resend API")
                return True
        except Exception as e:
            print(f"[AUTH EMAIL ERROR] Failed to send via Resend API: {e}")

    # 2. Try SMTP if credentials are set
    if smtp_user and smtp_pass:
        try:
            smtp_server = current_app.config.get('SMTP_SERVER', 'smtp.gmail.com')
            smtp_port = current_app.config.get('SMTP_PORT', 587)
            sender = current_app.config.get('SMTP_SENDER', smtp_user)

            msg = MIMEMultipart('alternative')
            msg['Subject'] = subject
            msg['From'] = sender
            msg['To'] = to_email
            msg.attach(MIMEText(body_text, 'plain'))
            msg.attach(MIMEText(body_html, 'html'))

            with smtplib.SMTP(smtp_server, smtp_port, timeout=10) as server:
                server.starttls()
                server.login(smtp_user, smtp_pass)
                server.sendmail(sender, [to_email], msg.as_string())
            print(f"[AUTH EMAIL] Reset email successfully sent to {to_email} via SMTP ({smtp_server})")
            return True
        except Exception as e:
            print(f"[AUTH EMAIL ERROR] Failed to send via SMTP: {e}")

    print(f"[AUTH EMAIL NOTE] No email credentials configured (SMTP_USERNAME / RESEND_API_KEY). Reset link generated securely.")
    return False


# ─── 3. FORGOT PASSWORD & RESET PASSWORD ─────────────────────────────────────
@auth_bp.route('/auth/forgot-password', methods=['GET', 'POST'])
@auth_bp.route('/api/auth/forgot-password', methods=['GET', 'POST'])
def forgot_password():
    if request.method == 'GET':
        return render_template('forgot_password.html')

    data = request.form if request.form else (request.get_json(silent=True) or {})
    username = (data.get('username') or '').strip().lower()

    if not username or not EMAIL_REGEX.match(username):
        err = "Please enter a valid email address."
        if request.is_json: return jsonify({"status": "error", "error": err}), 400
        return render_template('forgot_password.html', error=err)

    operator = Operator.query.filter_by(name=username).first()
    if operator:
        token = secrets.token_hex(32)
        operator.reset_token = token
        operator.reset_token_expiry = time.time() + 86400 # 24 hours expiry
        db.session.commit()

        reset_url = url_for('auth.reset_password', token=token, _external=True)
        send_reset_email(username, reset_url)

    # Security practice: don't disclose whether email exists & never return token/link
    msg = "If an account exists with that email, a passcode reset link has been sent."
    if request.is_json: return jsonify({"status": "success", "message": msg})
    return render_template('forgot_password.html', success=msg)


@auth_bp.route('/auth/reset-password/<token>', methods=['GET', 'POST'])
@auth_bp.route('/api/auth/reset-password/<token>', methods=['GET', 'POST'])
def reset_password(token):
    operator = Operator.query.filter_by(reset_token=token).first()
    
    # Check token validity
    if not operator or not operator.reset_token_expiry or time.time() > operator.reset_token_expiry:
        err = "Invalid or expired reset token. If you requested multiple resets, please click the link in your LATEST email."
        if request.method == 'POST' and request.is_json:
            return jsonify({"status": "error", "error": err}), 400
        return render_template('reset_password.html', error=err, invalid_token=True)

    if request.method == 'GET':
        return render_template('reset_password.html', token=token)

    data = request.form if request.form else (request.get_json(silent=True) or {})
    password = data.get('password') or ''
    confirm_password = data.get('confirm_password') or ''

    if not password or not confirm_password:
        err = "Both passcode fields are required."
        if request.is_json: return jsonify({"status": "error", "error": err}), 400
        return render_template('reset_password.html', error=err, token=token)

    if password != confirm_password:
        err = "Passcodes do not match."
        if request.is_json: return jsonify({"status": "error", "error": err}), 400
        return render_template('reset_password.html', error=err, token=token)

    if len(password) < 8 or not re.search(r'[0-9!@#$%^&*(),.?":{}|<>]', password):
        err = "Passcode must be at least 8 characters long and contain at least one number or special symbol."
        if request.is_json: return jsonify({"status": "error", "error": err}), 400
        return render_template('reset_password.html', error=err, token=token)

    # Update password and clear token
    hashed = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
    operator.passcode_hash = hashed
    operator.reset_token = None
    operator.reset_token_expiry = None
    db.session.commit()

    msg = "Passcode reset successfully. You can now sign in."
    if request.is_json:
        return jsonify({"status": "success", "message": msg, "redirect": url_for('auth.login')})
    return render_template('login.html', success=msg)



# ─── 4. GOOGLE OAUTH ─────────────────────────────────────────────────────────
@auth_bp.route('/api/auth/google', methods=['POST'])
@auth_bp.route('/auth/google', methods=['POST'])
def google_auth():
    data = request.get_json(silent=True) or request.form
    credential = data.get('credential') or data.get('id_token')
    access_token = data.get('access_token')
    
    if not credential and not access_token:
        print("[Google OAuth Error] Neither credential ID token nor access_token was provided.")
        return jsonify({"status": "error", "error": "Missing Google credential or access token"}), 400

    token_data = {}
    try:
        if credential:
            # 1. Verify Google ID token via Google tokeninfo API endpoint
            google_verify_url = f"https://oauth2.googleapis.com/tokeninfo?id_token={credential}"
            req = urllib.request.Request(google_verify_url)
            with urllib.request.urlopen(req) as resp:
                token_data = json.loads(resp.read().decode('utf-8'))
        elif access_token:
            # 2. Verify Google OAuth2 Access token via Google userinfo API endpoint
            userinfo_url = f"https://www.googleapis.com/oauth2/v3/userinfo?access_token={access_token}"
            req = urllib.request.Request(userinfo_url)
            with urllib.request.urlopen(req) as resp:
                token_data = json.loads(resp.read().decode('utf-8'))

        email = (token_data.get('email') or '').lower().strip()
        google_id = token_data.get('sub')
        full_name = token_data.get('name') or email.split('@')[0] if email else 'Google User'

        print(f"[Google OAuth] Verified token for email: {email}, google_id: {google_id}")

        if not email:
            return jsonify({"status": "error", "error": "Unable to verify email address from Google account"}), 400

        operator = Operator.query.filter_by(name=email).first()
        if not operator:
            # Create new operator for Google user
            operator = Operator(name=email, full_name=full_name, google_id=google_id)
            db.session.add(operator)
            db.session.commit()
            print(f"[Google OAuth] Created new Operator record for {email}")
        else:
            if not operator.google_id:
                operator.google_id = google_id
            if full_name and not operator.full_name:
                operator.full_name = full_name
            db.session.commit()

        login_user(operator)
        active_sessions[operator.id] = {'username': operator.name, 'last_seen': time.time()}
        emit_auth_event('google_login', operator.name)

        return jsonify({"status": "success", "user": operator.name, "redirect": url_for('dashboard')})
    except urllib.error.HTTPError as he:
        err_body = he.read().decode('utf-8') if hasattr(he, 'read') else str(he)
        print(f"[Google OAuth Verification HTTP Error] Code: {he.code}, Body: {err_body}")
        return jsonify({"status": "error", "error": f"Google token verification failed ({he.code}): {err_body}"}), 400
    except Exception as e:
        print(f"[Google OAuth Error] Exception: {e}")
        return jsonify({"status": "error", "error": f"Google authentication failed: {str(e)}"}), 400



# ─── 5. LOGOUT ────────────────────────────────────────────────────────────────
@auth_bp.route('/auth/logout', methods=['GET', 'POST'])
@auth_bp.route('/api/auth/logout', methods=['GET', 'POST'])
@login_required

def logout():
    user_name = current_user.name if current_user.is_authenticated else "Operator"
    user_id = current_user.id if current_user.is_authenticated else None
    
    if user_id in active_sessions:
        del active_sessions[user_id]
        
    logout_user()
    emit_auth_event('logout', user_name)

    if request.is_json:
        return jsonify({"status": "success", "redirect": url_for('auth.login')})
    return redirect(url_for('auth.login'))


