from pages.base_page import BasePage, By

class SettingsPage(BasePage):
    """
    Page Object for Settings & Telemetry Sync Screen.
    """
    LOW_DATA_SWITCH = (By.ID, "switch_low_data")
    REFRESH_INTERVAL = (By.ID, "select_refresh")
    SAVE_BUTTON = (By.ID, "btn_save_settings")

    def fetch_settings(self):
        if self.is_mock():
            res = self.driver.get("/api/telemetry/settings")
            if res and res.status_code == 200:
                return res.json().get("data", {})
            return {}
        return {}

    def fetch_sync_status(self):
        if self.is_mock():
            res = self.driver.get("/api/telemetry/sync")
            if res and res.status_code == 200:
                return res.json().get("data", {})
            return {}
        return {}

    def update_settings(self, low_data_mode, refresh_interval, alert_threshold_mb=50.0):
        if self.is_mock():
            payload = {
                "low_data_mode": low_data_mode,
                "refresh_interval": refresh_interval,
                "wifi_only_sync": True,
                "alert_threshold_mb": alert_threshold_mb
            }
            res = self.driver.post("/api/telemetry/settings", json=payload)
            return res.json() if res else {}
        return {}
