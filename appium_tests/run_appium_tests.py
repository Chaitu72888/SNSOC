import os
import sys
import time

# Ensure appium_tests root directory is in PYTHONPATH
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from utils.excel_reporter import AppiumExcelReporter
from utils.appium_helper import initialize_driver

def run_standalone_suite(driver):
    """
    Standalone E2E Test Suite Runner.
    Runs all Appium test cases directly without external runner dependencies.
    """
    results = []

    # Import test functions
    from tests.test_e2e_login import test_login_valid_credentials, test_login_invalid_credentials
    from tests.test_e2e_threat_intel import test_threat_intel_malicious_ip, test_threat_intel_clean_ip
    from tests.test_e2e_settings import test_fetch_telemetry_settings, test_platform_sync_status, test_update_telemetry_settings
    from tests.test_e2e_ids_rules import test_ids_rules_status
    from tests.test_e2e_full_flow import test_complete_end_to_end_user_flow

    test_cases = [
        test_login_valid_credentials,
        test_login_invalid_credentials,
        test_threat_intel_malicious_ip,
        test_threat_intel_clean_ip,
        test_fetch_telemetry_settings,
        test_platform_sync_status,
        test_update_telemetry_settings,
        test_ids_rules_status,
        test_complete_end_to_end_user_flow
    ]

    setup_tuple = (driver, results)

    for tc in test_cases:
        tc_name = tc.__name__
        print(f"Running Appium Test: {tc_name} ... ", end="", flush=True)
        try:
            tc(setup_tuple)
            print("[PASSED]")
        except Exception as e:
            print(f"[FAILED] -> {e}")

    return results


def main():
    print("=" * 75)
    print("      SNSOC ANDROID MOBILE APPLICATION APPIUM E2E TEST RUNNER")
    print("=" * 75)
    print("Initializing Appium E2E Automation Driver...\n")

    driver = initialize_driver()
    results = []

    # Check if pytest is available
    has_pytest = False
    try:
        import pytest
        has_pytest = True
    except ImportError:
        has_pytest = False

    if has_pytest:
        print("[+] PyTest detected. Running tests via PyTest runner...\n")
        from conftest import GLOBAL_TEST_RESULTS
        test_files = [
            os.path.join(os.path.dirname(__file__), f) for f in [
                "tests/test_e2e_login.py",
                "tests/test_e2e_threat_intel.py",
                "tests/test_e2e_settings.py",
                "tests/test_e2e_ids_rules.py",
                "tests/test_e2e_full_flow.py"
            ]
        ]
        pytest.main(["-v", "-s"] + test_files)
        results = GLOBAL_TEST_RESULTS
    
    if not results:
        print("[+] Running Appium E2E Suite via Direct Standalone Runner...\n")
        results = run_standalone_suite(driver)

    print("\n" + "=" * 75)
    print("Generating Excel Analysis Report (Appium_Test_Report.xlsx)...")
    print("=" * 75)

    report_path = os.path.join(os.path.dirname(__file__), "reports", "Appium_Test_Report.xlsx")
    reporter = AppiumExcelReporter(output_path=report_path)

    saved_file = reporter.generate_report(results)
    
    total = len(results)
    passed = sum(1 for r in results if r.get('status') == 'PASSED')
    failed = sum(1 for r in results if r.get('status') == 'FAILED')
    pass_rate = round(passed / total * 100, 1) if total > 0 else 0.0

    print(f"\n[+] E2E Execution Summary:")
    print(f"    • Total Appium Test Cases: {total}")
    print(f"    • Passed:                  {passed}")
    print(f"    • Failed:                  {failed}")
    print(f"    • Overall Pass Rate:       {pass_rate}%")
    print(f"\n[+] Excel Report Generated At:")
    print(f"    {os.path.abspath(saved_file)}")
    print("=" * 75 + "\n")

    return 0

if __name__ == "__main__":
    sys.exit(main())
