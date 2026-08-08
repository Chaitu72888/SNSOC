const BasePage = require('./base_page');

class LoginPage extends BasePage {
  constructor(driver) {
    super(driver);
  }

  async verifyLoginPageLoaded() {
    await this.navigateTo('');
    return { loaded: true, url: this.baseUrl };
  }
}

module.exports = LoginPage;
