import time
import threading
from models import Alert, db

def compute_threat_level(app):
    with app.app_context():
        now = time.time()
        sixty_secs_ago = now - 60
        
        alerts = Alert.query.filter(Alert.timestamp >= sixty_secs_ago).all()
        
        score = 0
        for a in alerts:
            if a.severity == 'critical': score += 3
            elif a.severity == 'high': score += 2
            elif a.severity == 'medium': score += 1
            
        level = "LOW"
        if score > 15:
            level = "CRITICAL"
        elif score > 5:
            level = "HIGH"
        elif score > 0:
            level = "MEDIUM"
            
        return {"level": level, "score": score}

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
