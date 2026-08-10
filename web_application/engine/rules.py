import json
import logging
from engine.threat_intel import check_ip
from models import IDSRule, BlockedIP, Alert, db
import time

logger = logging.getLogger(__name__)

# In-memory sliding window state for volume threshold
# format: { 'ip': [timestamp, timestamp, ...] }
packet_counts = {}

# For tracking Port Scans
# format: { 'ip': {'ports': set(), 'last_time': timestamp} }
scan_tracker = {}

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
                'attack_type': 'Firewall Block',
                'mitre_tactic': 'Impact',
                'mitre_technique': 'T1498: Network Denial of Service',
                **packet
            })
            return alerts # Drop processing further

        # 2. MaliciousIPRule (Threat Intel)
        ti_result = check_ip(packet['src_ip'])
        if ti_result.get('flagged'):
            alerts.append({
                'title': 'Malicious IP Detected',
                'message': f"Known malicious IP: {packet['src_ip']} (Score: {ti_result.get('score')}, Country: {ti_result.get('countryCode')})",
                'severity': 'critical',
                'rule_name': 'MaliciousIPRule',
                'attack_type': 'Malware Communication',
                'mitre_tactic': 'Command and Control',
                'mitre_technique': 'T1071: Application Layer Protocol',
                **packet
            })

        # 3. ProtectedPortRule & Port Scan & Suspicious Auth
        protected_ports = [int(r.value) for r in IDSRule.query.filter_by(rule_type='protected_port').all()]
        dst_port = packet.get('dst_port')
        src = packet['src_ip']
        now = packet['timestamp']
        
        # Track scans
        if src not in scan_tracker:
            scan_tracker[src] = {'ports': set(), 'last_time': now}
            
        if now - scan_tracker[src]['last_time'] > 10:
            scan_tracker[src]['ports'] = set()
            
        scan_tracker[src]['ports'].add(dst_port)
        scan_tracker[src]['last_time'] = now
        
        if len(scan_tracker[src]['ports']) >= 3:
            alerts.append({
                'title': 'Port Scan Detected',
                'message': f"IP {src} scanned multiple ports",
                'severity': 'high',
                'rule_name': 'PortScanRule',
                'attack_type': 'Port Scan',
                'mitre_tactic': 'Discovery',
                'mitre_technique': 'T1046: Network Service Discovery',
                **packet
            })
            scan_tracker[src]['ports'] = set() # reset
            
        elif dst_port in protected_ports:
            alerts.append({
                'title': 'Suspicious Auth Attempt',
                'message': f"Suspicious connection attempt to protected auth port {dst_port}",
                'severity': 'high',
                'rule_name': 'ProtectedPortRule',
                'attack_type': 'Suspicious Authentication Attempts',
                'mitre_tactic': 'Credential Access',
                'mitre_technique': 'T1110: Brute Force',
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
            
            if src not in packet_counts:
                packet_counts[src] = []
                
            # Filter out old packets
            packet_counts[src] = [t for t in packet_counts[src] if now - t <= window_s]
            packet_counts[src].append(now)
            
            if len(packet_counts[src]) > max_pkts:
                alerts.append({
                    'title': 'DDoS / Volume Flood',
                    'message': f"{src} sent {len(packet_counts[src])} packets in {window_s}s",
                    'severity': 'high',
                    'rule_name': 'VolumeThresholdRule',
                    'attack_type': 'DDoS',
                    'mitre_tactic': 'Impact',
                    'mitre_technique': 'T1498: Network Denial of Service',
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
                rule_name=alert_dict['rule_name'],
                attack_type=alert_dict.get('attack_type'),
                mitre_tactic=alert_dict.get('mitre_tactic'),
                mitre_technique=alert_dict.get('mitre_technique')
            )
            db.session.add(a)
            new_alerts.append(a)
            
        if new_alerts:
            db.session.commit()
            
        return [a.to_dict() for a in new_alerts]
