from flask import Blueprint, jsonify, request, current_app
from flask_login import login_required
from engine.capture import get_packet_stats
from engine.scorer import compute_threat_level
from models import Alert, BlockedIP, db
from sqlalchemy import desc
import time

dashboard_bp = Blueprint('dashboard', __name__)

_cache = {
    'dashboard': None,
    'last_updated': 0
}
CACHE_TTL = 1.0

@dashboard_bp.route('/dashboard', methods=['GET'])
@login_required
def get_dashboard():
    now = time.time()
    if _cache['dashboard'] and (now - _cache['last_updated']) < CACHE_TTL:
        return jsonify({"success": True, "data": _cache['dashboard']})

    stats = get_packet_stats()
    threat = compute_threat_level(current_app)
    
    sixty_secs_ago = now - 60
    suspicious_packets = Alert.query.count()
    blocked_ips = BlockedIP.query.count()
    active_alerts = Alert.query.filter(Alert.timestamp >= sixty_secs_ago).count()
    
    recent_alerts = Alert.query.filter(Alert.timestamp >= sixty_secs_ago).all()
    attack_types = {}
    for a in recent_alerts:
        if a.attack_type:
            attack_types[a.attack_type] = attack_types.get(a.attack_type, 0) + 1
            
    ip_counts = {}
    for p in stats.get('recent_packets', []):
        ip_counts[p['src_ip']] = ip_counts.get(p['src_ip'], 0) + 1
    top_ips = [{"ip": k, "count": v} for k, v in sorted(ip_counts.items(), key=lambda x: x[1], reverse=True)[:5]]

    data = {
        "total_packets": stats.get('total_packets', 0),
        "suspicious_packets": suspicious_packets,
        "blocked_ips": blocked_ips,
        "active_alerts": active_alerts,
        "threat_score": threat.get('score', 0),
        "threat_level": threat.get('level', 'LOW'),
        "attack_types": attack_types,
        "protocol_distribution": stats.get('protocol_distribution', {}),
        "top_source_ips": top_ips,
        "system_status": "active"
    }
    
    _cache['dashboard'] = data
    _cache['last_updated'] = now

    return jsonify({
        "success": True,
        "data": data
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
        "data": stats.get('recent_packets', [])[:limit]
    })
