from flask import Blueprint, jsonify, request
from flask_login import login_required, current_user
from models import BlockedIP, db
import ipaddress

block_bp = Blueprint('block', __name__)

@block_bp.route('/block', methods=['GET'])
@login_required
def get_blocks():
    blocks = BlockedIP.query.all()
    return jsonify({
        "success": True,
        "data": [b.to_dict() for b in blocks]
    })

@block_bp.route('/block', methods=['POST'])
@login_required
def add_block():
    data = request.json or {}
    ip = data.get('ip')
    reason = data.get('reason', 'manual block')
    if not ip:
        return jsonify({"success": False, "error": "ip required"}), 400

    try:
        ipaddress.ip_address(ip)
    except ValueError:
        return jsonify({"success": False, "error": "invalid IP address format"}), 400

    if not BlockedIP.query.filter_by(ip=ip).first():
        user_name = current_user.name if hasattr(current_user, 'name') else 'Operator'
        b = BlockedIP(ip=ip, reason=reason, blocked_by=user_name)
        db.session.add(b)
        db.session.commit()
        
    return jsonify({"success": True})

@block_bp.route('/block/<ip>', methods=['DELETE'])
@login_required
def remove_block(ip):
    try:
        ipaddress.ip_address(ip)
    except ValueError:
        return jsonify({"success": False, "error": "invalid IP address format"}), 400

    b = BlockedIP.query.filter_by(ip=ip).first()
    if b:
        db.session.delete(b)
        db.session.commit()
    return jsonify({"success": True})

