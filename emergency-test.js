import { chromium } from 'playwright';

async function emergencyTest() {
  console.log('🚨 EMERGENCY TEST - Checking what\'s wrong\n');
  
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  // Capture console messages
  page.on('console', msg => {
    console.log(`[CONSOLE ${msg.type()}]: ${msg.text()}`);
  });
  
  page.on('pageerror', error => {
    console.error('[PAGE ERROR]:', error.message);
  });
  
  try {
    // Test deployed site
    console.log('Testing https://cblix2.franzai.com...');
    await page.goto('https://cblix2.franzai.com', { 
      waitUntil: 'domcontentloaded',
      timeout: 30000 
    });
    
    // Wait a bit
    await page.waitForTimeout(3000);
    
    // Check what's on the page
    const pageContent = await page.content();
    const hasApp = pageContent.includes('id="app"');
    const hasVersion = pageContent.includes('CBLIX2_VERSION');
    const bodyText = await page.locator('body').textContent();
    
    console.log('\n📊 Page Analysis:');
    console.log(`- Has app div: ${hasApp}`);
    console.log(`- Has version script: ${hasVersion}`);
    console.log(`- Body text length: ${bodyText.length}`);
    console.log(`- Body preview: ${bodyText.substring(0, 100)}...`);
    
    // Check if JavaScript executed
    const jsCheck = await page.evaluate(() => {
      return {
        hasWindow: typeof window !== 'undefined',
        hasVersion: typeof window.CBLIX2_VERSION !== 'undefined',
        version: window.CBLIX2_VERSION || 'not found',
        hasApp: !!document.getElementById('app'),
        appContent: document.getElementById('app')?.innerHTML || 'empty',
        errors: window.__errors || []
      };
    });
    
    console.log('\n🔍 JavaScript Check:');
    console.log(JSON.stringify(jsCheck, null, 2));
    
    // Check for specific elements
    const elements = {
      startBtn: await page.locator('#start-btn').count(),
      gameTitle: await page.locator('.game-title').count(),
      anyButton: await page.locator('button').count(),
      anyDiv: await page.locator('div').count()
    };
    
    console.log('\n🎯 Element Check:');
    console.log(JSON.stringify(elements, null, 2));
    
    // Take screenshot
    await page.screenshot({ path: 'emergency-check.png', fullPage: true });
    console.log('\n📸 Screenshot saved to emergency-check.png');
    
    // Try localhost too
    console.log('\n🏠 Testing localhost...');
    await page.goto('http://localhost:3000', { 
      waitUntil: 'domcontentloaded',
      timeout: 10000 
    }).catch(e => console.log('Localhost error:', e.message));
    
  } catch (error) {
    console.error('Test error:', error);
  } finally {
    await page.waitForTimeout(10000); // Keep browser open to inspect
    await browser.close();
  }
}

emergencyTest();