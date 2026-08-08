from pages.base_page import BasePage, By

class ThreatIntelPage(BasePage):
    """
    Page Object for Threat Intelligence IP Lookup Screen.
    """
    IP_INPUT = (By.ID, "ip_address")
    LOOKUP_BUTTON = (By.ID, "btn_lookup")
    RESULT_SCORE = (By.ID, "threat_score")
    RESULT_STATUS = (By.ID, "threat_status")

    def lookup_ip(self, ip_address):
        if self.is_mock():
            res = self.driver.post("/api/intel/lookup", json={"ip": ip_address})
            if res and hasattr(res, 'json'):
                data = res.json()
                if isinstance(data, dict):
                    # Unwrap response format: {"success": True, "data": {...}}
                    inner = data.get("data", data)
                    score = inner.get("score", 0)
                    status = "Malicious" if score > 70 else "Suspicious" if score > 30 else "Clean"
                    return {"status": status, "threat_score": score, "ip": ip_address, "raw": inner}
            return {"status": "Clean", "threat_score": 0, "ip": ip_address}
        else:
            self.send_keys(*self.IP_INPUT, ip_address)
            self.click(*self.LOOKUP_BUTTON)
            return {
                "status": self.get_text(*self.RESULT_STATUS),
                "threat_score": self.get_text(*self.RESULT_SCORE)
            }
