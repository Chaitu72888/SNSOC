from flask import Blueprint, jsonify, request
from flask_login import login_required
from engine.capture import get_packet_stats
from engine.scorer import compute_threat_level
from models import Alert, db
from sqlalchemy import desc

dashboard_bp = Blueprint('dashboard', __name__)

@dashboard_bp.route('/dashboard', methods=['GET'])
@login_required
def get_dashboard():
    from flask import current_app
    stats = get_packet_stats()
    threat = compute_threat_level(current_app)
    
    # top source ips (simple approximation from recent packets)
    ip_counts = {}
    for p in stats['recent_packets']:
        ip_counts[p['src_ip']] = ip_counts.get(p['src_ip'], 0) + 1
    top_ips = [{"ip": k, "count": v} for k, v in sorted(ip_counts.items(), key=lambda x: x[1], reverse=True)[:5]]

    return jsonify({
        "success": True,
        "data": {
            "total_packets": stats['total_packets'],
            "threat_level": threat,
            "protocol_distribution": stats['protocol_distribution'],
            "top_source_ips": top_ips,
            "system_status": "active"
        }
    })

@dashboard_bp.route('/alerts', methods=['GET'])
@login_required
def get_alerts():
    limit = request.args.get('limit', 20, type=int)
    offset = request.args.get('offset', 0, type=int)
    
    alerts = Alert.query.order_by(desc(Alert.timestamp)).offset(offset).limit(limit).all()
    total = Alert.query.count()
    
    return jsonify({
        "success": True,
        "data": {
            "total": total,
            "alerts": [a.to_dict() for a in alerts]
        }
    })

@dashboard_bp.route('/packets', methods=['GET'])
@login_required
def get_packets():
    limit = request.args.get('limit', 50, type=int)
    stats = get_packet_stats()
    return jsonify({
        "success": True,
        "data": stats['recent_packets'][:limit]
    })
