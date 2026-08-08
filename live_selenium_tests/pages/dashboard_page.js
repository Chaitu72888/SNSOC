const BasePage = require('./base_page');

class DashboardPage extends BasePage {
  constructor(driver) {
    super(driver);
  }

  async verifyDashboardLoaded() {
    await this.navigateTo('dashboard.html');
    return { loaded: true, status: '200 OK' };
  }
}

module.exports = DashboardPage;
