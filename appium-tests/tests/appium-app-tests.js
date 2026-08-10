/**
 * ============================================================================
 * SNSOC.live - Android App E2E Appium WebDriver Test Suite
 * File: appium-tests/tests/appium-app-tests.js
 * 
 * Description:
 * End-to-End (E2E) Appium Mobile Automation Test Suite for the SNSOC Android
 * Application (com.snsoc.app). Automated tests cover App launch, Login view,
 * form input validation, positive/negative authentication, security payloads,
 * bottom navigation, RecyclerView scroll gestures, device orientation, and lifecycle.
 * ============================================================================
 */

const { remote } = require('webdriverio');
const assert = require('assert');
const fs = require('fs');
const path = require('path');

// Appium & Device Capabilities Configuration
const APPIUM_CONFIG = {
    hostname: process.env.APPIUM_HOST || '127.0.0.1',
    port: parseInt(process.env.APPIUM_PORT || '4723', 10),
    path: '/',
    capabilities: {
        platformName: 'Android',
        'appium:automationName': 'UiAutomator2',
        'appium:deviceName': process.env.ANDROID_DEVICE_NAME || 'Android Emulator',
        'appium:appPackage': 'com.snsoc.app',
        'appium:appActivity': 'com.snsoc.app.ui.LoginActivity',
        'appium:noReset': false,
        'appium:fullReset': false,
        'appium:newCommandTimeout': 60000
    }
};

// Resource IDs for Android UI Elements
const RESOURCE_IDS = {
    PACKAGE: 'com.snsoc.app',
    usernameInput: 'com.snsoc.app:id/etUsername',
    passwordInput: 'com.snsoc.app:id/etPassword',
    loginButton: 'com.snsoc.app:id/btnLogin',
    errorText: 'com.snsoc.app:id/tvError',
    loadingProgressBar: 'com.snsoc.app:id/pbLoading',
    bottomNav: 'com.snsoc.app:id/bottomNav',
    fragmentContainer: 'com.snsoc.app:id/fragmentContainer',
    // Nav Items
    navDashboard: 'com.snsoc.app:id/nav_dashboard',
    navIds: 'com.snsoc.app:id/nav_ids',
    navIntel: 'com.snsoc.app:id/nav_intel',
    navTelemetry: 'com.snsoc.app:id/nav_telemetry',
    navBlocked: 'com.snsoc.app:id/nav_blocked'
};

// Page Object Model (POM) - Android Login Screen
class AppLoginScreen {
    constructor(driver) {
        this.driver = driver;
    }

    async getUsernameInput() {
        return await this.driver.$(`id:${RESOURCE_IDS.usernameInput}`);
    }

    async getPasswordInput() {
        return await this.driver.$(`id:${RESOURCE_IDS.passwordInput}`);
    }

    async getLoginButton() {
        return await this.driver.$(`id:${RESOURCE_IDS.loginButton}`);
    }

    async getErrorTextElement() {
        return await this.driver.$(`id:${RESOURCE_IDS.errorText}`);
    }

    async enterCredentials(username, password) {
        const uInput = await this.getUsernameInput();
        await uInput.clearValue();
        if (username) {
            await uInput.setValue(username);
        }

        const pInput = await this.getPasswordInput();
        await pInput.clearValue();
        if (password) {
            await pInput.setValue(password);
        }
    }

    async tapLogin() {
        const btn = await this.getLoginButton();
        await btn.click();
    }

    async getErrorMessage() {
        try {
            const errElem = await this.getErrorTextElement();
            if (await errElem.isDisplayed()) {
                return await errElem.getText();
            }
        } catch (e) {
            return null;
        }
        return null;
    }
}

// Page Object Model (POM) - Android Main Screen
class AppMainScreen {
    constructor(driver) {
        this.driver = driver;
    }

    async getBottomNav() {
        return await this.driver.$(`id:${RESOURCE_IDS.bottomNav}`);
    }

    async getFragmentContainer() {
        return await this.driver.$(`id:${RESOURCE_IDS.fragmentContainer}`);
    }

    async navigateToTab(tabId) {
        const tabElem = await this.driver.$(`id:${tabId}`);
        await tabElem.click();
        await this.driver.pause(500);
    }
}

// Test Execution Logger
class AppiumTestRunner {
    constructor() {
        this.results = [];
        this.passedCount = 0;
        this.failedCount = 0;
        this.skippedCount = 0;
    }

    async recordResult(testId, title, category, testFn) {
        const startTime = Date.now();
        let status = 'Passed';
        let errorMsg = null;

        try {
            await testFn();
            this.passedCount++;
            console.log(`  [PASS] ${testId} - ${title}`);
        } catch (err) {
            status = 'Failed';
            errorMsg = err.message;
            this.failedCount++;
            console.error(`  [FAIL] ${testId} - ${title}: ${err.message}`);
        }

        const durationMs = Date.now() - startTime;
        this.results.push({
            testId,
            title,
            category,
            status,
            durationMs,
            errorMsg,
            timestamp: new Date().toISOString()
        });
    }

    printSummary() {
        console.log('\n==================================================');
        console.log('       SNSOC APPIUM MOBILE E2E SUMMARY            ');
        console.log('==================================================');
        console.log(` Total Executed : ${this.results.length}`);
        console.log(` Passed         : ${this.passedCount}`);
        console.log(` Failed         : ${this.failedCount}`);
        console.log(` Skipped        : ${this.skippedCount}`);
        console.log(` Pass Rate      : ${((this.passedCount / Math.max(1, this.results.length)) * 100).toFixed(1)}%`);
        console.log('==================================================\n');
    }

    saveJsonReport(filename = 'appium-test-results.json') {
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
        console.log(`[IO] Appium Test Execution JSON saved to ${reportPath}`);
    }
}

// Main Appium E2E Runner
async function runAppiumTests() {
    console.log('[INFO] Launching Appium E2E Mobile Tests for SNSOC Android App...');
    let driver;
    const runner = new AppiumTestRunner();

    try {
        // Connect to Appium server
        driver = await remote(APPIUM_CONFIG);
        console.log('[INFO] Connected to Appium Server successfully. Session ID:', driver.sessionId);

        const loginScreen = new AppLoginScreen(driver);
        const mainScreen = new AppMainScreen(driver);

        // ------------------------------------------------------------------------
        // Suite 1: Login Activity UI Render Tests
        // ------------------------------------------------------------------------
        console.log('\n--- Suite 1: Login Activity UI Render ---');

        await runner.recordResult('TC_APP_001', 'LoginActivity Elements Visibility', 'UI Render', async () => {
            const uInput = await loginScreen.getUsernameInput();
            const pInput = await loginScreen.getPasswordInput();
            const btn = await loginScreen.getLoginButton();

            assert(await uInput.isDisplayed(), 'etUsername is not displayed');
            assert(await pInput.isDisplayed(), 'etPassword is not displayed');
            assert(await btn.isDisplayed(), 'btnLogin is not displayed');
        });

        await runner.recordResult('TC_APP_002', 'Password Field Password Masking', 'Security UI', async () => {
            const pInput = await loginScreen.getPasswordInput();
            const isPasswordType = await pInput.getAttribute('password');
            assert.strictEqual(isPasswordType, 'true', 'etPassword input is not masked');
        });

        // ------------------------------------------------------------------------
        // Suite 2: Negative Authentication Tests
        // ------------------------------------------------------------------------
        console.log('\n--- Suite 2: Negative Authentication & Errors ---');

        await runner.recordResult('TC_APP_003', 'Invalid Passcode Error Toast', 'Negative Auth', async () => {
            await loginScreen.enterCredentials('sivachaitanya72@gmail.com', 'wrongpassword');
            await loginScreen.tapLogin();
            await driver.pause(1000);

            const errText = await loginScreen.getErrorMessage();
            assert(errText !== null || (await driver.getCurrentActivity()).includes('LoginActivity'), 
                'Expected error or remaining on LoginActivity');
        });

        await runner.recordResult('TC_APP_004', 'SQL Injection Resilience in Mobile App', 'Security', async () => {
            await loginScreen.enterCredentials("' OR '1'='1", "' OR '1'='1");
            await loginScreen.tapLogin();
            await driver.pause(1000);

            const currentActivity = await driver.getCurrentActivity();
            assert(currentActivity.includes('LoginActivity'), 'SQL Injection bypassed Android auth!');
        });

        // ------------------------------------------------------------------------
        // Suite 3: Positive Authentication & Main Dashboard Navigation
        // ------------------------------------------------------------------------
        console.log('\n--- Suite 3: Positive Authentication & Navigation ---');

        await runner.recordResult('TC_APP_005', 'Valid Authentication & MainActivity Transition', 'Positive Auth', async () => {
            await loginScreen.enterCredentials('sivachaitanya72@gmail.com', 'siva2580');
            await loginScreen.tapLogin();

            await driver.waitUntil(async () => {
                const activity = await driver.getCurrentActivity();
                return activity.includes('MainActivity');
            }, { timeout: 10000, timeoutMsg: 'MainActivity launch timed out' });

            const currentActivity = await driver.getCurrentActivity();
            assert(currentActivity.includes('MainActivity'), 'Failed to transition to MainActivity');
        });

        await runner.recordResult('TC_APP_006', 'Bottom Navigation Bar Visibility', 'Navigation', async () => {
            const bottomNav = await mainScreen.getBottomNav();
            assert(await bottomNav.isDisplayed(), 'BottomNavigationView not visible in MainActivity');
        });

        await runner.recordResult('TC_APP_007', 'Threat Intel Tab Switching', 'Navigation', async () => {
            await mainScreen.navigateToTab(RESOURCE_IDS.navIntel);
            const container = await mainScreen.getFragmentContainer();
            assert(await container.isDisplayed(), 'Fragment container failed to render Threat Intel');
        });

        await runner.recordResult('TC_APP_008', 'Telemetry Tab Switching', 'Navigation', async () => {
            await mainScreen.navigateToTab(RESOURCE_IDS.navTelemetry);
            const container = await mainScreen.getFragmentContainer();
            assert(await container.isDisplayed(), 'Fragment container failed to render Telemetry');
        });

        // ------------------------------------------------------------------------
        // Suite 4: Device Orientation & Lifecycle
        // ------------------------------------------------------------------------
        console.log('\n--- Suite 4: Device Orientation & Lifecycle ---');

        await runner.recordResult('TC_APP_009', 'Landscape Orientation Layout Check', 'Responsiveness', async () => {
            await driver.setOrientation('LANDSCAPE');
            await driver.pause(1000);

            const bottomNav = await mainScreen.getBottomNav();
            assert(await bottomNav.isDisplayed(), 'Bottom nav hidden in Landscape orientation');

            // Restore portrait
            await driver.setOrientation('PORTRAIT');
            await driver.pause(500);
        });

        await runner.recordResult('TC_APP_010', 'Backgrounding App and Resuming', 'Lifecycle', async () => {
            await driver.background(3); // Background for 3 seconds
            const currentActivity = await driver.getCurrentActivity();
            assert(currentActivity.includes('MainActivity'), 'App lost state after backgrounding');
        });

        runner.printSummary();
        runner.saveJsonReport();

    } catch (err) {
        console.error('[FATAL ERROR] Appium driver execution failed:', err.message);
    } finally {
        if (driver) {
            console.log('[INFO] Closing Appium driver session...');
            await driver.deleteSession();
        }
    }
}

// CLI Direct Execution Support
if (require.main === module) {
    runAppiumTests();
}

module.exports = {
    AppLoginScreen,
    AppMainScreen,
    AppiumTestRunner,
    runAppiumTests,
    RESOURCE_IDS
};
