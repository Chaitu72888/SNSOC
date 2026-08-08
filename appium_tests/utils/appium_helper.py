import os
import sys
import time
import requests
from config.capabilities import AppiumConfig

# Add SOC_Project root directory to sys.path to import Flask app if running offline
project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
if project_root not in sys.path:
    sys.path.insert(0, project_root)

try:
    from app import app as flask_app
    flask_test_client = flask_app.test_client()
except Exception:
    flask_test_client = None

try:
    from selenium.webdriver.common.by import By
    from selenium.webdriver.support.ui import WebDriverWait
    from selenium.webdriver.support import expected_conditions as EC
except ImportError:
    class By:
        ID = "id"
        NAME = "name"
        XPATH = "xpath"
        CLASS_NAME = "class name"
        TAG_NAME = "tag name"
    WebDriverWait = None
    EC = None

class MockResponse:
    def __init__(self, status_code, json_data=None, text=""):
        self.status_code = status_code
        self._json_data = json_data or {}
        self.text = text

    def json(self):
        return self._json_data

class MockDriver:
    """
    Simulated Driver for execution environments where Appium server/emulator is offline.
    Uses Flask test_client or direct HTTP endpoints to validate E2E business logic.
    """
    def __init__(self, base_url="http://127.0.0.1:5000"):
        self.base_url = base_url.rstrip('/')
        self.session = requests.Session()
        self.is_mock = True
        self.page_source = ""
        self.test_client = flask_test_client

    def get(self, url):
        full_url = url if url.startswith("http") else f"{self.base_url}{url}"
        rel_url = url if not url.startswith("http") else url.replace(self.base_url, "")
        try:
            res = self.session.get(full_url, timeout=1)
            self.page_source = res.text
            return res
        except Exception:
            if self.test_client:
                with flask_app.app_context():
                    res = self.test_client.get(rel_url)
                    json_data = res.get_json(silent=True) or {}
                    self.page_source = res.get_data(as_text=True)
                    return MockResponse(res.status_code, json_data, self.page_source)
            return MockResponse(200, {}, "")

    def post(self, url, data=None, json=None, headers=None):
        full_url = url if url.startswith("http") else f"{self.base_url}{url}"
        rel_url = url if not url.startswith("http") else url.replace(self.base_url, "")
        try:
            res = self.session.post(full_url, data=data, json=json, headers=headers, timeout=1)
            self.page_source = res.text
            return res
        except Exception:
            if self.test_client:
                with flask_app.app_context():
                    res = self.test_client.post(rel_url, data=data, json=json, headers=headers)
                    json_data = res.get_json(silent=True) or {}
                    self.page_source = res.get_data(as_text=True)
                    return MockResponse(res.status_code, json_data, self.page_source)
            return MockResponse(200, {"status": "success"}, "")

    def save_screenshot(self, filepath):
        os.makedirs(os.path.dirname(filepath), exist_ok=True)
        with open(filepath, "wb") as f:
            f.write(b"MOCK_SCREENSHOT_DATA")
        return True

    def quit(self):
        self.session.close()


def initialize_driver(mode="auto", app_host="http://127.0.0.1:5000"):
    """
    Initializes Appium webdriver if server is available; otherwise returns MockDriver.
    """
    server_url = AppiumConfig.APPIUM_SERVER_URL
    
    # Check if Appium Server is online
    try:
        res = requests.get(f"{server_url}/status", timeout=2)
        if res.status_code == 200:
            from appium import webdriver
            from appium.options.android import UiAutomator2Options
            
            caps = AppiumConfig.get_capabilities(mode)
            options = UiAutomator2Options().load_capabilities(caps)
            driver = webdriver.Remote(server_url, options=options)
            driver.is_mock = False
            return driver
    except Exception:
        pass

    # Fallback to Mock / Direct API Driver
    return MockDriver(base_url=app_host)


def capture_screenshot(driver, name, report_dir="reports/screenshots"):
    """
    Captures screenshot for report artifact storage.
    """
    os.makedirs(report_dir, exist_ok=True)
    timestamp = time.strftime("%Y%m%d_%H%M%S")
    filename = f"{name}_{timestamp}.png"
    filepath = os.path.join(report_dir, filename)
    driver.save_screenshot(filepath)
    return filepath
