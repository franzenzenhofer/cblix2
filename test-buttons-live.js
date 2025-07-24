import { chromium } from 'playwright';

async function testButtonsLive() {
  console.log('🔍 Testing CBLIX2 buttons on live site...\n');
  
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  try {
    // Go to site
    await page.goto('https://cblix2.franzai.com', { waitUntil: 'networkidle' });
    console.log('✅ Site loaded');
    
    // Take initial screenshot
    await page.screenshot({ path: 'test-1-initial.png' });
    console.log('📸 Initial screenshot saved');
    
    // Test Tutorial button
    console.log('\n🎯 Testing Tutorial button...');
    const tutorialBtn = await page.locator('#tutorial-btn');
    const tutorialVisible = await tutorialBtn.isVisible();
    console.log(`Tutorial button visible: ${tutorialVisible}`);
    
    if (tutorialVisible) {
      await tutorialBtn.click();
      await page.waitForTimeout(1000);
      
      // Check if tutorial screen appeared
      const tutorialScreen = await page.locator('.tutorial-screen').isVisible();
      console.log(`Tutorial screen visible: ${tutorialScreen}`);
      
      await page.screenshot({ path: 'test-2-tutorial.png' });
      console.log('📸 Tutorial screenshot saved');
      
      // Go back
      const backBtn = await page.locator('#back-btn');
      if (await backBtn.isVisible()) {
        await backBtn.click();
        await page.waitForTimeout(500);
        console.log('✅ Returned to main menu');
      }
    }
    
    // Test Start button
    console.log('\n🎮 Testing Start button...');
    const startBtn = await page.locator('#start-btn');
    const startVisible = await startBtn.isVisible();
    console.log(`Start button visible: ${startVisible}`);
    
    if (startVisible) {
      await startBtn.click();
      await page.waitForTimeout(2000);
      
      // Check if game started
      const gameCanvas = await page.locator('#game-canvas').isVisible();
      const colorButtons = await page.locator('.color-button').count();
      console.log(`Game canvas visible: ${gameCanvas}`);
      console.log(`Color buttons count: ${colorButtons}`);
      
      await page.screenshot({ path: 'test-3-game.png' });
      console.log('📸 Game screenshot saved');
    }
    
    // Check version
    const version = await page.evaluate(() => window.CBLIX2_VERSION);
    console.log(`\n📦 Version: ${version}`);
    
    console.log('\n✅ Button test complete!');
    console.log('Check screenshots: test-1-initial.png, test-2-tutorial.png, test-3-game.png');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await page.waitForTimeout(5000); // Keep browser open to inspect
    await browser.close();
  }
}

testButtonsLive();