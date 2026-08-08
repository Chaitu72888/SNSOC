const path = require('path');

module.exports = {
  appiumServerUrl: process.env.APPIUM_SERVER_URL || 'http://127.0.0.1:4723',
  appHost: process.env.APP_HOST || 'http://127.0.0.1:5000',
  capabilities: {
    platformName: 'Android',
    'appium:automationName': 'UiAutomator2',
    'appium:deviceName': process.env.ANDROID_DEVICE_NAME || 'Android Emulator',
    'appium:app': process.env.ANDROID_APK_PATH || path.resolve(__dirname, '..', 'app-release.apk'),
    'appium:appPackage': 'com.snsoc.mobile',
    'appium:appActivity': '.MainActivity',
    'appium:noReset': false,
    'appium:autoGrantPermissions': true
  },
  reportPath: path.join(__dirname, '..', 'reports', 'Appium_Mobile_Test_Report.xlsx')
};
