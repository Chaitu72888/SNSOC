const BasePage = require('./base_page');

class DashboardPage extends BasePage {
  constructor(driver) {
    super(driver);
    this.titleHeader = { css: 'h1' };
    this.threatCards = { css: '.card' };
  }

  async loadDashboard() {
    await this.navigateTo('/');
    return { status: 'OK', loaded: true };
  }
}

module.exports = DashboardPage;
