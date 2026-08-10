from flask import Blueprint, jsonify, request
from flask_login import login_required
from models import IDSRule, db
import json

ids_bp = Blueprint('ids', __name__)

@ids_bp.route('/rules', methods=['GET'])
@login_required
def get_rules():
    ports = [int(r.value) for r in IDSRule.query.filter_by(rule_type='protected_port').all()]
    threshold_r = IDSRule.query.filter_by(rule_type='threshold').first()
    
    threshold = {"max_packets": 100, "window_seconds": 10}
    if threshold_r:
        try:
            threshold = json.loads(threshold_r.value)
        except Exception:
            pass
            
    return jsonify({
        "success": True,
        "data": {
            "protected_ports": ports,
            "threshold": threshold
        }
    })

@ids_bp.route('/rules/ports', methods=['POST'])
@login_required
def add_port():
    port = request.json.get('port')
    if not port:
        return jsonify({"success": False, "error": "port required"}), 400
        
    if not IDSRule.query.filter_by(rule_type='protected_port', value=str(port)).first():
        db.session.add(IDSRule(rule_type='protected_port', value=str(port)))
        db.session.commit()
        
    ports = [int(r.value) for r in IDSRule.query.filter_by(rule_type='protected_port').all()]
    return jsonify({"success": True, "data": {"ports": ports}})

@ids_bp.route('/rules/ports/<int:port>', methods=['DELETE'])
@login_required
def remove_port(port):
    r = IDSRule.query.filter_by(rule_type='protected_port', value=str(port)).first()
    if r:
        db.session.delete(r)
        db.session.commit()
    return jsonify({"success": True})

@ids_bp.route('/thresholds', methods=['POST'])
@login_required
def update_threshold():
    max_pkts = request.json.get('max_packets', 100)
    window = request.json.get('window_seconds', 10)
    
    r = IDSRule.query.filter_by(rule_type='threshold').first()
    val = json.dumps({"max_packets": max_pkts, "window_seconds": window})
    if r:
        r.value = val
    else:
        db.session.add(IDSRule(rule_type='threshold', value=val))
    db.session.commit()
    
    return jsonify({"success": True})
