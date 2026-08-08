import os

class AppiumConfig:
    """
    Configuration settings and Appium desired capabilities for Android Mobile Testing.
    Supports Android Emulator, Physical Android Device, and Web App fallback.
    """
    APPIUM_SERVER_URL = os.getenv("APPIUM_SERVER_URL", "http://127.0.0.1:4723")
    APP_HOST = os.getenv("APP_HOST", "http://127.0.0.1:5000")
    
    # Android Native App Capabilities
    ANDROID_APP_CAPS = {
        "platformName": "Android",
        "appium:automationName": "UiAutomator2",
        "appium:deviceName": os.getenv("ANDROID_DEVICE_NAME", "Android Emulator"),
        "appium:app": os.getenv("ANDROID_APK_PATH", os.path.abspath("app-release.apk")),
        "appium:appPackage": os.getenv("ANDROID_APP_PACKAGE", "com.snsoc.mobile"),
        "appium:appActivity": os.getenv("ANDROID_APP_ACTIVITY", ".MainActivity"),
        "appium:noReset": False,
        "appium:fullReset": False,
        "appium:newCommandTimeout": 300,
        "appium:autoGrantPermissions": True
    }

    # Android Mobile Web / Hybrid App Capabilities
    ANDROID_WEB_CAPS = {
        "platformName": "Android",
        "appium:automationName": "UiAutomator2",
        "appium:deviceName": os.getenv("ANDROID_DEVICE_NAME", "Android Emulator"),
        "appium:browserName": "Chrome",
        "appium:newCommandTimeout": 300
    }

    @classmethod
    def get_capabilities(cls, test_mode="app"):
        if test_mode == "web":
            return cls.ANDROID_WEB_CAPS
        return cls.ANDROID_APP_CAPS
