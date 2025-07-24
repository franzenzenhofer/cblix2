import { chromium, devices } from 'playwright';

async function fullE2ETest() {
  console.log('🔍 COMPREHENSIVE E2E TEST FOR CBLIX2\n');
  console.log('=' .repeat(50) + '\n');
  
  const issues = [];
  let testsPassed = 0;
  let testsFailed = 0;
  
  // Test on desktop
  console.log('📱 DESKTOP TESTS:');
  const desktopBrowser = await chromium.launch({ headless: false });
  const desktopContext = await desktopBrowser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  const desktop = await desktopContext.newPage();
  
  // Capture console errors
  desktop.on('console', msg => {
    if (msg.type() === 'error') {
      issues.push(`Console Error: ${msg.text()}`);
    }
  });
  
  try {
    // 1. Load test
    await desktop.goto('https://cblix2.franzai.com', { waitUntil: 'networkidle' });
    console.log('✅ Site loads');
    testsPassed++;
    
    // 2. Check viewport
    const needsScroll = await desktop.evaluate(() => {
      return document.body.scrollHeight > window.innerHeight;
    });
    if (needsScroll) {
      console.log('❌ Page requires scrolling on desktop!');
      issues.push('Desktop: Page requires vertical scrolling');
      testsFailed++;
    } else {
      console.log('✅ No scrolling needed on desktop');
      testsPassed++;
    }
    
    // 3. Start game
    await desktop.click('#start-btn');
    await desktop.waitForTimeout(2000);
    
    // 4. Check color buttons
    const colorCount = await desktop.locator('.color-button').count();
    if (colorCount === 0) {
      console.log('❌ No color buttons visible!');
      issues.push('Game: Color buttons not rendering');
      testsFailed++;
    } else {
      console.log(`✅ ${colorCount} color buttons visible`);
      testsPassed++;
    }
    
    // 5. Try to make moves
    if (colorCount > 0) {
      const initialMoves = await desktop.locator('#movesDisplay').textContent();
      await desktop.locator('.color-button').nth(1).click();
      await desktop.waitForTimeout(500);
      const newMoves = await desktop.locator('#movesDisplay').textContent();
      
      if (initialMoves === newMoves) {
        console.log('❌ Moves not incrementing!');
        issues.push('Game: Move counter not working');
        testsFailed++;
      } else {
        console.log('✅ Move counter working');
        testsPassed++;
      }
    }
    
    // 6. Check tutorial
    await desktop.click('#back-btn');
    await desktop.waitForTimeout(1000);
    await desktop.click('#tutorial-btn');
    await desktop.waitForTimeout(1000);
    
    const tutorialVisible = await desktop.locator('.tutorial-screen').isVisible().catch(() => false);
    if (!tutorialVisible) {
      console.log('❌ Tutorial not implemented!');
      issues.push('Feature: Tutorial missing');
      testsFailed++;
    } else {
      console.log('✅ Tutorial works');
      testsPassed++;
    }
    
    await desktop.screenshot({ path: 'screenshots/desktop-issues.png', fullPage: true });
    
  } catch (error) {
    console.error('Desktop test error:', error);
    issues.push(`Desktop test crashed: ${error.message}`);
  }
  
  await desktopBrowser.close();
  
  // Test on mobile
  console.log('\n📱 MOBILE TESTS:');
  const mobileBrowser = await chromium.launch({ headless: false });
  const mobileContext = await mobileBrowser.newContext({
    ...devices['iPhone 12'],
    viewport: { width: 390, height: 844 }
  });
  const mobile = await mobileContext.newPage();
  
  try {
    await mobile.goto('https://cblix2.franzai.com', { waitUntil: 'networkidle' });
    console.log('✅ Mobile site loads');
    testsPassed++;
    
    // Check mobile viewport
    const mobileNeedsScroll = await mobile.evaluate(() => {
      return document.body.scrollHeight > window.innerHeight;
    });
    if (mobileNeedsScroll) {
      console.log('❌ Page requires scrolling on mobile!');
      issues.push('Mobile: Page requires vertical scrolling');
      testsFailed++;
    } else {
      console.log('✅ No scrolling needed on mobile');
      testsPassed++;
    }
    
    // Check if it feels like an app
    const hasViewportMeta = await mobile.evaluate(() => {
      const meta = document.querySelector('meta[name="viewport"]');
      return meta && meta.content.includes('user-scalable=no');
    });
    if (!hasViewportMeta) {
      console.log('❌ Not preventing zoom (not app-like)');
      issues.push('Mobile: Allows pinch-zoom (not app-like)');
      testsFailed++;
    } else {
      console.log('✅ Prevents zoom (app-like)');
      testsPassed++;
    }
    
    // Check touch responsiveness
    await mobile.tap('#start-btn');
    await mobile.waitForTimeout(2000);
    
    // Check game scaling on mobile
    const canvasSize = await mobile.evaluate(() => {
      const canvas = document.querySelector('#game-canvas');
      return canvas ? {
        width: canvas.offsetWidth,
        height: canvas.offsetHeight,
        viewportWidth: window.innerWidth,
        viewportHeight: window.innerHeight
      } : null;
    });
    
    if (canvasSize && canvasSize.width > canvasSize.viewportWidth) {
      console.log('❌ Game canvas wider than viewport!');
      issues.push('Mobile: Canvas exceeds viewport width');
      testsFailed++;
    } else {
      console.log('✅ Game fits viewport width');
      testsPassed++;
    }
    
    await mobile.screenshot({ path: 'screenshots/mobile-issues.png', fullPage: true });
    
  } catch (error) {
    console.error('Mobile test error:', error);
    issues.push(`Mobile test crashed: ${error.message}`);
  }
  
  await mobileBrowser.close();
  
  // Test level progression
  console.log('\n🎮 LEVEL PROGRESSION TEST:');
  const progressBrowser = await chromium.launch({ headless: true });
  const progressPage = await progressBrowser.newPage();
  
  try {
    await progressPage.goto('https://cblix2.franzai.com', { waitUntil: 'networkidle' });
    await progressPage.click('#start-btn');
    await progressPage.waitForTimeout(2000);
    
    // Try to win level 1 by filling the board
    // This is a hack - in real game we need proper moves
    const wonLevel1 = await progressPage.evaluate(() => {
      // Try to trigger win condition
      const gameEngine = window.gameEngine;
      if (gameEngine) {
        // Simulate winning
        const state = gameEngine.getGameState();
        if (state) {
          state.gameOver = true;
          state.won = true;
          return true;
        }
      }
      return false;
    });
    
    if (!wonLevel1) {
      console.log('❌ Cannot test level progression - game engine not accessible');
      issues.push('Testing: Cannot access game engine for progression test');
      testsFailed++;
    }
    
  } catch (error) {
    console.error('Progression test error:', error);
  }
  
  await progressBrowser.close();
  
  // Summary
  console.log('\n' + '=' .repeat(50));
  console.log('📊 TEST SUMMARY:');
  console.log(`✅ Passed: ${testsPassed}`);
  console.log(`❌ Failed: ${testsFailed}`);
  console.log(`\n🐛 ISSUES FOUND (${issues.length}):`);
  issues.forEach((issue, i) => {
    console.log(`${i + 1}. ${issue}`);
  });
  
  // Save issues to file
  const fs = await import('fs');
  fs.writeFileSync('test-results/e2e-issues.json', JSON.stringify({
    timestamp: new Date().toISOString(),
    passed: testsPassed,
    failed: testsFailed,
    issues: issues
  }, null, 2));
  
  console.log('\n💾 Full report saved to test-results/e2e-issues.json');
}

fullE2ETest();