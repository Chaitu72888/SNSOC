from flask import Blueprint, jsonify, request
from flask_login import login_required, current_user
from models import BlockedIP, db

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
    ip = request.json.get('ip')
    reason = request.json.get('reason', 'manual block')
    if not ip:
        return jsonify({"success": False, "error": "ip required"}), 400
        
    if not BlockedIP.query.filter_by(ip=ip).first():
        b = BlockedIP(ip=ip, reason=reason, blocked_by=current_user.name)
        db.session.add(b)
        db.session.commit()
        
    return jsonify({"success": True})

@block_bp.route('/block/<ip>', methods=['DELETE'])
@login_required
def remove_block(ip):
    b = BlockedIP.query.filter_by(ip=ip).first()
    if b:
        db.session.delete(b)
        db.session.commit()
    return jsonify({"success": True})
