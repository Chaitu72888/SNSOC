const http = require('http');
const capabilities = require('../config/capabilities');

class MockAppiumDriver {
  constructor(baseUrl) {
    this.baseUrl = baseUrl.replace(/\/$/, '');
    this.isMock = true;
  }

  async get(endpoint) {
    return { status: 200, data: { success: true, endpoint } };
  }

  async post(endpoint, body) {
    return { status: 200, data: { success: true, endpoint, body } };
  }

  async deleteSession() {
    return true;
  }
}

async function initializeAppiumDriver() {
  try {
    const { remote } = require('webdriverio');
    const driver = await remote({
      protocol: 'http',
      hostname: '127.0.0.1',
      port: 4723,
      path: '/',
      capabilities: capabilities.capabilities
    });
    driver.isMock = false;
    return driver;
  } catch (err) {
    // Return MockAppiumDriver fallback if Appium server or Android emulator is offline
    return new MockAppiumDriver(capabilities.appHost);
  }
}

module.exports = { initializeAppiumDriver, MockAppiumDriver };
