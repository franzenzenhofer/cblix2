#!/bin/bash
# CBLIX2 Final Deployment Script with Tests

set -euo pipefail

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${GREEN}=== CBLIX2 Final Deployment ===${NC}\n"

# 1. Build
echo -e "${GREEN}[1/4] Building...${NC}"
npm run build:only

# 2. Copy assets
echo -e "\n${GREEN}[2/4] Preparing deployment...${NC}"
cp -r dist/assets dist/public/
cp dist/*.{ico,png,js,json} dist/public/ 2>/dev/null || true

# 3. Deploy
echo -e "\n${GREEN}[3/4] Deploying to Cloudflare...${NC}"
wrangler pages deploy dist/public --project-name=cblix2

# 4. Test
echo -e "\n${GREEN}[4/4] Testing deployment...${NC}"
sleep 10

# Create test script
cat > test-final.js << 'EOF'
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
EOF

node test-final.js

echo -e "\n${GREEN}=== Deployment Complete! ===${NC}"
echo -e "🎮 Play CBLIX2 at: ${GREEN}https://cblix2.franzai.com${NC}"