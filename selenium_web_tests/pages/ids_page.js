const BasePage = require('./base_page');

class IDSPage extends BasePage {
  constructor(driver) {
    super(driver);
    this.portRules = [22, 23, 445, 3389];
  }

  async checkRules() {
    return { ports: this.portRules, active: true };
  }
}

module.exports = IDSPage;
