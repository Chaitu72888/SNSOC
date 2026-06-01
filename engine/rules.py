import json
import logging
from engine.threat_intel import check_ip
from models import IDSRule, BlockedIP, Alert, db
import time

logger = logging.getLogger(__name__)

# In-memory sliding window state for volume threshold
# format: { 'ip': [timestamp, timestamp, ...] }
packet_counts = {}

def process_packet(packet, app):
    """
    Run rules against a single packet. Returns list of Alert dicts.
    """
    alerts = []
    
    with app.app_context():
        # 1. BlockedIPRule
        if BlockedIP.query.filter_by(ip=packet['src_ip']).first():
            alerts.append({
                'title': 'Blocked IP Traffic',
                'message': f"Traffic from blocked IP: {packet['src_ip']}",
                'severity': 'critical',
                'rule_name': 'BlockedIPRule',
                **packet
            })
            return alerts # Drop processing further

        # 2. MaliciousIPRule (Threat Intel)
        ti_result = check_ip(packet['src_ip'])
        if ti_result.get('flagged'):
            alerts.append({
                'title': 'Malicious IP Detected',
                'message': f"Known malicious IP: {packet['src_ip']} (Score: {ti_result.get('score')})",
                'severity': 'critical',
                'rule_name': 'MaliciousIPRule',
                **packet
            })

        # 3. ProtectedPortRule
        protected_ports = [int(r.value) for r in IDSRule.query.filter_by(rule_type='protected_port').all()]
        if packet.get('dst_port') in protected_ports:
            alerts.append({
                'title': 'Suspicious Auth Port',
                'message': f"Suspicious connection attempt to protected auth port {packet['dst_port']}",
                'severity': 'high',
                'rule_name': 'ProtectedPortRule',
                **packet
            })

        # 4. VolumeThresholdRule
        threshold_rule = IDSRule.query.filter_by(rule_type='threshold').first()
        if threshold_rule:
            try:
                t_val = json.loads(threshold_rule.value)
                max_pkts = t_val.get('max_packets', 100)
                window_s = t_val.get('window_seconds', 10)
            except Exception:
                max_pkts = 100
                window_s = 10
            
            src = packet['src_ip']
            now = packet['timestamp']
            
            if src not in packet_counts:
                packet_counts[src] = []
                
            # Filter out old packets
            packet_counts[src] = [t for t in packet_counts[src] if now - t <= window_s]
            packet_counts[src].append(now)
            
            if len(packet_counts[src]) > max_pkts:
                alerts.append({
                    'title': 'Volume Flood',
                    'message': f"{src} sent {len(packet_counts[src])} packets in {window_s}s",
                    'severity': 'high',
                    'rule_name': 'VolumeThresholdRule',
                    **packet
                })
                # reset to avoid alert spamming
                packet_counts[src] = []

        # Save all alerts to DB
        new_alerts = []
        for alert_dict in alerts:
            a = Alert(
                timestamp=alert_dict['timestamp'],
                title=alert_dict['title'],
                message=alert_dict['message'],
                severity=alert_dict['severity'],
                src_ip=alert_dict['src_ip'],
                dst_ip=alert_dict.get('dst_ip'),
                dst_port=alert_dict.get('dst_port'),
                protocol=alert_dict.get('protocol'),
                rule_name=alert_dict['rule_name']
            )
            db.session.add(a)
            new_alerts.append(a)
            
        if new_alerts:
            db.session.commit()
            
        return [a.to_dict() for a in new_alerts]
