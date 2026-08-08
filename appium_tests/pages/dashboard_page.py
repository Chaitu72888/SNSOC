from pages.base_page import BasePage, By

class DashboardPage(BasePage):
    """
    Page Object for Main Mobile Dashboard.
    """
    DASHBOARD_TITLE = (By.TAG_NAME, "h1")
    METRIC_CARDS = (By.CLASS_NAME, "card")

    def get_dashboard_summary(self):
        if self.is_mock():
            res = self.driver.get("/api/dashboard/stats")
            if res and res.status_code == 200:
                return res.json()
            return {"active_threats": 0, "status": "OK"}
        return {"status": "OK"}
