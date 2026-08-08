from pages.base_page import BasePage, By

class LoginPage(BasePage):
    """
    Page Object for Authentication / Login Screen.
    """
    USERNAME_INPUT = (By.NAME, "username")
    PASSWORD_INPUT = (By.NAME, "password")
    LOGIN_BUTTON = (By.XPATH, "//button[@type='submit']")
    ERROR_MESSAGE = (By.CLASS_NAME, "error-msg")

    def login(self, username, password):
        if self.is_mock():
            response = self.driver.post('/auth/login', data={'username': username, 'password': password})
            return response
        else:
            self.driver.get(f"{self.driver.base_url}/auth/login")
            self.send_keys(*self.USERNAME_INPUT, username)
            self.send_keys(*self.PASSWORD_INPUT, password)
            self.click(*self.LOGIN_BUTTON)
            return True

    def get_error_message(self):
        if self.is_mock():
            if "Invalid credentials" in getattr(self.driver, 'page_source', ''):
                return "Invalid credentials"
            return ""
        return self.get_text(*self.ERROR_MESSAGE)
