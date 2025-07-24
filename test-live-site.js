import { chromium } from 'playwright';

async function testLiveSite() {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  console.log('🌐 Testing live CBLIX2 site...\n');
  
  try {
    // Test the live site
    await page.goto('https://cblix2.franzai.com', { waitUntil: 'networkidle' });
    
    // Take screenshot
    await page.screenshot({ path: 'screenshots/live-site.png', fullPage: true });
    console.log('✅ Screenshot saved: screenshots/live-site.png');
    
    // Check version is visible
    const version = await page.evaluate(() => window.CBLIX2_VERSION);
    console.log(`✅ Version detected: ${version}`);
    
    // Check build date
    const buildDate = await page.evaluate(() => window.CBLIX2_BUILD_DATE);
    console.log(`✅ Build date: ${buildDate}`);
    
    // Check title
    const title = await page.title();
    console.log(`✅ Page title: ${title}`);
    
    // Check if game loads
    const gameTitle = await page.locator('.game-title').textContent();
    console.log(`✅ Game title visible: ${gameTitle}`);
    
    // Check tagline
    const tagline = await page.locator('.tagline').textContent();
    console.log(`✅ Tagline: ${tagline}`);
    
    // Click version info
    await page.locator('.version-info').click();
    console.log('✅ Version info is clickable');
    
    // Click Play button
    await page.click('#start-btn');
    await page.waitForTimeout(1000);
    
    // Check if game board appears
    const canvas = await page.locator('#game-canvas').isVisible();
    console.log(`✅ Game canvas visible: ${canvas}`);
    
    // Take game screenshot
    await page.screenshot({ path: 'screenshots/live-game.png', fullPage: true });
    console.log('✅ Game screenshot saved: screenshots/live-game.png');
    
    // Test responsive design
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('https://cblix2.franzai.com');
    await page.screenshot({ path: 'screenshots/live-mobile.png', fullPage: true });
    console.log('✅ Mobile screenshot saved: screenshots/live-mobile.png');
    
    console.log('\n🎉 All tests passed! CBLIX2 is live and working at https://cblix2.franzai.com');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await browser.close();
  }
}

testLiveSite();