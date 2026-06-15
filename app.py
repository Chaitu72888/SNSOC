from flask import Flask, render_template, redirect, url_for
from flask_socketio import SocketIO
from flask_login import LoginManager, login_required
from config import Config
from models import db, Operator, IDSRule
import bcrypt
import json

socketio = SocketIO(cors_allowed_origins=["http://localhost:3000", "http://127.0.0.1:5000"])

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    db.init_app(app)

    login_manager = LoginManager()
    login_manager.login_view = 'auth.login'
    login_manager.init_app(app)

    @login_manager.user_loader
    def load_user(user_id):
        return Operator.query.get(int(user_id))

    with app.app_context():
        db.create_all()
        seed_db()

    # Register Blueprints
    from auth import auth_bp
    from api.dashboard import dashboard_bp
    from api.ids import ids_bp
    from api.intel import intel_bp
    from api.block import block_bp

    app.register_blueprint(auth_bp, url_prefix='/auth')
    app.register_blueprint(dashboard_bp, url_prefix='/api')
    app.register_blueprint(ids_bp, url_prefix='/api/ids')
    app.register_blueprint(intel_bp, url_prefix='/api/intel')
    app.register_blueprint(block_bp, url_prefix='/api')

    @app.route('/')
    @login_required
    def dashboard():
        return render_template('dashboard.html')

    socketio.init_app(app)
    
    # Start background tasks
    from engine.capture import start_capture_thread
    from engine.scorer import start_stats_thread
    start_capture_thread(app, socketio)
    start_stats_thread(app, socketio)

    return app

def seed_db():
    if not Operator.query.first():
        hashed = bcrypt.hashpw('siva2580'.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
        admin = Operator(name='sivachaitanya72@gmail.com', passcode_hash=hashed)
        db.session.add(admin)
    
    if not IDSRule.query.filter_by(rule_type='protected_port').first():
        for port in [22, 23, 445, 3389]:
            db.session.add(IDSRule(rule_type='protected_port', value=str(port)))
    
    if not IDSRule.query.filter_by(rule_type='threshold').first():
        db.session.add(IDSRule(rule_type='threshold', value=json.dumps({"max_packets": 100, "window_seconds": 10})))
    
    db.session.commit()

if __name__ == '__main__':
    app = create_app()
    socketio.run(app, debug=True, host='127.0.0.1', port=5000, use_reloader=False)
