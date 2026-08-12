import time
import random
import threading
from engine.rules import process_packet
from engine.threat_intel import MOCK_MALICIOUS_IPS

packet_buffer = []
BUFFER_SIZE = 500

# Realistic seeded starting values so dashboard is never empty
total_packets_captured = 1420
protocol_stats = {"TCP": 850, "UDP": 340, "ICMP": 180, "Other": 50}

# Track packets-per-second for traffic chart
_packets_this_second = 0
_current_second = int(time.time())

def get_packet_stats():
    return {
        "total_packets": total_packets_captured,
        "protocol_distribution": dict(protocol_stats),
        "recent_packets": list(packet_buffer),
        "pps": _packets_this_second   # packets per second for traffic chart
    }

def capture_loop(app, socketio):
    """
    Mock packet generator — fires every 1–2 seconds.
    Emits 'new_packet' to connected clients for live table + traffic chart.
    Also processes IDS rules and emits 'new_alert' when threats detected.
    """
    global total_packets_captured, _packets_this_second, _current_second

    PORTS    = [22, 23, 25, 80, 443, 3389, 445, 8080, 8443, 3306]
    IPS_LOCAL = [f"192.168.1.{i}" for i in range(1, 51)]

    while True:
        # Generate 1–3 packets per iteration to simulate bursts
        burst = random.randint(1, 3)
        for _ in range(burst):
            is_malicious = random.random() < 0.06
            src_ip = random.choice(MOCK_MALICIOUS_IPS) if is_malicious else random.choice(IPS_LOCAL)
            dst_ip  = f"10.0.0.{random.randint(1, 10)}"
            dst_port = random.choice(PORTS)

            # Fixed protocol distribution: TCP ~55%, UDP ~25%, ICMP ~15%, Other ~5%
            rand_proto = random.random()
            if   rand_proto < 0.55: protocol = "TCP"
            elif rand_proto < 0.80: protocol = "UDP"
            elif rand_proto < 0.95: protocol = "ICMP"
            else:                   protocol = "Other"

            pkt = {
                "timestamp": time.time(),
                "src_ip":    src_ip,
                "dst_ip":    dst_ip,
                "dst_port":  dst_port,
                "protocol":  protocol,
                "size":      random.randint(64, 1500)
            }

            # ── Update in-memory stats ──────────────────────────────────────
            total_packets_captured += 1
            protocol_stats[protocol] = protocol_stats.get(protocol, 0) + 1

            # Track PPS bucket
            sec = int(time.time())
            if sec != _current_second:
                _packets_this_second = 0
                _current_second = sec
            _packets_this_second += 1

            # Maintain rolling packet buffer
            packet_buffer.insert(0, pkt)
            if len(packet_buffer) > BUFFER_SIZE:
                packet_buffer.pop()

            # ── Emit live packet to frontend ────────────────────────────────
            socketio.emit('new_packet', pkt)

            # ── Run IDS rules ───────────────────────────────────────────────
            alerts = process_packet(pkt, app)
            for a in alerts:
                socketio.emit('new_alert', a)

        # Sleep 1–2 seconds between bursts
        socketio.sleep(random.uniform(1.0, 2.0))


def start_capture_thread(app, socketio):
    socketio.start_background_task(capture_loop, app, socketio)
