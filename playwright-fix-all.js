import { chromium } from 'playwright';

async function debugAndFix() {
  console.log('🔧 DEBUGGING AND FIXING CBLIX2\n');
  
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  // Monitor console
  page.on('console', msg => {
    console.log(`[CONSOLE]: ${msg.text()}`);
  });
  
  page.on('pageerror', error => {
    console.error('[ERROR]:', error);
  });
  
  // Test locally first
  console.log('📍 Testing local development server...');
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);
  
  // Check if game loads
  const hasStartButton = await page.locator('#start-btn').isVisible();
  console.log(`Start button visible: ${hasStartButton}`);
  
  if (hasStartButton) {
    await page.click('#start-btn');
    await page.waitForTimeout(2000);
    
    // Debug game state
    const gameDebug = await page.evaluate(() => {
      // Access game through window or app
      const app = document.getElementById('app');
      const gameState = window.__gameState || null;
      const gameEngine = window.__gameEngine || null;
      
      // Check DOM elements
      const canvas = document.getElementById('game-canvas');
      const colorPalette = document.getElementById('colorPalette');
      const colorButtons = document.querySelectorAll('.color-button');
      
      return {
        hasGameState: !!gameState,
        hasGameEngine: !!gameEngine,
        hasCanvas: !!canvas,
        canvasSize: canvas ? { width: canvas.width, height: canvas.height } : null,
        hasColorPalette: !!colorPalette,
        colorPaletteHTML: colorPalette?.innerHTML || '',
        colorButtonCount: colorButtons.length,
        viewportHeight: window.innerHeight,
        documentHeight: document.body.scrollHeight,
        needsScroll: document.body.scrollHeight > window.innerHeight
      };
    });
    
    console.log('\n📊 Game Debug Info:');
    console.log(JSON.stringify(gameDebug, null, 2));
    
    // Take screenshot
    await page.screenshot({ path: 'debug-local-game.png', fullPage: true });
    
    // Check mobile view
    console.log('\n📱 Testing mobile view...');
    await page.setViewportSize({ width: 390, height: 844 });
    await page.waitForTimeout(1000);
    
    const mobileDebug = await page.evaluate(() => {
      return {
        viewportHeight: window.innerHeight,
        documentHeight: document.body.scrollHeight,
        needsScroll: document.body.scrollHeight > window.innerHeight,
        canvasVisible: !!document.getElementById('game-canvas'),
        colorButtons: document.querySelectorAll('.color-button').length
      };
    });
    
    console.log('\n📱 Mobile Debug Info:');
    console.log(JSON.stringify(mobileDebug, null, 2));
    
    await page.screenshot({ path: 'debug-mobile-game.png', fullPage: true });
  }
  
  await browser.close();
  
  console.log('\n✅ Debug complete. Check screenshots and logs.');
}

debugAndFix();