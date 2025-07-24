import { chromium } from 'playwright';

async function testLive() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  console.log('Testing https://cblix2.franzai.com...');
  
  await page.goto('https://cblix2.franzai.com', { 
    waitUntil: 'networkidle',
    timeout: 60000 
  });
  
  await page.waitForTimeout(2000);
  
  // Take screenshot
  await page.screenshot({ path: 'live-test.png', fullPage: true });
  console.log('Screenshot saved to live-test.png');
  
  // Check what's on the page
  const title = await page.title();
  console.log('Page title:', title);
  
  const pageContent = await page.content();
  if (pageContent.includes('CBLIX2')) {
    console.log('✅ CBLIX2 content found');
  } else {
    console.log('❌ CBLIX2 content NOT found');
  }
  
  // Check for game elements
  try {
    const gameTitle = await page.locator('.game-title').textContent({ timeout: 5000 });
    console.log('Game title found:', gameTitle);
  } catch (e) {
    console.log('Game title not found');
  }
  
  // Check if it's a login screen
  if (pageContent.includes('Unlock') || pageContent.includes('Password')) {
    console.log('⚠️  Login screen detected');
  }
  
  await browser.close();
}

testLive();