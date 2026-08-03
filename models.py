from flask_sqlalchemy import SQLAlchemy
from flask_login import UserMixin
from datetime import datetime
import time

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
    
    # SOC Features
    attack_type = db.Column(db.String(64), nullable=True)
    mitre_tactic = db.Column(db.String(64), nullable=True)
    mitre_technique = db.Column(db.String(64), nullable=True)
    resolved_at = db.Column(db.Float, nullable=True)

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
            'rule_name': self.rule_name,
            'attack_type': self.attack_type,
            'mitre_tactic': self.mitre_tactic,
            'mitre_technique': self.mitre_technique
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

class HistoricalAnalytics(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    timestamp = db.Column(db.Float, default=time.time)
    threat_score = db.Column(db.Float, nullable=False)
    active_alerts = db.Column(db.Integer, nullable=False)
    total_packets = db.Column(db.Integer, nullable=False)
    blocked_ips_count = db.Column(db.Integer, nullable=False)

class SecurityMetric(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    metric_name = db.Column(db.String(64), unique=True, nullable=False)
    metric_value = db.Column(db.Float, nullable=False)
    last_updated = db.Column(db.Float, default=time.time)

class APIDataLog(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    timestamp = db.Column(db.Float, default=time.time)
    endpoint = db.Column(db.String(128), nullable=False)
    platform = db.Column(db.String(32), nullable=False) # 'Android App' or 'Web Dashboard'
    bytes_sent = db.Column(db.Integer, default=0)
    bytes_recv = db.Column(db.Integer, default=0)
    ip = db.Column(db.String(64), nullable=True)
    zone = db.Column(db.String(64), nullable=True)
    status = db.Column(db.String(32), default='Clean')
    score = db.Column(db.Integer, default=0)

    def to_dict(self):
        return {
            'id': self.id,
            'timestamp': self.timestamp,
            'endpoint': self.endpoint,
            'platform': self.platform,
            'bytes_sent': self.bytes_sent,
            'bytes_recv': self.bytes_recv,
            'ip': self.ip,
            'zone': self.zone,
            'status': self.status,
            'score': self.score
        }

class PlatformSync(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    platform = db.Column(db.String(32), unique=True, nullable=False)
    last_sync = db.Column(db.Float, default=time.time)
    last_transferred_bytes = db.Column(db.Integer, default=0)
    sync_status = db.Column(db.String(32), default='In Sync')

    def to_dict(self):
        return {
            'id': self.id,
            'platform': self.platform,
            'last_sync': self.last_sync,
            'last_transferred_bytes': self.last_transferred_bytes,
            'sync_status': self.sync_status
        }

class DataUsageSetting(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    low_data_mode = db.Column(db.Boolean, default=False)
    refresh_interval = db.Column(db.String(16), default='30s')
    wifi_only_sync = db.Column(db.Boolean, default=True)
    alert_threshold_mb = db.Column(db.Float, default=50.0)

    def to_dict(self):
        return {
            'low_data_mode': self.low_data_mode,
            'refresh_interval': self.refresh_interval,
            'wifi_only_sync': self.wifi_only_sync,
            'alert_threshold_mb': self.alert_threshold_mb
        }

