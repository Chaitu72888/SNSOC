import pytest
from utils.appium_helper import initialize_driver

GLOBAL_TEST_RESULTS = []

@pytest.fixture(scope="session")
def driver_setup():
    """
    Session-wide fixture that initializes Appium / Mock driver and collects test results.
    """
    driver = initialize_driver()
    yield driver, GLOBAL_TEST_RESULTS
    try:
        driver.quit()
    except Exception:
        pass
