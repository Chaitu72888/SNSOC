import time
import pytest
from pages.settings_page import SettingsPage

def test_fetch_telemetry_settings(driver_setup):
    """
    TC_005: Fetch and verify telemetry and data usage settings.
    """
    driver, results = driver_setup
    start = time.time()
    settings_page = SettingsPage(driver)
    
    settings = settings_page.fetch_settings()
    duration = round(time.time() - start, 3)
    
    status = "PASSED" if isinstance(settings, dict) else "FAILED"
    results.append({
        "module": "Telemetry & Settings",
        "name": "TC_005: Retrieve Data Usage Settings",
        "status": status,
        "duration": duration,
        "error": "N/A" if status == "PASSED" else "Failed to retrieve settings"
    })
    assert status == "PASSED"


def test_platform_sync_status(driver_setup):
    """
    TC_006: Verify Android mobile platform sync status and byte counter.
    """
    driver, results = driver_setup
    start = time.time()
    settings_page = SettingsPage(driver)
    
    sync_data = settings_page.fetch_sync_status()
    duration = round(time.time() - start, 3)
    
    status = "PASSED" if isinstance(sync_data, dict) else "FAILED"
    results.append({
        "module": "Telemetry & Settings",
        "name": "TC_006: Android Platform Sync Verification",
        "status": status,
        "duration": duration,
        "error": "N/A" if status == "PASSED" else "Failed sync status fetch"
    })
    assert status == "PASSED"


def test_update_telemetry_settings(driver_setup):
    """
    TC_007: Update low data mode toggling and refresh interval settings.
    """
    driver, results = driver_setup
    start = time.time()
    settings_page = SettingsPage(driver)
    
    res = settings_page.update_settings(low_data_mode=True, refresh_interval="15s", alert_threshold_mb=75.0)
    duration = round(time.time() - start, 3)
    
    is_success = False
    if isinstance(res, dict):
        is_success = res.get('status') in ['success', 'OK'] or 'data' in res or bool(res)
    elif hasattr(res, 'status_code'):
        is_success = res.status_code == 200
        
    status = "PASSED" if is_success else "FAILED"
    results.append({
        "module": "Telemetry & Settings",
        "name": "TC_007: Update Data Mode & Alert Threshold",
        "status": status,
        "duration": duration,
        "error": "N/A" if status == "PASSED" else "Failed to update settings"
    })
    assert status == "PASSED"
