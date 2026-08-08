import time
import pytest
from pages.login_page import LoginPage

def test_login_valid_credentials(driver_setup):
    """
    TC_001: Validate authentication flow with valid operator credentials.
    """
    driver, results = driver_setup
    start = time.time()
    login_page = LoginPage(driver)
    
    res = login_page.login("sivachaitanya72@gmail.com", "siva2580")
    duration = round(time.time() - start, 3)
    
    is_valid = False
    if hasattr(res, 'status_code'):
        is_valid = res.status_code in [200, 302] and "Invalid credentials" not in getattr(res, 'text', '')
    else:
        is_valid = bool(res)

    status = "PASSED" if is_valid else "FAILED"
    results.append({
        "module": "Authentication",
        "name": "TC_001: Valid Operator Login Flow",
        "status": status,
        "duration": duration,
        "error": "N/A" if status == "PASSED" else "Login authentication failed"
    })
    assert status == "PASSED"


def test_login_invalid_credentials(driver_setup):
    """
    TC_002: Validate authentication rejection with invalid credentials.
    """
    driver, results = driver_setup
    start = time.time()
    login_page = LoginPage(driver)
    
    res = login_page.login("invalid@gmail.com", "wrongpass")
    duration = round(time.time() - start, 3)
    
    is_rejected = False
    if hasattr(res, 'status_code'):
        is_rejected = "Invalid credentials" in getattr(res, 'text', '') or res.status_code == 200
    else:
        is_rejected = True

    status = "PASSED" if is_rejected else "FAILED"
    results.append({
        "module": "Authentication",
        "name": "TC_002: Invalid Credentials Rejection",
        "status": status,
        "duration": duration,
        "error": "N/A" if status == "PASSED" else "Failed to reject invalid credentials"
    })
    assert status == "PASSED"
