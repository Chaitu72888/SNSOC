class BasePage {
  constructor(driver) {
    this.driver = driver;
  }

  async navigateTo(url) {
    if (this.driver.get) {
      await this.driver.get(url);
    }
  }

  async find(locator) {
    if (this.driver.isMock) {
      return {
        sendKeys: async () => {},
        click: async () => {},
        getText: async () => 'Mock Content'
      };
    }
    return await this.driver.findElement(locator);
  }

  async type(locator, text) {
    const element = await this.find(locator);
    if (element && element.sendKeys) {
      await element.sendKeys(text);
    }
  }

  async click(locator) {
    const element = await this.find(locator);
    if (element && element.click) {
      await element.click();
    }
  }
}

module.exports = BasePage;
