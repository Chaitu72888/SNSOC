const path = require('path');
const config = require('../config/live_config');

class BasePage {
  constructor(driver) {
    this.driver = driver;
    this.baseUrl = config.baseUrl;
  }

  async navigateTo(relativeUrl = '') {
    const fullUrl = relativeUrl.startsWith('http')
      ? relativeUrl
      : `${this.baseUrl}${relativeUrl.replace(/^\//, '')}`;
    if (this.driver.get) {
      await this.driver.get(fullUrl);
    }
  }

  async captureScreenshot(name) {
    try {
      const filename = `${name}_${Date.now()}.png`;
      const filePath = path.join(config.screenshotsDir, filename);
      if (this.driver.takeScreenshot) {
        const image = await this.driver.takeScreenshot();
        require('fs').writeFileSync(filePath, image, 'base64');
      } else {
        require('fs').writeFileSync(filePath, Buffer.from('SCREENSHOT_DUMMY'));
      }
      return filePath;
    } catch (e) {
      return null;
    }
  }
}

module.exports = BasePage;
