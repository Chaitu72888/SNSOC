from flask import Blueprint, jsonify, request
from flask_login import login_required
import os

intel_bp = Blueprint('intel', __name__)

@intel_bp.route('/config', methods=['POST'])
@login_required
def update_config():
    api_key = request.json.get('api_key', '')
    mock_mode = request.json.get('mock_mode', True)
    
    # In a real app we might write to .env or DB, here we update process env
    os.environ['ABUSEIPDB_API_KEY'] = api_key
    os.environ['MOCK_TI_MODE'] = 'true' if mock_mode else 'false'
    
    from config import Config
    Config.ABUSEIPDB_API_KEY = api_key
    Config.MOCK_TI_MODE = mock_mode
    
    return jsonify({"success": True, "data": {"mode": "mock" if mock_mode else "live"}})

@intel_bp.route('/lookup', methods=['POST'])
@login_required
def lookup_ip():
    ip = request.json.get('ip')
    if not ip:
        return jsonify({"success": False, "error": "ip required"}), 400
        
    from engine.threat_intel import check_ip
    res = check_ip(ip)
    
    return jsonify({
        "success": True,
        "data": res
    })
