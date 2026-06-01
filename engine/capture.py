import time
import random
import threading
from engine.rules import process_packet
from engine.threat_intel import MOCK_MALICIOUS_IPS

packet_buffer = []
BUFFER_SIZE = 500
total_packets_captured = 0
protocol_stats = {"TCP": 0, "UDP": 0, "ICMP": 0, "Other": 0}

def get_packet_stats():
    return {
        "total_packets": total_packets_captured,
        "protocol_distribution": protocol_stats,
        "recent_packets": packet_buffer
    }

def capture_loop(app, socketio):
    global total_packets_captured
    # Simple Mock Packet Generator
    while True:
        time.sleep(random.uniform(1.0, 2.0))
        
        is_malicious = random.random() < 0.05
        src_ip = random.choice(MOCK_MALICIOUS_IPS) if is_malicious else f"192.168.1.{random.randint(1, 50)}"
        dst_ip = f"10.0.0.{random.randint(1, 10)}"
        dst_port = random.choice([22, 23, 80, 443, 3389, 445, 8080])
        
        rand_proto = random.random()
        if rand_proto < 0.50: protocol = "TCP"
        elif rand_proto < 0.85: protocol = "ICMP"
        else: protocol = "UDP"
        
        pkt = {
            "timestamp": time.time(),
            "src_ip": src_ip,
            "dst_ip": dst_ip,
            "dst_port": dst_port,
            "protocol": protocol,
            "size": random.randint(64, 1500)
        }
        
        # update stats
        total_packets_captured += 1
        if protocol in protocol_stats:
            protocol_stats[protocol] += 1
        else:
            protocol_stats["Other"] += 1
            
        packet_buffer.insert(0, pkt)
        if len(packet_buffer) > BUFFER_SIZE:
            packet_buffer.pop()
            
        # Emit to frontend
        socketio.emit('new_packet', pkt)
        
        # Process Rules
        alerts = process_packet(pkt, app)
        for a in alerts:
            socketio.emit('new_alert', a)

def start_capture_thread(app, socketio):
    t = threading.Thread(target=capture_loop, args=(app, socketio), daemon=True)
    t.start()
