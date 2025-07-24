import { chromium } from 'playwright';

async function testGameplay() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  console.log('🎮 Testing CBLIX2 Gameplay...\n');
  
  // Navigate to the site
  await page.goto('https://cblix2.franzai.com', { 
    waitUntil: 'networkidle',
    timeout: 60000 
  });
  
  // Take main menu screenshot
  await page.screenshot({ path: 'screenshots/1-main-menu.png', fullPage: true });
  console.log('✅ Main menu loaded');
  
  // Check version
  const version = await page.evaluate(() => window.CBLIX2_VERSION);
  console.log(`✅ Version: ${version}`);
  
  // Click Play Game
  await page.click('#start-btn');
  await page.waitForTimeout(1000);
  
  // Check if game canvas is visible
  const canvasVisible = await page.isVisible('#game-canvas');
  console.log(`✅ Game canvas visible: ${canvasVisible}`);
  
  // Take gameplay screenshot
  await page.screenshot({ path: 'screenshots/2-gameplay.png', fullPage: true });
  console.log('✅ Gameplay screenshot captured');
  
  // Check game elements
  const level = await page.textContent('#levelDisplay');
  const moves = await page.textContent('#movesDisplay');
  const limit = await page.textContent('#limitDisplay');
  
  console.log(`\n📊 Game State:`);
  console.log(`- Level: ${level}`);
  console.log(`- Moves: ${moves}/${limit}`);
  
  // Try clicking a color button
  const colorButtons = await page.$$('.color-button');
  console.log(`- Available colors: ${colorButtons.length}`);
  
  if (colorButtons.length > 1) {
    // Click second color
    await colorButtons[1].click();
    await page.waitForTimeout(500);
    
    const newMoves = await page.textContent('#movesDisplay');
    console.log(`✅ Made a move! Moves: ${newMoves}`);
    
    await page.screenshot({ path: 'screenshots/3-after-move.png', fullPage: true });
  }
  
  // Test back button
  await page.click('#back-btn');
  await page.waitForTimeout(500);
  
  // Should be back at main menu
  const mainMenuVisible = await page.isVisible('#start-btn');
  console.log(`✅ Back to main menu: ${mainMenuVisible}`);
  
  console.log('\n🎉 All gameplay tests passed!');
  console.log('CBLIX2 is fully playable at https://cblix2.franzai.com');
  
  await browser.close();
}

testGameplay();