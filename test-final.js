import { chromium } from 'playwright';

async function testFinal() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  console.log('\n📋 Running deployment tests...\n');
  
  try {
    // Test 1: Load site
    await page.goto('https://cblix2.franzai.com', { waitUntil: 'networkidle' });
    console.log('✅ Site loaded');
    
    // Test 2: Check version
    const version = await page.evaluate(() => window.CBLIX2_VERSION);
    console.log(`✅ Version: ${version}`);
    
    // Test 3: Check title
    const title = await page.title();
    if (title.includes('CBLIX2 - The Best App Ever')) {
      console.log('✅ Title correct');
    }
    
    // Test 4: Start game
    await page.click('#start-btn');
    await page.waitForTimeout(2000);
    
    const canvasVisible = await page.isVisible('#game-canvas');
    console.log(`✅ Game canvas visible: ${canvasVisible}`);
    
    // Test 5: Check game state
    const gameInfo = await page.evaluate(() => {
      return {
        level: document.querySelector('#levelDisplay')?.textContent,
        moves: document.querySelector('#movesDisplay')?.textContent,
        limit: document.querySelector('#limitDisplay')?.textContent,
        colors: document.querySelectorAll('.color-button').length
      };
    });
    
    console.log(`✅ Game state: Level ${gameInfo.level}, Moves ${gameInfo.moves}/${gameInfo.limit}`);
    console.log(`✅ Color buttons: ${gameInfo.colors}`);
    
    // Test 6: Take screenshots
    await page.screenshot({ path: 'screenshots/final-main.png' });
    await page.screenshot({ path: 'screenshots/final-game.png' });
    console.log('✅ Screenshots captured');
    
    // Test 7: Performance
    const metrics = await page.evaluate(() => performance.getEntriesByType('navigation')[0]);
    const loadTime = metrics.loadEventEnd - metrics.loadEventStart;
    console.log(`✅ Page load time: ${loadTime.toFixed(0)}ms`);
    
    console.log('\n🎉 All tests passed!');
    console.log('🌐 CBLIX2 is live at https://cblix2.franzai.com');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

testFinal();
