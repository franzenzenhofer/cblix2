import { chromium } from 'playwright';

async function checkButtons() {
  console.log('🔍 Checking cblix2.franzai.com for missing buttons...\n');
  
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  try {
    await page.goto('https://cblix2.franzai.com', { waitUntil: 'networkidle' });
    
    // Check for buttons
    const buttons = await page.evaluate(() => {
      return {
        startBtn: document.querySelector('#start-btn') ? 'EXISTS' : 'MISSING',
        tutorialBtn: document.querySelector('#tutorial-btn') ? 'EXISTS' : 'MISSING', 
        settingsBtn: document.querySelector('#settings-btn') ? 'EXISTS' : 'MISSING',
        allButtons: document.querySelectorAll('button').length,
        buttonTexts: Array.from(document.querySelectorAll('button')).map(b => b.textContent.trim())
      };
    });
    
    console.log('Button Status:', JSON.stringify(buttons, null, 2));
    
    // Check CSS loading
    const styles = await page.evaluate(() => {
      const startBtn = document.querySelector('#start-btn');
      if (!startBtn) return { status: 'NO_BUTTON' };
      const computed = window.getComputedStyle(startBtn);
      return {
        display: computed.display,
        visibility: computed.visibility,
        backgroundColor: computed.backgroundColor,
        color: computed.color,
        width: computed.width,
        height: computed.height
      };
    });
    
    console.log('\nButton Styles:', JSON.stringify(styles, null, 2));
    
    // Check CSS files
    const cssFiles = await page.evaluate(() => {
      const links = Array.from(document.querySelectorAll('link[rel="stylesheet"]'));
      return links.map(link => ({
        href: link.href,
        loaded: link.sheet !== null
      }));
    });
    
    console.log('\nCSS Files:', JSON.stringify(cssFiles, null, 2));
    
    // Take screenshot
    await page.screenshot({ path: 'button-check.png' });
    console.log('\n📸 Screenshot saved to button-check.png');
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await browser.close();
  }
}

checkButtons();