import time

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

class BasePage:
    """
    Base Page class providing common element location, waiting strategies,
    text extraction, click operations, and mock API interactions.
    """
    def __init__(self, driver):
        self.driver = driver
        self.timeout = 10

    def is_mock(self):
        return getattr(self.driver, 'is_mock', False)

    def find_element(self, by, locator):
        if self.is_mock() or not WebDriverWait:
            return None
        return WebDriverWait(self.driver, self.timeout).until(
            EC.presence_of_element_located((by, locator))
        )

    def click(self, by, locator):
        if not self.is_mock() and WebDriverWait:
            element = self.find_element(by, locator)
            if element:
                element.click()

    def send_keys(self, by, locator, text):
        if not self.is_mock() and WebDriverWait:
            element = self.find_element(by, locator)
            if element:
                element.clear()
                element.send_keys(text)

    def get_text(self, by, locator):
        if not self.is_mock() and WebDriverWait:
            element = self.find_element(by, locator)
            return element.text if element else ""
        return ""
