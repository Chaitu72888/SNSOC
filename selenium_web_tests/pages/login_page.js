const BasePage = require('./base_page');

class LoginPage extends BasePage {
  constructor(driver) {
    super(driver);
    this.usernameInput = { name: 'username' };
    this.passwordInput = { name: 'password' };
    this.submitBtn = { css: 'button[type="submit"]' };
  }

  async login(username, password) {
    await this.navigateTo('/auth/login');
    await this.type(this.usernameInput, username);
    await this.type(this.passwordInput, password);
    await this.click(this.submitBtn);
    return true;
  }
}

module.exports = LoginPage;
