from flask_sqlalchemy import SQLAlchemy
from flask_login import UserMixin
from datetime import datetime

db = SQLAlchemy()

class Operator(UserMixin, db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(64), unique=True, nullable=False)
    passcode_hash = db.Column(db.String(128), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    force_password_change = db.Column(db.Boolean, default=True)

class Alert(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    timestamp = db.Column(db.Float, nullable=False)
    title = db.Column(db.String(128), nullable=False)
    message = db.Column(db.Text, nullable=False)
    severity = db.Column(db.String(32), nullable=False)
    src_ip = db.Column(db.String(64), nullable=False)
    dst_ip = db.Column(db.String(64), nullable=True)
    dst_port = db.Column(db.Integer, nullable=True)
    protocol = db.Column(db.String(16), nullable=True)
    status = db.Column(db.String(32), default='new')
    rule_name = db.Column(db.String(64), nullable=False)

    def to_dict(self):
        return {
            'id': self.id,
            'timestamp': self.timestamp,
            'title': self.title,
            'message': self.message,
            'severity': self.severity,
            'src_ip': self.src_ip,
            'dst_ip': self.dst_ip,
            'dst_port': self.dst_port,
            'protocol': self.protocol,
            'status': self.status,
            'rule_name': self.rule_name
        }

class BlockedIP(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    ip = db.Column(db.String(64), unique=True, nullable=False)
    reason = db.Column(db.String(256), nullable=True)
    blocked_at = db.Column(db.DateTime, default=datetime.utcnow)
    blocked_by = db.Column(db.String(64), nullable=True)

    def to_dict(self):
        return {
            'id': self.id,
            'ip': self.ip,
            'reason': self.reason,
            'blocked_at': self.blocked_at.isoformat() if self.blocked_at else None,
            'blocked_by': self.blocked_by
        }

class IDSRule(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    rule_type = db.Column(db.String(64), nullable=False) # 'protected_port' or 'threshold'
    value = db.Column(db.Text, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
