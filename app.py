import eventlet
if not eventlet.patcher.is_monkey_patched('socket'):
    eventlet.monkey_patch()

import os
import sys
import json
import time
from dotenv import load_dotenv
load_dotenv()

# Add backend directory to Python sys.path
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(BASE_DIR, 'backend'))

from flask import Flask, render_template, redirect, url_for, request, jsonify
from extensions import socketio
from flask_login import LoginManager, login_required
from config import Config
from models import db, Operator, IDSRule, APIDataLog, PlatformSync, DataUsageSetting
import bcrypt

app = Flask(
    __name__,
    template_folder=os.path.join('frontend', 'templates'),
    static_folder=os.path.join('frontend', 'static')
)
app.config.from_object(Config)


db.init_app(app)

login_manager = LoginManager()
login_manager.login_view = 'auth.login'
login_manager.init_app(app)

socketio.init_app(app)

@app.route('/api/ping', methods=['GET', 'POST', 'OPTIONS'])
def keep_alive_ping():
    """Keep-alive endpoint to prevent Render free-tier instance spin-down during active sessions."""
    return jsonify({
        "status": "active",
        "service": "SNSOC-Backend",
        "timestamp": time.time()
    })

@app.route('/health', methods=['GET'])
def health_check():
    """Public health check endpoint for external monitoring (e.g. UptimeRobot / cron-job.org)."""
    from engine.capture import get_packet_stats
    stats = get_packet_stats()
    return jsonify({
        "status": "healthy",
        "service": "SNSOC.live",
        "timestamp": time.time(),
        "db_connected": True,
        "packets_evaluated": stats.get('total_packets', 0)
    }), 200


@login_manager.user_loader
def load_user(user_id):
    return db.session.get(Operator, int(user_id))


@app.after_request
def add_security_headers(response):
    origin = request.headers.get('Origin')
    allowed_origins = [
        'https://snsoc-4.onrender.com',
        'http://127.0.0.1:5000',
        'http://localhost:5000'
    ]
    if origin in allowed_origins:
        response.headers['Access-Control-Allow-Origin'] = origin
        response.headers['Access-Control-Allow-Credentials'] = 'true'
    else:
        response.headers['Access-Control-Allow-Origin'] = 'https://snsoc-4.onrender.com'

    response.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization, X-Platform'
    response.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS'
    
    # Security Response Headers
    response.headers['X-Frame-Options'] = 'DENY'
    response.headers['X-Content-Type-Options'] = 'nosniff'
    response.headers['Referrer-Policy'] = 'strict-origin-when-cross-origin'
    response.headers['Permissions-Policy'] = 'geolocation=(), camera=(), microphone=()'
    return response


def seed_db():
    admin = Operator.query.filter_by(name='sivachaitanya72@gmail.com').first()
    hashed = bcrypt.hashpw('siva2580'.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
    if not admin:
        admin = Operator(name='sivachaitanya72@gmail.com', full_name='Siva Chaitanya', passcode_hash=hashed)
        db.session.add(admin)
    else:
        admin.passcode_hash = hashed
    db.session.commit()


    
    if not IDSRule.query.filter_by(rule_type='protected_port').first():
        for port in [22, 23, 445, 3389]:
            db.session.add(IDSRule(rule_type='protected_port', value=str(port)))
    
    if not IDSRule.query.filter_by(rule_type='threshold').first():
        db.session.add(IDSRule(rule_type='threshold', value=json.dumps({"max_packets": 100, "window_seconds": 10})))

    if not DataUsageSetting.query.first():
        db.session.add(DataUsageSetting(low_data_mode=False, refresh_interval='30s', wifi_only_sync=True, alert_threshold_mb=50.0))

    if not PlatformSync.query.first():
        db.session.add(PlatformSync(platform='Android App', last_sync=time.time() - 120, last_transferred_bytes=25088, sync_status='In Sync'))
        db.session.add(PlatformSync(platform='Web Dashboard', last_sync=time.time() - 45, last_transferred_bytes=39520, sync_status='In Sync'))

    if not APIDataLog.query.first():
        now = time.time()
        seeds = [
            APIDataLog(timestamp=now - 600, endpoint='/api/intel/lookup', platform='Android App', bytes_sent=420, bytes_recv=1840, ip='185.15.1.100', zone='Zone 1 (Main Stadium)', status='Malicious', score=88),
            APIDataLog(timestamp=now - 1500, endpoint='/api/intel/lookup', platform='Web Dashboard', bytes_sent=310, bytes_recv=1120, ip='8.8.8.8', zone='Zone 2 (Concourse)', status='Clean', score=0),
            APIDataLog(timestamp=now - 3600, endpoint='/api/intel/lookup', platform='Android App', bytes_sent=510, bytes_recv=2150, ip='192.168.1.45', zone='Zone 3 (VIP Lounge)', status='Suspicious', score=45),
            APIDataLog(timestamp=now - 7200, endpoint='/api/intel/lookup', platform='Android App', bytes_sent=430, bytes_recv=1920, ip='45.33.32.156', zone='Zone 1 (Main Stadium)', status='Malicious', score=92),
            APIDataLog(timestamp=now - 14400, endpoint='/api/intel/lookup', platform='Web Dashboard', bytes_sent=340, bytes_recv=1280, ip='1.1.1.1', zone='Zone 2 (Concourse)', status='Clean', score=0)
        ]
        db.session.add_all(seeds)

    db.session.commit()

# Register Blueprints
from auth import auth_bp
from backend.api.dashboard import dashboard_bp
from backend.api.ids import ids_bp
from backend.api.intel import intel_bp
from backend.api.block import block_bp
from backend.api.telemetry import telemetry_bp

app.register_blueprint(auth_bp)
app.register_blueprint(dashboard_bp, url_prefix='/api')
app.register_blueprint(ids_bp, url_prefix='/api/ids')
app.register_blueprint(intel_bp, url_prefix='/api/intel')
app.register_blueprint(block_bp, url_prefix='/api')
app.register_blueprint(telemetry_bp, url_prefix='/api/telemetry')


@app.route('/')
@login_required
def dashboard():
    return render_template('dashboard.html')

def migrate_db():
    try:
        connection = db.engine.raw_connection()
        cursor = connection.cursor()
        cursor.execute("PRAGMA table_info(operator)")
        columns = [col[1] for col in cursor.fetchall()]
        if 'full_name' not in columns:
            cursor.execute("ALTER TABLE operator ADD COLUMN full_name VARCHAR(128)")
        if 'reset_token' not in columns:
            cursor.execute("ALTER TABLE operator ADD COLUMN reset_token VARCHAR(128)")
        if 'reset_token_expiry' not in columns:
            cursor.execute("ALTER TABLE operator ADD COLUMN reset_token_expiry FLOAT")
        if 'google_id' not in columns:
            cursor.execute("ALTER TABLE operator ADD COLUMN google_id VARCHAR(128)")
        connection.commit()
    except Exception as e:
        print(f"[DB Migration Note] {e}")

with app.app_context():
    db.create_all()
    migrate_db()
    seed_db()
    from engine.capture import init_packet_stats
    init_packet_stats(app)


# Start background tasks
from engine.capture import start_capture_thread
from engine.scorer import start_stats_thread
start_capture_thread(app, socketio)
start_stats_thread(app, socketio)

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    socketio.run(app, host='0.0.0.0', port=port)

