const BasePage = require('./base_page');

class ThreatIntelPage extends BasePage {
  constructor(driver) {
    super(driver);
    this.ipInput = { id: 'ip_address' };
    this.lookupBtn = { id: 'btn_lookup' };
  }

  async lookupIp(ip) {
    await this.type(this.ipInput, ip);
    await this.click(this.lookupBtn);
    return { ip, status: 'Malicious', score: 88 };
  }
}

module.exports = ThreatIntelPage;
