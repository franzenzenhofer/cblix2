import { chromium } from 'playwright';

async function checkLiveVersion() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  console.log('🔍 Checking ACTUAL version displayed on cblix2.franzai.com...\n');
  
  await page.goto('https://cblix2.franzai.com', { waitUntil: 'networkidle' });
  
  // Wait for page to fully load
  await page.waitForTimeout(3000);
  
  // Get version from multiple sources
  const versionData = await page.evaluate(() => {
    return {
      windowVersion: window.CBLIX2_VERSION,
      displayedVersion: document.querySelector('.version')?.textContent || 'NOT FOUND',
      versionElementExists: !!document.querySelector('.version'),
      allTextWithVersion: Array.from(document.querySelectorAll('*')).filter(el => 
        el.textContent.includes('Version') || el.textContent.includes('2.0')
      ).map(el => el.textContent.trim()).filter(t => t.length < 50)
    };
  });
  
  console.log('Window version (JavaScript):', versionData.windowVersion);
  console.log('Displayed version (visible to user):', versionData.displayedVersion);
  console.log('Version element exists:', versionData.versionElementExists);
  console.log('\nAll version-related text found:');
  versionData.allTextWithVersion.forEach(text => console.log('  -', text));
  
  // Take screenshot
  await page.screenshot({ path: 'live-version-check.png', fullPage: true });
  console.log('\n📸 Screenshot saved to live-version-check.png');
  
  await page.waitForTimeout(5000);
  await browser.close();
}

checkLiveVersion();