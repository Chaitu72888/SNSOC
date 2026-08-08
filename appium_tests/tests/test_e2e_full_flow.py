import time
import pytest
from pages.login_page import LoginPage
from pages.threat_intel_page import ThreatIntelPage
from pages.settings_page import SettingsPage

def test_complete_end_to_end_user_flow(driver_setup):
    """
    TC_009: Complete End-to-End User Journey (Login -> Lookup Threat -> Update Telemetry Settings -> Logout).
    """
    driver, results = driver_setup
    start = time.time()
    
    # 1. Login
    login_page = LoginPage(driver)
    login_res = login_page.login("sivachaitanya72@gmail.com", "siva2580")
    
    # 2. Threat Intel Lookup
    intel_page = ThreatIntelPage(driver)
    intel_data = intel_page.lookup_ip("45.33.32.156")
    
    # 3. Update Settings
    settings_page = SettingsPage(driver)
    settings_res = settings_page.update_settings(low_data_mode=False, refresh_interval="30s", alert_threshold_mb=100.0)
    
    duration = round(time.time() - start, 3)
    status = "PASSED" if login_res is not None and intel_data and settings_res else "FAILED"
    
    results.append({
        "module": "End to End Flow",
        "name": "TC_009: Complete Mobile E2E User Journey",
        "status": status,
        "duration": duration,
        "error": "N/A" if status == "PASSED" else "Full E2E flow broken"
    })
    assert status == "PASSED"
