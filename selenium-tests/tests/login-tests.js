/**
 * ============================================================================
 * SNSOC.live - Web Frontend E2E Selenium WebDriver Test Suite
 * File: selenium-tests/tests/login-tests.js
 * 
 * Description:
 * Comprehensive End-to-End (E2E) automated testing for the SNSOC Web Frontend
 * Authentication & Login Module. Evaluates page structure, UI elements,
 * positive/negative login flows, input validation, security injection tests,
 * session lifecycle, keyboard navigation, viewport responsiveness, and latency.
 * ============================================================================
 */

const { Builder, By, Key, until } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');
const assert = require('assert');
const fs = require('fs');
const path = require('path');

// Configuration
const CONFIG = {
    baseUrl: process.env.TEST_BASE_URL || 'http://localhost:5000',
    loginPath: '/auth/login',
    dashboardPath: '/',
    timeoutMs: 10000,
    headless: process.env.HEADLESS !== 'false',
    validUser: {
        username: process.env.TEST_USER || 'sivachaitanya72@gmail.com',
        password: process.env.TEST_PASS || 'siva2580'
    },
    invalidUsers: [
        { name: 'invalid@example.com', pass: 'wrongpass', desc: 'Invalid Credentials' },
        { name: '', pass: 'siva2580', desc: 'Empty Username' },
        { name: 'sivachaitanya72@gmail.com', pass: '', desc: 'Empty Password' },
        { name: "' OR '1'='1", pass: "' OR '1'='1", desc: 'SQL Injection Payload' },
        { name: '<script>alert(1)</script>', pass: 'test', desc: 'XSS Payload' }
    ]
};

// Page Object Model (POM) - Login Page
class LoginPage {
    constructor(driver, baseUrl) {
        this.driver = driver;
        this.url = `${baseUrl}${CONFIG.loginPath}`;
        this.locators = {
            loginBox: By.css('.login-box'),
            logoText: By.css('.logo h2'),
            logoHighlight: By.css('.logo h2 .highlight'),
            usernameInput: By.name('username'),
            passwordInput: By.name('password'),
            submitButton: By.css('button[type="submit"]'),
            errorMessage: By.css('.error-msg'),
            labels: By.css('.form-group label')
        };
    }

    async navigate() {
        await this.driver.get(this.url);
        await this.driver.wait(until.elementLocated(this.locators.loginBox), CONFIG.timeoutMs);
    }

    async getTitle() {
        return await this.driver.getTitle();
    }

    async enterUsername(username) {
        const input = await this.driver.findElement(this.locators.usernameInput);
        await input.clear();
        if (username) {
            await input.sendKeys(username);
        }
    }

    async enterPassword(password) {
        const input = await this.driver.findElement(this.locators.passwordInput);
        await input.clear();
        if (password) {
            await input.sendKeys(password);
        }
    }

    async submitForm() {
        const btn = await this.driver.findElement(this.locators.submitButton);
        await btn.click();
    }

    async submitWithEnterKey() {
        const passInput = await this.driver.findElement(this.locators.passwordInput);
        await passInput.sendKeys(Key.RETURN);
    }

    async login(username, password, submitMethod = 'click') {
        await this.enterUsername(username);
        await this.enterPassword(password);
        if (submitMethod === 'enter') {
            await this.submitWithEnterKey();
        } else {
            await this.submitForm();
        }
    }

    async getErrorMessage() {
        try {
            const errElem = await this.driver.wait(
                until.elementLocated(this.locators.errorMessage),
                3000
            );
            return await errElem.getText();
        } catch (e) {
            return null;
        }
    }

    async isPasswordMasked() {
        const input = await this.driver.findElement(this.locators.passwordInput);
        const type = await input.getAttribute('type');
        return type === 'password';
    }
}

// Test Runner Framework
class SeleniumTestRunner {
    constructor() {
        this.results = [];
        this.passedCount = 0;
        this.failedCount = 0;
        this.skippedCount = 0;
    }

    async recordResult(testId, name, category, fn) {
        const startTime = Date.now();
        let status = 'Passed';
        let errorMsg = null;

        try {
            await fn();
            this.passedCount++;
            console.log(`  [PASS] ${testId} - ${name}`);
        } catch (err) {
            status = 'Failed';
            errorMsg = err.message;
            this.failedCount++;
            console.error(`  [FAIL] ${testId} - ${name}: ${err.message}`);
        }

        const durationMs = Date.now() - startTime;
        this.results.push({
            testId,
            name,
            category,
            status,
            durationMs,
            errorMsg,
            timestamp: new Date().toISOString()
        });
    }

    printSummary() {
        console.log('\n==================================================');
        console.log('         SNSOC E2E TEST EXECUTION SUMMARY         ');
        console.log('==================================================');
        console.log(` Total Executed : ${this.results.length}`);
        console.log(` Passed         : ${this.passedCount}`);
        console.log(` Failed         : ${this.failedCount}`);
        console.log(` Skipped        : ${this.skippedCount}`);
        console.log(` Pass Rate      : ${((this.passedCount / Math.max(1, this.results.length)) * 100).toFixed(1)}%`);
        console.log('==================================================\n');
    }

    saveJsonReport(filename = 'test-results.json') {
        const reportPath = path.join(__dirname, '..', filename);
        const reportData = {
            summary: {
                total: this.results.length,
                passed: this.passedCount,
                failed: this.failedCount,
                skipped: this.skippedCount,
                passRate: `${((this.passedCount / Math.max(1, this.results.length)) * 100).toFixed(1)}%`,
                executedAt: new Date().toISOString()
            },
            tests: this.results
        };
        fs.writeFileSync(reportPath, JSON.stringify(reportData, null, 2));
        console.log(`[IO] Detailed test execution JSON saved to ${reportPath}`);
    }
}

// Main Test Execution Function
async function runSeleniumTests() {
    console.log('[INFO] Starting Selenium E2E Web Frontend Tests for SNSOC...');
    
    // Configure Chrome options
    const options = new chrome.Options();
    if (CONFIG.headless) {
        options.addArguments('--headless=new');
    }
    options.addArguments('--no-sandbox');
    options.addArguments('--disable-dev-shm-usage');
    options.addArguments('--window-size=1920,1080');

    let driver;
    const runner = new SeleniumTestRunner();

    try {
        driver = await new Builder()
            .forBrowser('chrome')
            .setChromeOptions(options)
            .build();

        await driver.manage().setTimeouts({ implicit: 5000, pageLoad: 15000 });
        const loginPage = new LoginPage(driver, CONFIG.baseUrl);

        // ------------------------------------------------------------------------
        // Suite 1: Page Loading & Render Integrity
        // ------------------------------------------------------------------------
        console.log('\n--- Running Suite 1: UI & Render Integrity ---');
        
        await runner.recordResult('TC_JS_001', 'Page Title Verification', 'UI Integrity', async () => {
            await loginPage.navigate();
            const title = await loginPage.getTitle();
            assert.strictEqual(title, 'SNSOC.live', `Expected 'SNSOC.live' but got '${title}'`);
        });

        await runner.recordResult('TC_JS_002', 'Logo & Title Element Check', 'UI Integrity', async () => {
            const logoText = await driver.findElement(loginPage.locators.logoText).getText();
            assert(logoText.includes('SNSOC'), 'Logo text does not contain SNSOC');
            const highlightText = await driver.findElement(loginPage.locators.logoHighlight).getText();
            assert.strictEqual(highlightText, '.live', 'Logo highlight text is invalid');
        });

        await runner.recordResult('TC_JS_003', 'Form Fields & Buttons Presence', 'UI Integrity', async () => {
            const usernameElem = await driver.findElement(loginPage.locators.usernameInput);
            const passwordElem = await driver.findElement(loginPage.locators.passwordInput);
            const buttonElem = await driver.findElement(loginPage.locators.submitButton);
            
            assert(await usernameElem.isDisplayed(), 'Username input not visible');
            assert(await passwordElem.isDisplayed(), 'Password input not visible');
            assert(await buttonElem.isDisplayed(), 'Submit button not visible');
        });

        await runner.recordResult('TC_JS_004', 'Password Input Security Masking', 'Security', async () => {
            const isMasked = await loginPage.isPasswordMasked();
            assert(isMasked, 'Password field input is not masked with type="password"');
        });

        // ------------------------------------------------------------------------
        // Suite 2: Negative & Validation Testing
        // ------------------------------------------------------------------------
        console.log('\n--- Running Suite 2: Negative & Validation Testing ---');

        await runner.recordResult('TC_JS_005', 'Invalid Password Submission Error', 'Negative Validation', async () => {
            await loginPage.navigate();
            await loginPage.login(CONFIG.validUser.username, 'wrongpassword123');
            const errMsg = await loginPage.getErrorMessage();
            assert.strictEqual(errMsg, 'Invalid credentials', `Unexpected error message: ${errMsg}`);
        });

        await runner.recordResult('TC_JS_006', 'SQL Injection Resilience Test', 'Security', async () => {
            await loginPage.navigate();
            await loginPage.login("' OR '1'='1", "' OR '1'='1");
            const currentUrl = await driver.getCurrentUrl();
            assert(currentUrl.includes('/auth/login'), 'SQL Injection allowed bypass to protected page!');
        });

        await runner.recordResult('TC_JS_007', 'XSS Payload Form Handling', 'Security', async () => {
            await loginPage.navigate();
            await loginPage.login('<script>alert(1)</script>', 'xss_test_pass');
            const errMsg = await loginPage.getErrorMessage();
            assert(errMsg === 'Invalid credentials' || errMsg !== null, 'XSS script payload caused unhandled error');
        });

        // ------------------------------------------------------------------------
        // Suite 3: Positive Authentication & Navigation
        // ------------------------------------------------------------------------
        console.log('\n--- Running Suite 3: Positive Authentication & Navigation ---');

        await runner.recordResult('TC_JS_008', 'Successful Login & Redirection', 'Authentication', async () => {
            await loginPage.navigate();
            await loginPage.login(CONFIG.validUser.username, CONFIG.validUser.password);
            
            // Wait for redirection to dashboard
            await driver.wait(async () => {
                const url = await driver.getCurrentUrl();
                return url === `${CONFIG.baseUrl}/` || url === `${CONFIG.baseUrl}/#` || !url.includes('/login');
            }, 8000, 'Redirect to dashboard timed out');

            const currentUrl = await driver.getCurrentUrl();
            assert.strictEqual(currentUrl.replace(/\/$/, ''), CONFIG.baseUrl, 'Failed to redirect to root dashboard');
        });

        await runner.recordResult('TC_JS_009', 'Session Cookie Assertion', 'Session Management', async () => {
            const cookies = await driver.manage().getCookies();
            const sessionCookie = cookies.find(c => c.name === 'session');
            assert(sessionCookie, 'Session cookie not created after successful login');
        });

        await runner.recordResult('TC_JS_010', 'Keyboard Navigation & Enter Key Submit', 'UX & Accessibility', async () => {
            await loginPage.navigate();
            await loginPage.login(CONFIG.validUser.username, CONFIG.validUser.password, 'enter');
            
            await driver.wait(async () => {
                const url = await driver.getCurrentUrl();
                return !url.includes('/login');
            }, 8000, 'Enter key submit did not trigger redirection');
        });

        // ------------------------------------------------------------------------
        // Suite 4: Responsive & Viewport Testing
        // ------------------------------------------------------------------------
        console.log('\n--- Running Suite 4: Responsive Viewports ---');

        await runner.recordResult('TC_JS_011', 'Mobile Viewport Render (375x812)', 'Responsiveness', async () => {
            await driver.manage().window().setRect({ width: 375, height: 812 });
            await loginPage.navigate();
            const loginBox = await driver.findElement(loginPage.locators.loginBox);
            assert(await loginBox.isDisplayed(), 'Login box not rendered properly in mobile view');
        });

        await runner.recordResult('TC_JS_012', 'Tablet Viewport Render (768x1024)', 'Responsiveness', async () => {
            await driver.manage().window().setRect({ width: 768, height: 1024 });
            await loginPage.navigate();
            const btn = await driver.findElement(loginPage.locators.submitButton);
            assert(await btn.isDisplayed(), 'Submit button not rendered properly in tablet view');
            // Restore desktop size
            await driver.manage().window().setRect({ width: 1920, height: 1080 });
        });

        runner.printSummary();
        runner.saveJsonReport();

    } catch (globalErr) {
        console.error('[FATAL ERROR] Selenium test execution failed:', globalErr);
    } finally {
        if (driver) {
            console.log('[INFO] Closing Selenium WebDriver session...');
            await driver.quit();
        }
    }
}

// Module Export & Direct CLI execution support
if (require.main === module) {
    runSeleniumTests();
}

module.exports = {
    LoginPage,
    SeleniumTestRunner,
    runSeleniumTests,
    CONFIG
};
