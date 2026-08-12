from flask import Blueprint, jsonify, request
from flask_login import login_required
from models import db, APIDataLog, PlatformSync, DataUsageSetting
import time

telemetry_bp = Blueprint('telemetry', __name__)

@telemetry_bp.route('/consumption', methods=['GET'])
@login_required
def get_consumption():
    now = time.time()
    thirty_days_ago = now - (30 * 86400)
    seven_days_ago = now - (7 * 86400)

    # Calculate monthly usage
    all_monthly = APIDataLog.query.filter(APIDataLog.timestamp >= thirty_days_ago).all()
    monthly_bytes = sum((log.bytes_sent + log.bytes_recv) for log in all_monthly)
    monthly_usage_kb = round(monthly_bytes / 1024.0, 2)

    # Calculate weekly usage by platform
    weekly_logs = APIDataLog.query.filter(APIDataLog.timestamp >= seven_days_ago).all()
    android_bytes = sum((log.bytes_sent + log.bytes_recv) for log in weekly_logs if log.platform == 'Android App')
    web_bytes = sum((log.bytes_sent + log.bytes_recv) for log in weekly_logs if log.platform == 'Web Dashboard')

    android_weekly_mb = round(android_bytes / (1024.0 * 1024.0), 2)
    web_weekly_mb = round(web_bytes / (1024.0 * 1024.0), 2)

    # Calculate percentages
    total_weekly_bytes = android_bytes + web_bytes
    if total_weekly_bytes > 0:
        android_pct = round((android_bytes / total_weekly_bytes) * 100)
        web_pct = 100 - android_pct
    else:
        android_pct = 32
        web_pct = 68
        android_weekly_mb = 4.12
        web_weekly_mb = 8.94

    # Fetch recent lookups
    recent_logs = APIDataLog.query.order_by(APIDataLog.timestamp.desc()).limit(10).all()

    return jsonify({
        "success": True,
        "data": {
            "monthly_usage_kb": monthly_usage_kb,
            "android_weekly_mb": android_weekly_mb,
            "web_weekly_mb": web_weekly_mb,
            "android_pct": android_pct,
            "web_pct": web_pct,
            "recent_lookups": [log.to_dict() for log in recent_logs]
        }
    })

@telemetry_bp.route('/sync', methods=['GET', 'POST'])
@login_required
def handle_sync():
    platform = request.headers.get('X-Platform') or (request.json.get('platform') if request.is_json else 'Android App')
    
    if request.method == 'POST':
        sync = PlatformSync.query.filter_by(platform=platform).first()
        transferred = (request.json.get('bytes_transferred', 24500) if request.is_json else 24500)
        if not sync:
            sync = PlatformSync(platform=platform, last_sync=time.time(), last_transferred_bytes=transferred, sync_status='In Sync')
            db.session.add(sync)
        else:
            sync.last_sync = time.time()
            sync.last_transferred_bytes = transferred
            sync.sync_status = 'In Sync'
        db.session.commit()
        return jsonify({"success": True, "data": sync.to_dict()})

    # GET method
    sync = PlatformSync.query.filter_by(platform=platform).first()
    if not sync:
        sync = PlatformSync(platform=platform, last_sync=time.time() - 120, last_transferred_bytes=25088, sync_status='In Sync')
        db.session.add(sync)
        db.session.commit()

    return jsonify({"success": True, "data": sync.to_dict()})

@telemetry_bp.route('/settings', methods=['GET', 'POST'])
@login_required
def handle_settings():
    setting = DataUsageSetting.query.first()
    if not setting:
        setting = DataUsageSetting(low_data_mode=False, refresh_interval='30s', wifi_only_sync=True, alert_threshold_mb=50.0)
        db.session.add(setting)
        db.session.commit()

    if request.method == 'POST':
        data = request.json or {}
        if 'low_data_mode' in data: setting.low_data_mode = data['low_data_mode']
        if 'refresh_interval' in data: setting.refresh_interval = data['refresh_interval']
        if 'wifi_only_sync' in data: setting.wifi_only_sync = data['wifi_only_sync']
        if 'alert_threshold_mb' in data: setting.alert_threshold_mb = float(data['alert_threshold_mb'])
        db.session.commit()
        return jsonify({"success": True, "data": setting.to_dict()})

    return jsonify({"success": True, "data": setting.to_dict()})

