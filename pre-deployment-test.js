import { chromium } from 'playwright';

async function preDeploymentTest() {
  const results = { passed: 0, failed: 0, issues: [] };
  const browser = await chromium.launch({ headless: true });
  
  try {
    const page = await browser.newPage();
    
    // Test 1: Check if dev server is running
    console.log('🔍 Testing local development server...');
    try {
      await page.goto('http://localhost:3000', { waitUntil: 'networkidle', timeout: 10000 });
      console.log('✅ Local server accessible');
      results.passed++;
    } catch (error) {
      console.log('❌ Local server not running');
      results.failed++;
      results.issues.push('Local dev server not accessible');
      throw new Error('Local server must be running for tests');
    }
    
    // Test 2: Check version
    const version = await page.evaluate(() => window.CBLIX2_VERSION);
    if (version) {
      console.log(`✅ Version found: ${version}`);
      results.passed++;
    } else {
      console.log('❌ Version not found');
      results.failed++;
      results.issues.push('Version info missing');
    }
    
    // Test 3: Check main menu loads
    const startButton = await page.locator('#start-btn').isVisible();
    if (startButton) {
      console.log('✅ Start button visible');
      results.passed++;
    } else {
      console.log('❌ Start button not found');
      results.failed++;
      results.issues.push('Main menu not loading');
    }
    
    // Test 4: Check tutorial
    await page.click('#tutorial-btn');
    await page.waitForTimeout(1000);
    const tutorialVisible = await page.locator('.tutorial-screen').isVisible();
    if (tutorialVisible) {
      console.log('✅ Tutorial works');
      results.passed++;
      await page.click('#back-btn');
    } else {
      console.log('❌ Tutorial not working');
      results.failed++;
      results.issues.push('Tutorial not implemented');
    }
    
    // Test 5: Start game and check color buttons
    await page.click('#start-btn');
    await page.waitForTimeout(2000);
    const colorButtons = await page.locator('.color-button').count();
    if (colorButtons > 0) {
      console.log(`✅ ${colorButtons} color buttons visible`);
      results.passed++;
    } else {
      console.log('❌ No color buttons');
      results.failed++;
      results.issues.push('Color buttons not rendering');
    }
    
    // Test 6: Check responsive design
    const needsScroll = await page.evaluate(() => {
      return document.body.scrollHeight > window.innerHeight;
    });
    if (!needsScroll) {
      console.log('✅ No scrolling needed');
      results.passed++;
    } else {
      console.log('❌ Page requires scrolling');
      results.failed++;
      results.issues.push('Responsive design broken - scrolling detected');
    }
    
    await page.screenshot({ path: 'screenshots/pre-deployment.png' });
    
  } catch (error) {
    console.error('Pre-deployment test error:', error);
    results.failed++;
  } finally {
    await browser.close();
  }
  
  // Summary
  console.log(`\n📊 Pre-deployment: ${results.passed} passed, ${results.failed} failed`);
  if (results.failed > 0) {
    console.log('Issues:', results.issues.join(', '));
    process.exit(1);
  }
}

preDeploymentTest();
