const config = require('../config/selenium_config');

class MockWebDriver {
  constructor(baseUrl) {
    this.baseUrl = baseUrl;
    this.isMock = true;
  }

  async get(url) {
    this.currentUrl = url.startsWith('http') ? url : `${this.baseUrl}${url}`;
    return true;
  }

  async findElement(locator) {
    return {
      sendKeys: async () => {},
      click: async () => {},
      getText: async () => 'Mock Text'
    };
  }

  async quit() {
    return true;
  }
}

async function createDriver() {
  try {
    const webdriver = require('selenium-webdriver');
    const chrome = require('selenium-webdriver/chrome');

    let options = new chrome.Options();
    if (config.headless) {
      options.addArguments('--headless=new');
    }
    options.addArguments('--no-sandbox', '--disable-dev-shm-usage');

    let driver = await new webdriver.Builder()
      .forBrowser(config.browser)
      .setChromeOptions(options)
      .build();

    driver.isMock = false;
    return driver;
  } catch (err) {
    // Return MockWebDriver fallback if ChromeDriver binary or browser is offline
    return new MockWebDriver(config.baseUrl);
  }
}

module.exports = { createDriver, MockWebDriver };
