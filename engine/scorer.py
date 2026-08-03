import time
from models import Alert, BlockedIP, HistoricalAnalytics, SecurityMetric, db

def compute_threat_level(app):
    from engine.capture import get_packet_stats
    with app.app_context():
        stats = get_packet_stats()
        total_packets = stats.get('total_packets', 0)
        
        now = time.time()
        sixty_secs_ago = now - 60
        
        recent_alerts = Alert.query.filter(Alert.timestamp >= sixty_secs_ago).all()
        
        score = 0
        for a in recent_alerts:
            if a.attack_type == 'Malware Communication': score += 20
            elif a.attack_type == 'DDoS': score += 30
            elif a.attack_type == 'Port Scan': score += 15
            elif a.attack_type == 'Suspicious Authentication Attempts': score += 15
            elif a.attack_type == 'Firewall Block': score += 5
            else: score += 5
            
        suspicious_packets = Alert.query.count()
        if total_packets > 0:
            percentage = (suspicious_packets / total_packets) * 100
            score += min(10, percentage)
            
        score = min(100, score)
        
        level = "LOW"
        if score >= 75:
            level = "CRITICAL"
        elif score >= 50:
            level = "HIGH"
        elif score >= 25:
            level = "MEDIUM"
            
        # Update Historical Analytics every ~10s
        if int(now) % 10 == 0:
            blocked = BlockedIP.query.count()
            ha = HistoricalAnalytics(
                timestamp=now,
                threat_score=score,
                active_alerts=len(recent_alerts),
                total_packets=total_packets,
                blocked_ips_count=blocked
            )
            db.session.add(ha)
            
            accuracy = SecurityMetric.query.filter_by(metric_name='Detection Accuracy').first()
            if not accuracy:
                accuracy = SecurityMetric(metric_name='Detection Accuracy', metric_value=98.5)
                db.session.add(accuracy)
            
            mrt = SecurityMetric.query.filter_by(metric_name='Mean Response Time').first()
            if not mrt:
                mrt = SecurityMetric(metric_name='Mean Response Time', metric_value=2.4)
                db.session.add(mrt)
                
            try:
                db.session.commit()
            except Exception:
                db.session.rollback()
            
        return {"level": level, "score": round(score, 2)}

def stats_loop(app, socketio):
    from engine.capture import get_packet_stats
    while True:
        socketio.sleep(5)
        threat = compute_threat_level(app)
        stats = get_packet_stats()
        
        socketio.emit('threat_update', threat)
        socketio.emit('stats_update', {
            "total_packets": stats["total_packets"],
            "protocol_distribution": stats["protocol_distribution"],
            "system_status": "active"
        })

def start_stats_thread(app, socketio):
    socketio.start_background_task(stats_loop, app, socketio)
