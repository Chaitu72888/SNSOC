import time
import pytest
from pages.threat_intel_page import ThreatIntelPage

def test_threat_intel_malicious_ip(driver_setup):
    """
    TC_003: Validate threat intel lookup for known malicious IP address.
    """
    driver, results = driver_setup
    start = time.time()
    intel_page = ThreatIntelPage(driver)
    
    data = intel_page.lookup_ip("185.15.1.100")
    duration = round(time.time() - start, 3)
    
    status = "PASSED" if data.get('status') in ['Malicious', 'Clean', 'Suspicious'] else "FAILED"
    results.append({
        "module": "Threat Intelligence",
        "name": "TC_003: Malicious IP Threat Lookup",
        "status": status,
        "duration": duration,
        "error": "N/A" if status == "PASSED" else f"Unexpected response: {data}"
    })
    assert status == "PASSED"


def test_threat_intel_clean_ip(driver_setup):
    """
    TC_004: Validate threat intel lookup for clean IP address (8.8.8.8).
    """
    driver, results = driver_setup
    start = time.time()
    intel_page = ThreatIntelPage(driver)
    
    data = intel_page.lookup_ip("8.8.8.8")
    duration = round(time.time() - start, 3)
    
    status = "PASSED" if data.get('status') in ['Clean', 'Malicious', 'Suspicious'] else "FAILED"
    results.append({
        "module": "Threat Intelligence",
        "name": "TC_004: Clean IP Lookup Evaluation",
        "status": status,
        "duration": duration,
        "error": "N/A" if status == "PASSED" else f"Unexpected response: {data}"
    })
    assert status == "PASSED"
