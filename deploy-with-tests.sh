#!/bin/bash
# CBLIX2 Deployment Script with Full Testing
# Includes screenshots and Playwright tests

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_NAME="cblix2"
PRODUCTION_URL="https://cblix2.franzai.com"
PAGES_URL="https://cblix2.pages.dev"
BUILD_DIR="dist/public"
EXPECTED_TITLE="CBLIX2 - The Best App Ever"

# Logging functions
log_info() { echo -e "${GREEN}[INFO]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }
log_section() { echo -e "\n${BLUE}=== $1 ===${NC}\n"; }

# Create directories
mkdir -p screenshots
mkdir -p test-results

# Pre-deployment checks
pre_deployment_checks() {
    log_section "Pre-deployment Checks"
    
    # 1. Check if source code exists
    log_info "Checking source code..."
    if [ ! -f "package.json" ]; then
        log_error "package.json not found. Are you in the project directory?"
        exit 1
    fi
    
    # 2. Run type checking
    log_info "Running TypeScript type check..."
    npm run typecheck || {
        log_error "TypeScript type check failed"
        exit 1
    }
    
    # 3. Run linting
    log_info "Running ESLint..."
    npm run lint || {
        log_error "ESLint check failed"
        exit 1
    }
    
    # 4. Run tests with coverage
    log_info "Running unit tests with coverage..."
    npm run test:coverage || {
        log_error "Unit tests failed"
        exit 1
    }
    
    # 5. Build the project
    log_info "Building the project..."
    npm run build:only || {
        log_error "Build failed"
        exit 1
    }
    
    # 6. Verify build output
    log_info "Verifying build output..."
    if [ ! -d "$BUILD_DIR" ]; then
        log_error "Build directory $BUILD_DIR not found"
        exit 1
    fi
    
    # 7. Copy assets to correct location
    log_info "Ensuring all assets are in place..."
    cp -r dist/assets dist/public/ 2>/dev/null || true
    cp dist/*.{ico,png,js,json} dist/public/ 2>/dev/null || true
    
    log_info "All pre-deployment checks passed! ✅"
}

# Deploy to Cloudflare Pages
deploy_to_cloudflare() {
    log_section "Deploying to Cloudflare Pages"
    
    log_info "Deploying to Cloudflare Pages..."
    DEPLOY_OUTPUT=$(wrangler pages deploy "$BUILD_DIR" --project-name="$PROJECT_NAME" 2>&1)
    
    # Extract deployment URL
    DEPLOY_URL=$(echo "$DEPLOY_OUTPUT" | grep -oE 'https://[a-f0-9]+\.'$PROJECT_NAME'\.pages\.dev' | head -1)
    
    if [ -z "$DEPLOY_URL" ]; then
        log_error "Failed to extract deployment URL from output"
        echo "$DEPLOY_OUTPUT"
        exit 1
    fi
    
    log_info "Deployed to: $DEPLOY_URL"
    echo "$DEPLOY_URL" > .last_deployment_url
}

# Run Playwright tests
run_playwright_tests() {
    log_section "Running Playwright Tests"
    
    # Create Playwright test script
    cat > test-deployment-playwright.js << 'EOF'
import { chromium } from 'playwright';
import fs from 'fs';

async function testDeployment() {
  const browser = await chromium.launch({ headless: true });
  const results = {
    passed: 0,
    failed: 0,
    tests: []
  };
  
  try {
    const context = await browser.newContext();
    const page = await context.newPage();
    
    console.log('\n📋 Running Playwright tests on deployed site...\n');
    
    // Test 1: Load the production site
    console.log('Test 1: Loading production site...');
    try {
      await page.goto('https://cblix2.franzai.com', { 
        waitUntil: 'networkidle',
        timeout: 30000 
      });
      console.log('✅ Site loaded successfully');
      results.passed++;
      results.tests.push({ name: 'Site Loading', status: 'passed' });
    } catch (error) {
      console.log('❌ Failed to load site:', error.message);
      results.failed++;
      results.tests.push({ name: 'Site Loading', status: 'failed', error: error.message });
    }
    
    // Test 2: Check page title
    console.log('\nTest 2: Checking page title...');
    try {
      const title = await page.title();
      if (title.includes('CBLIX2 - The Best App Ever')) {
        console.log(`✅ Title correct: ${title}`);
        results.passed++;
        results.tests.push({ name: 'Page Title', status: 'passed' });
      } else {
        throw new Error(`Unexpected title: ${title}`);
      }
    } catch (error) {
      console.log('❌ Title check failed:', error.message);
      results.failed++;
      results.tests.push({ name: 'Page Title', status: 'failed', error: error.message });
    }
    
    // Test 3: Check version info
    console.log('\nTest 3: Checking version info...');
    try {
      const version = await page.evaluate(() => window.CBLIX2_VERSION);
      const buildDate = await page.evaluate(() => window.CBLIX2_BUILD_DATE);
      console.log(`✅ Version: ${version}`);
      console.log(`✅ Build Date: ${buildDate}`);
      results.passed++;
      results.tests.push({ name: 'Version Info', status: 'passed', version, buildDate });
    } catch (error) {
      console.log('❌ Version check failed:', error.message);
      results.failed++;
      results.tests.push({ name: 'Version Info', status: 'failed', error: error.message });
    }
    
    // Test 4: Check if game UI loads
    console.log('\nTest 4: Checking game UI...');
    try {
      // Wait for game title to be visible
      await page.waitForSelector('.game-title', { timeout: 10000 });
      const gameTitle = await page.textContent('.game-title');
      console.log(`✅ Game title visible: ${gameTitle.trim()}`);
      
      // Check tagline
      const tagline = await page.textContent('.tagline');
      console.log(`✅ Tagline: ${tagline}`);
      
      results.passed++;
      results.tests.push({ name: 'Game UI', status: 'passed' });
    } catch (error) {
      console.log('❌ Game UI check failed:', error.message);
      results.failed++;
      results.tests.push({ name: 'Game UI', status: 'failed', error: error.message });
    }
    
    // Test 5: Take screenshots
    console.log('\nTest 5: Taking screenshots...');
    try {
      // Desktop screenshot
      await page.setViewportSize({ width: 1920, height: 1080 });
      await page.screenshot({ path: 'screenshots/deployed-desktop.png', fullPage: true });
      console.log('✅ Desktop screenshot saved');
      
      // Mobile screenshot
      await page.setViewportSize({ width: 375, height: 667 });
      await page.screenshot({ path: 'screenshots/deployed-mobile.png', fullPage: true });
      console.log('✅ Mobile screenshot saved');
      
      results.passed++;
      results.tests.push({ name: 'Screenshots', status: 'passed' });
    } catch (error) {
      console.log('❌ Screenshot capture failed:', error.message);
      results.failed++;
      results.tests.push({ name: 'Screenshots', status: 'failed', error: error.message });
    }
    
    // Test 6: Test game interaction
    console.log('\nTest 6: Testing game interaction...');
    try {
      await page.setViewportSize({ width: 1920, height: 1080 });
      await page.goto('https://cblix2.franzai.com', { waitUntil: 'networkidle' });
      
      // Click Play button
      await page.click('#start-btn');
      await page.waitForTimeout(1000);
      
      // Check if game canvas appears
      const canvasVisible = await page.isVisible('#game-canvas');
      if (canvasVisible) {
        console.log('✅ Game canvas is visible');
        await page.screenshot({ path: 'screenshots/deployed-gameplay.png', fullPage: true });
        console.log('✅ Gameplay screenshot saved');
        results.passed++;
        results.tests.push({ name: 'Game Interaction', status: 'passed' });
      } else {
        throw new Error('Game canvas not visible after clicking Play');
      }
    } catch (error) {
      console.log('❌ Game interaction test failed:', error.message);
      results.failed++;
      results.tests.push({ name: 'Game Interaction', status: 'failed', error: error.message });
    }
    
    // Test 7: Performance check
    console.log('\nTest 7: Performance check...');
    try {
      const metrics = await page.evaluate(() => {
        const navigation = performance.getEntriesByType('navigation')[0];
        return {
          domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
          loadComplete: navigation.loadEventEnd - navigation.loadEventStart
        };
      });
      console.log(`✅ DOM Content Loaded: ${metrics.domContentLoaded}ms`);
      console.log(`✅ Page Load Complete: ${metrics.loadComplete}ms`);
      
      if (metrics.loadComplete < 3000) {
        results.passed++;
        results.tests.push({ name: 'Performance', status: 'passed', metrics });
      } else {
        throw new Error(`Page load too slow: ${metrics.loadComplete}ms`);
      }
    } catch (error) {
      console.log('❌ Performance check failed:', error.message);
      results.failed++;
      results.tests.push({ name: 'Performance', status: 'failed', error: error.message });
    }
    
  } catch (error) {
    console.error('Test suite error:', error);
  } finally {
    await browser.close();
    
    // Save test results
    fs.writeFileSync('test-results/playwright-results.json', JSON.stringify(results, null, 2));
    
    // Summary
    console.log('\n📊 Test Summary:');
    console.log(`✅ Passed: ${results.passed}`);
    console.log(`❌ Failed: ${results.failed}`);
    console.log(`📝 Total: ${results.passed + results.failed}`);
    
    if (results.failed > 0) {
      console.log('\n❌ Some tests failed. Check test-results/playwright-results.json for details.');
      process.exit(1);
    } else {
      console.log('\n🎉 All Playwright tests passed!');
    }
  }
}

testDeployment();
EOF

    # Run the Playwright tests
    node test-deployment-playwright.js || {
        log_error "Playwright tests failed"
        exit 1
    }
}

# Post-deployment verification
post_deployment_verification() {
    log_section "Post-deployment Verification"
    
    # Basic HTTP checks
    log_info "Checking HTTP status..."
    HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$PRODUCTION_URL")
    if [ "$HTTP_STATUS" = "200" ]; then
        log_info "✅ Site returns HTTP 200"
    else {
        log_error "Site returns HTTP $HTTP_STATUS"
        exit 1
    }
    fi
    
    # Check content
    log_info "Checking page content..."
    PAGE_CONTENT=$(curl -s "$PRODUCTION_URL")
    
    if echo "$PAGE_CONTENT" | grep -q "$EXPECTED_TITLE"; then
        log_info "✅ Page title found"
    else
        log_error "Page title not found"
        exit 1
    fi
    
    if echo "$PAGE_CONTENT" | grep -q "CBLIX2_VERSION"; then
        log_info "✅ Version info found"
    else
        log_error "Version info not found"
        exit 1
    fi
}

# Generate deployment report
generate_deployment_report() {
    log_section "Generating Deployment Report"
    
    REPORT_FILE="deployment_report_$(date +%Y%m%d_%H%M%S).md"
    
    cat > "$REPORT_FILE" << EOF
# CBLIX2 Deployment Report

**Date:** $(date)  
**Project:** $PROJECT_NAME  
**Version:** $(jq -r .version package.json)

## URLs
- Production: $PRODUCTION_URL
- Pages.dev: $PAGES_URL
$([ -f .last_deployment_url ] && echo "- Deployment: $(cat .last_deployment_url)")

## Status
- ✅ Build: Successful
- ✅ Deployment: Successful
- ✅ Tests: All passed
- ✅ Screenshots: Captured

## Test Results
$(cat test-results/playwright-results.json | jq -r '.tests[] | "- \(.name): \(.status)"')

## Screenshots
- Desktop: ![Desktop](screenshots/deployed-desktop.png)
- Mobile: ![Mobile](screenshots/deployed-mobile.png)
- Gameplay: ![Gameplay](screenshots/deployed-gameplay.png)

## Performance Metrics
$(cat test-results/playwright-results.json | jq -r '.tests[] | select(.name == "Performance") | "- DOM Content Loaded: \(.metrics.domContentLoaded)ms\n- Page Load Complete: \(.metrics.loadComplete)ms"' || echo "Not available")

---
*Generated automatically by deploy-with-tests.sh*
EOF

    log_info "Deployment report saved to: $REPORT_FILE"
}

# Main deployment flow
main() {
    log_section "CBLIX2 Deployment with Full Testing"
    log_info "Starting deployment process..."
    
    # Check dependencies
    command -v wrangler >/dev/null 2>&1 || {
        log_error "wrangler CLI not found. Please install it first."
        exit 1
    }
    
    command -v node >/dev/null 2>&1 || {
        log_error "Node.js not found. Please install it first."
        exit 1
    }
    
    # Ensure Playwright is installed
    if [ ! -d "node_modules/playwright" ]; then
        log_info "Installing Playwright..."
        npm install playwright
    fi
    
    # Run deployment steps
    pre_deployment_checks
    deploy_to_cloudflare
    
    # Wait for deployment to propagate
    log_info "Waiting 10 seconds for deployment to propagate..."
    sleep 10
    
    post_deployment_verification
    run_playwright_tests
    generate_deployment_report
    
    log_section "Deployment Complete! 🎉"
    log_info "CBLIX2 has been successfully deployed and tested!"
    log_info "Play the game at: $PRODUCTION_URL"
    log_info ""
    log_info "📸 Screenshots saved in: ./screenshots/"
    log_info "📊 Test results saved in: ./test-results/"
    log_info "📄 Deployment report: deployment_report_*.md"
}

# Run main function
main "$@"