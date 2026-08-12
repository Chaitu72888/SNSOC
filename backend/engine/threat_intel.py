import os
import requests
import logging

logger = logging.getLogger(__name__)

MOCK_MALICIOUS_IPS = ["185.15.1.182", "45.33.32.156", "198.20.69.74", "185.15.1.100"]

def get_config():
    from config import Config
    return {
        "api_key": Config.ABUSEIPDB_API_KEY,
        "mock_mode": Config.MOCK_TI_MODE
    }

def check_ip(ip):
    conf = get_config()
    
    if conf['mock_mode'] or not conf['api_key']:
        flagged = ip in MOCK_MALICIOUS_IPS
        return {
            "ip": ip,
            "score": 100 if flagged else 0,
            "flagged": flagged,
            "source": "mock",
            "countryCode": "RU" if flagged else "US",
            "asn": "AS12345 MockNet" if flagged else "AS54321 SafeNet",
            "country_risk": "HIGH" if flagged else "LOW"
        }
        
    # Real mode
    try:
        url = 'https://api.abuseipdb.com/api/v2/check'
        headers = {
            'Key': conf['api_key'],
            'Accept': 'application/json'
        }
        params = {'ipAddress': ip, 'maxAgeInDays': 90}
        resp = requests.get(url, headers=headers, params=params, timeout=5)
        
        if resp.status_code == 200:
            data = resp.json().get('data', {})
            score = data.get('abuseConfidenceScore', 0)
            countryCode = data.get('countryCode', 'Unknown')
            return {
                "ip": ip,
                "score": score,
                "flagged": score > 50,
                "source": "abuseipdb",
                "countryCode": countryCode,
                "asn": f"AS{data.get('asn', 'Unknown')} {data.get('isp', '')}",
                "country_risk": "HIGH" if countryCode in ['RU', 'CN', 'KP', 'IR'] else "LOW"
            }
    except Exception as e:
        logger.error(f"AbuseIPDB request failed: {e}")
        
    return {
        "ip": ip,
        "score": 0,
        "flagged": False,
        "source": "error_fallback",
        "countryCode": "Unknown",
        "asn": "Unknown",
        "country_risk": "UNKNOWN"
    }
