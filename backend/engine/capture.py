import time
import random
import threading
from engine.rules import process_packet
from engine.threat_intel import MOCK_MALICIOUS_IPS
from models import SecurityMetric, HistoricalAnalytics, PacketLog, db

packet_buffer = []
BUFFER_SIZE = 500

DEFAULT_BASE_PACKETS = 1420
total_packets_captured = DEFAULT_BASE_PACKETS
protocol_stats = {"TCP": 850, "UDP": 340, "ICMP": 180, "Other": 50}

# Track packets-per-second for traffic chart
_packets_this_second = 0
_current_second = int(time.time())

def seed_packet_buffer():
    global packet_buffer
    if not packet_buffer:
        PORTS = [22, 23, 80, 443, 3389, 445, 8080]
        IPS_LOCAL = [f"192.168.1.{i}" for i in range(1, 25)]
        now = time.time()
        for i in range(20):
            is_mal = (i % 4 == 0)
            src_ip = random.choice(MOCK_MALICIOUS_IPS) if is_mal else random.choice(IPS_LOCAL)
            proto = random.choice(["TCP", "UDP", "ICMP", "TCP", "TCP"])
            pkt = {
                "timestamp": now - (i * 2),
                "src_ip": src_ip,
                "dst_ip": f"10.0.0.{random.randint(1, 10)}",
                "dst_port": random.choice(PORTS),
                "protocol": proto,
                "size": random.randint(64, 1500)
            }
            packet_buffer.append(pkt)

seed_packet_buffer()

def init_packet_stats(app):
    """
    Loads persisted packet counts & recent packets from DB or calculates offline elapsed packets
    so counter and packet history survive app restarts and cold boots.
    """
    global total_packets_captured, packet_buffer
    with app.app_context():
        try:
            # 1. Load recent packets from DB if available
            db_packets = PacketLog.query.order_by(PacketLog.timestamp.desc()).limit(100).all()
            if db_packets:
                packet_buffer = [p.to_dict() for p in db_packets]
            else:
                seed_packet_buffer()

            # 2. Load total packet counts & offline calculation
            metric = SecurityMetric.query.filter_by(metric_name='Total Packets Evaluated').first()
            now = time.time()
            if metric:
                base_val = int(metric.metric_value)
                last_upd = metric.last_updated or now
                elapsed = max(0, now - last_upd)
                offline_packets = int(elapsed * 1.5)
                offline_packets = min(offline_packets, 50000)
                
                total_packets_captured = max(DEFAULT_BASE_PACKETS, base_val + offline_packets)
                metric.metric_value = float(total_packets_captured)
                metric.last_updated = now
            else:
                last_ha = HistoricalAnalytics.query.order_by(HistoricalAnalytics.id.desc()).first()
                if last_ha and last_ha.total_packets:
                    total_packets_captured = max(DEFAULT_BASE_PACKETS, last_ha.total_packets)
                metric = SecurityMetric(
                    metric_name='Total Packets Evaluated',
                    metric_value=float(total_packets_captured),
                    last_updated=now
                )
                db.session.add(metric)
            
            db.session.commit()
            print(f"[PacketStats Init] Initialized total_packets_captured to {total_packets_captured}, loaded {len(packet_buffer)} packets.")
        except Exception as e:
            print(f"[PacketStats Init Warning] {e}")

def save_packet_stats(app, recent_pkt=None):
    """
    Saves current total_packets_captured and optional recent packet to DB.
    """
    with app.app_context():
        try:
            metric = SecurityMetric.query.filter_by(metric_name='Total Packets Evaluated').first()
            now = time.time()
            if metric:
                metric.metric_value = float(total_packets_captured)
                metric.last_updated = now
            else:
                metric = SecurityMetric(
                    metric_name='Total Packets Evaluated',
                    metric_value=float(total_packets_captured),
                    last_updated=now
                )
                db.session.add(metric)

            if recent_pkt:
                pl = PacketLog(
                    timestamp=recent_pkt['timestamp'],
                    src_ip=recent_pkt['src_ip'],
                    dst_ip=recent_pkt['dst_ip'],
                    dst_port=recent_pkt['dst_port'],
                    protocol=recent_pkt['protocol'],
                    size=recent_pkt['size']
                )
                db.session.add(pl)

                # Rotate out old packets in DB if count > 500
                total_pkts_in_db = PacketLog.query.count()
                if total_pkts_in_db > BUFFER_SIZE:
                    old_ids = [p.id for p in PacketLog.query.order_by(PacketLog.id.asc()).limit(total_pkts_in_db - BUFFER_SIZE).all()]
                    if old_ids:
                        PacketLog.query.filter(PacketLog.id.in_(old_ids)).delete(synchronize_session=False)

            db.session.commit()
        except Exception as e:
            db.session.rollback()
            print(f"[PacketStats Save Warning] {e}")

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

            # Maintain rolling packet buffer
            packet_buffer.insert(0, pkt)
            if len(packet_buffer) > BUFFER_SIZE:
                packet_buffer.pop()

            # Save to DB periodically (every 10 packets)
            if total_packets_captured % 10 == 0:
                save_packet_stats(app, recent_pkt=pkt)

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
            try:
                alerts = process_packet(pkt, app)
                for a in alerts:
                    socketio.emit('new_alert', a)
            except Exception as e:
                print(f"[Process Packet Error] {e}")

        # Sleep 1–2 seconds between bursts
        socketio.sleep(random.uniform(1.0, 2.0))


def start_capture_thread(app, socketio):
    socketio.start_background_task(capture_loop, app, socketio)

