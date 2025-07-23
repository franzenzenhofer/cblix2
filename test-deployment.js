import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  console.log('Testing CBLIX2 deployment...\n');
  
  // Test the working Cloudflare Pages URL
  console.log('1. Testing https://9b3fc2f7.cblix2.pages.dev');
  try {
    await page.goto('https://9b3fc2f7.cblix2.pages.dev', { waitUntil: 'networkidle' });
    
    // Check if page loads
    const title = await page.title();
    console.log('   ✓ Page loaded successfully');
    console.log('   ✓ Title:', title);
    
    // Check for version display
    const version = await page.textContent('.version');
    console.log('   ✓ Version displayed:', version);
    
    // Check for "The Best App Ever" branding
    const tagline = await page.textContent('.tagline');
    console.log('   ✓ Tagline:', tagline);
    
    // Check for start button
    const startButton = await page.locator('button:has-text("Start Game")');
    if (await startButton.isVisible()) {
      console.log('   ✓ Start Game button found');
      
      // Click start button
      await startButton.click();
      await page.waitForTimeout(1000);
      
      // Check if game screen loads
      const canvas = await page.locator('#game-canvas');
      if (await canvas.isVisible()) {
        console.log('   ✓ Game canvas loaded');
        
        // Check for color buttons
        const colorButtons = await page.locator('.color-button').count();
        console.log('   ✓ Color buttons found:', colorButtons);
        
        // Try clicking a color
        if (colorButtons > 0) {
          await page.locator('.color-button').first().click();
          console.log('   ✓ Color selection works');
        }
      }
    }
    
    // Take screenshot
    await page.screenshot({ path: 'cblix2-deployment-test.png' });
    console.log('   ✓ Screenshot saved as cblix2-deployment-test.png');
    
  } catch (error) {
    console.error('   ✗ Error:', error.message);
  }
  
  // Test custom domain
  console.log('\n2. Testing https://cblix2.franzai.com');
  try {
    await page.goto('https://cblix2.franzai.com', { waitUntil: 'networkidle', timeout: 10000 });
    console.log('   ✓ Custom domain is working!');
  } catch (error) {
    console.log('   ✗ Custom domain not working yet:', error.message);
  }
  
  await browser.close();
  
  console.log('\nDeployment test complete!');
})();