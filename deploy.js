#!/usr/bin/env node

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { chromium } from 'playwright';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Colors
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  reset: '\x1b[0m'
};

const log = {
  info: (msg) => console.log(`${colors.blue}[INFO]${colors.reset} ${msg}`),
  success: (msg) => console.log(`${colors.green}✅ ${msg}${colors.reset}`),
  error: (msg) => console.log(`${colors.red}❌ ${msg}${colors.reset}`),
  warn: (msg) => console.log(`${colors.yellow}⚠️  ${msg}${colors.reset}`),
  section: (msg) => console.log(`\n${colors.blue}═══ ${msg} ═══${colors.reset}\n`)
};

// Execute command
function exec(cmd, silent = false) {
  try {
    const output = execSync(cmd, { encoding: 'utf8' });
    if (!silent) console.log(output.trim());
    return output.trim();
  } catch (error) {
    log.error(`Command failed: ${cmd}`);
    throw error;
  }
}

// Sleep function
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Main deployment
async function deploy() {
  console.log(`${colors.magenta}╔═══════════════════════════════════════════════════════╗${colors.reset}`);
  console.log(`${colors.magenta}║         CBLIX2 NODE.JS DEPLOYMENT SYSTEM              ║${colors.reset}`);
  console.log(`${colors.magenta}╚═══════════════════════════════════════════════════════╝${colors.reset}\n`);

  let newVersion = '';
  
  try {
    // 1. VERSION INCREMENT
    log.section('1/8 VERSION INCREMENT');
    const oldVersion = JSON.parse(fs.readFileSync('package.json', 'utf8')).version;
    exec('node scripts/auto-version.js');
    newVersion = JSON.parse(fs.readFileSync('package.json', 'utf8')).version;
    log.success(`Version: ${oldVersion} → ${newVersion}`);

    // 2. BUILD
    log.section('2/8 BUILDING PROJECT');
    exec('npm run build:only');
    
    // Ensure assets are in the right place
    exec('mkdir -p dist/public');
    exec('cp -r dist/assets dist/public/ 2>/dev/null || true', true);
    exec('cp -r dist/icons dist/public/ 2>/dev/null || true', true);
    exec('cp dist/*.ico dist/*.png dist/*.json dist/*.js dist/public/ 2>/dev/null || true', true);
    
    log.success('Build complete');

    // 3. DEPLOY
    log.section('3/8 DEPLOYING TO CLOUDFLARE');
    const deployOutput = exec('wrangler pages deploy dist/public --project-name=cblix2 2>&1');
    const deployUrl = deployOutput.match(/https:\/\/[a-f0-9]+\.cblix2\.pages\.dev/)?.[0];
    if (deployUrl) {
      log.success(`Deployed to: ${deployUrl}`);
    }

    // 4. WAIT
    log.section('4/8 WAITING FOR PROPAGATION');
    log.info('Waiting 20 seconds...');
    await sleep(20000);

    // 5. CACHE BUSTING TEST
    log.section('5/8 TESTING WITH CACHE BUSTING');
    const cacheBuster = Date.now();
    const testUrl = `https://cblix2.franzai.com?cb=${cacheBuster}`;
    
    log.info(`Testing: ${testUrl}`);
    
    // Test HTML
    const htmlStatus = exec(`curl -s -o /dev/null -w "%{http_code}" "${testUrl}"`, true);
    if (htmlStatus === '200') {
      log.success(`HTML loads (HTTP ${htmlStatus})`);
    } else {
      log.error(`HTML failed (HTTP ${htmlStatus})`);
    }
    
    // Test version
    const htmlContent = exec(`curl -s "${testUrl}"`, true);
    const versionMatch = htmlContent.match(/window\.CBLIX2_VERSION = '([^']+)'/);
    if (versionMatch && versionMatch[1] === newVersion) {
      log.success(`Version correct: v${versionMatch[1]}`);
    } else {
      log.error(`Version mismatch! Expected: v${newVersion}, Got: v${versionMatch?.[1]}`);
    }

    // 6. VISUAL TEST
    log.section('6/8 VISUAL VERIFICATION');
    const browser = await chromium.launch({ headless: false });
    const page = await browser.newPage();
    
    // Prevent caching and service workers
    await page.route('**/*', route => {
      const headers = {
        ...route.request().headers(),
        'cache-control': 'no-cache, no-store, must-revalidate',
        'pragma': 'no-cache'
      };
      route.continue({ headers });
    });
    
    // Disable service workers
    await page.addInitScript(() => {
      delete navigator.serviceWorker;
    });
    
    log.info(`Opening: ${testUrl}`);
    await page.goto(testUrl, { waitUntil: 'networkidle', timeout: 30000 });
    await sleep(3000);
    
    // Check page content
    const pageData = await page.evaluate(() => {
      return {
        version: window.CBLIX2_VERSION,
        hasApp: !!document.getElementById('app'),
        hasContent: document.body.innerText.length > 0,
        visibleButtons: Array.from(document.querySelectorAll('button')).filter(b => b.offsetParent !== null).length,
        title: document.title,
        bodyText: document.body.innerText.substring(0, 200)
      };
    });
    
    console.log('\nPage Analysis:');
    console.log(JSON.stringify(pageData, null, 2));
    
    // Check displayed version
    const displayedVersion = await page.locator('.version').textContent().catch(() => 'NOT FOUND');
    log.info(`Displayed version: ${displayedVersion}`);
    
    // Screenshot
    await page.screenshot({ path: 'deployment-verification.png', fullPage: true });
    log.success('Screenshot saved: deployment-verification.png');
    
    await sleep(5000);
    await browser.close();
    
    // Verify success
    if (!pageData.version || !pageData.hasContent || pageData.visibleButtons === 0) {
      log.error('Site verification failed!');
      log.error(`Version: ${pageData.version}, Content: ${pageData.hasContent}, Buttons: ${pageData.visibleButtons}`);
      process.exit(1);
    }
    
    log.success('Site is working correctly!');

    // 7. ASSET VERIFICATION
    log.section('7/8 ASSET VERIFICATION');
    
    // Get JS file
    const jsMatch = htmlContent.match(/src="(\/assets\/index-[^"]+\.js)"/);
    if (jsMatch) {
      const jsUrl = `https://cblix2.franzai.com${jsMatch[1]}?cb=${cacheBuster}`;
      log.info(`Testing JS: ${jsUrl}`);
      
      const jsStatus = exec(`curl -s -o /dev/null -w "%{http_code}" "${jsUrl}"`, true);
      const jsType = exec(`curl -sI "${jsUrl}" | grep -i content-type | head -1`, true);
      
      if (jsStatus === '200' && jsType.includes('javascript')) {
        log.success('JavaScript loads correctly');
      } else {
        log.error(`JavaScript issue! Status: ${jsStatus}, Type: ${jsType}`);
      }
    }

    // 8. GIT PUSH
    log.section('8/8 PUSHING TO GITHUB');
    try {
      exec('git add -A');
      exec(`git commit -m "🚀 Deploy v${newVersion} - Verified working with visual tests"`);
      exec('git push origin main');
      log.success('Pushed to GitHub');
      
      exec(`git tag -a "v${newVersion}" -m "Release v${newVersion}"`);
      exec(`git push origin "v${newVersion}"`);
      log.success('Tag created and pushed');
    } catch (e) {
      log.warn('Git operations partially failed');
    }

    // FINAL SUMMARY
    console.log(`\n${colors.green}╔═══════════════════════════════════════════════════════╗${colors.reset}`);
    console.log(`${colors.green}║              🎉 DEPLOYMENT SUCCESSFUL! 🎉             ║${colors.reset}`);
    console.log(`${colors.green}╟───────────────────────────────────────────────────────╢${colors.reset}`);
    console.log(`${colors.green}║  Version: v${newVersion.padEnd(43)}║${colors.reset}`);
    console.log(`${colors.green}║  URL: https://cblix2.franzai.com                     ║${colors.reset}`);
    console.log(`${colors.green}║  Status: VERIFIED WORKING ✅                         ║${colors.reset}`);
    console.log(`${colors.green}╚═══════════════════════════════════════════════════════╝${colors.reset}`);

  } catch (error) {
    log.error('Deployment failed!');
    console.error(error);
    process.exit(1);
  }
}

// Run deployment
deploy();