import { chromium } from 'playwright';

async function testDebug() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  // Capture console messages
  page.on('console', msg => {
    console.log(`[CONSOLE ${msg.type()}]:`, msg.text());
  });
  
  page.on('pageerror', error => {
    console.error('[PAGE ERROR]:', error.message);
  });
  
  console.log('🔍 Debugging CBLIX2...\n');
  
  await page.goto('https://cblix2.franzai.com', { 
    waitUntil: 'networkidle',
    timeout: 60000 
  });
  
  console.log('✅ Page loaded');
  
  // Click Play Game
  await page.click('#start-btn');
  await page.waitForTimeout(2000);
  
  // Check game state
  const gameState = await page.evaluate(() => {
    // Try to access the game engine through the global scope
    const app = document.getElementById('app');
    return {
      hasCanvas: !!document.getElementById('game-canvas'),
      hasColorPalette: !!document.getElementById('colorPalette'),
      colorPaletteHTML: document.getElementById('colorPalette')?.innerHTML,
      colorButtonCount: document.querySelectorAll('.color-button').length
    };
  });
  
  console.log('\nGame State:', gameState);
  
  // Take detailed screenshot
  await page.screenshot({ path: 'debug-gameplay.png', fullPage: true });
  console.log('\nScreenshot saved to debug-gameplay.png');
  
  await page.waitForTimeout(5000);
  await browser.close();
}

testDebug();