#!/bin/bash
# CBLIX2 Deployment Script with FULL Pre and Post Tests
# Ensures EVERYTHING works before and after deployment

set -euo pipefail

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
PROJECT_NAME="cblix2"
PRODUCTION_URL="https://cblix2.franzai.com"
PAGES_URL="https://cblix2.pages.dev"
BUILD_DIR="dist/public"
LOCAL_URL="http://localhost:3000"

# Logging
log_info() { echo -e "${GREEN}[INFO]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_section() { echo -e "\n${BLUE}=== $1 ===${NC}\n"; }

# Ensure directories exist
mkdir -p test-results
mkdir -p screenshots

# Pre-deployment tests with Playwright
pre_deployment_tests() {
    log_section "PRE-DEPLOYMENT TESTS"
    
    # Create Playwright test
    cat > pre-deployment-test.js << 'EOF'
import { chromium } from 'playwright';

async function preDeploymentTest() {
  const results = { passed: 0, failed: 0, issues: [] };
  const browser = await chromium.launch({ headless: true });
  
  try {
    const page = await browser.newPage();
    
    // Test 1: Check if dev server is running
    console.log('🔍 Testing local development server...');
    try {
      await page.goto('http://localhost:3000', { waitUntil: 'networkidle', timeout: 10000 });
      console.log('✅ Local server accessible');
      results.passed++;
    } catch (error) {
      console.log('❌ Local server not running');
      results.failed++;
      results.issues.push('Local dev server not accessible');
      throw new Error('Local server must be running for tests');
    }
    
    // Test 2: Check version
    const version = await page.evaluate(() => window.CBLIX2_VERSION);
    if (version) {
      console.log(`✅ Version found: ${version}`);
      results.passed++;
    } else {
      console.log('❌ Version not found');
      results.failed++;
      results.issues.push('Version info missing');
    }
    
    // Test 3: Check main menu loads
    const startButton = await page.locator('#start-btn').isVisible();
    if (startButton) {
      console.log('✅ Start button visible');
      results.passed++;
    } else {
      console.log('❌ Start button not found');
      results.failed++;
      results.issues.push('Main menu not loading');
    }
    
    // Test 4: Check tutorial
    await page.click('#tutorial-btn');
    await page.waitForTimeout(1000);
    const tutorialVisible = await page.locator('.tutorial-screen').isVisible();
    if (tutorialVisible) {
      console.log('✅ Tutorial works');
      results.passed++;
      await page.click('#back-btn');
    } else {
      console.log('❌ Tutorial not working');
      results.failed++;
      results.issues.push('Tutorial not implemented');
    }
    
    // Test 5: Start game and check color buttons
    await page.click('#start-btn');
    await page.waitForTimeout(2000);
    const colorButtons = await page.locator('.color-button').count();
    if (colorButtons > 0) {
      console.log(`✅ ${colorButtons} color buttons visible`);
      results.passed++;
    } else {
      console.log('❌ No color buttons');
      results.failed++;
      results.issues.push('Color buttons not rendering');
    }
    
    // Test 6: Check responsive design
    const needsScroll = await page.evaluate(() => {
      return document.body.scrollHeight > window.innerHeight;
    });
    if (!needsScroll) {
      console.log('✅ No scrolling needed');
      results.passed++;
    } else {
      console.log('❌ Page requires scrolling');
      results.failed++;
      results.issues.push('Responsive design broken - scrolling detected');
    }
    
    await page.screenshot({ path: 'screenshots/pre-deployment.png' });
    
  } catch (error) {
    console.error('Pre-deployment test error:', error);
    results.failed++;
  } finally {
    await browser.close();
  }
  
  // Summary
  console.log(`\n📊 Pre-deployment: ${results.passed} passed, ${results.failed} failed`);
  if (results.failed > 0) {
    console.log('Issues:', results.issues.join(', '));
    process.exit(1);
  }
}

preDeploymentTest();
EOF

    # Run local server if not running
    if ! curl -s http://localhost:3000 > /dev/null; then
        log_info "Starting dev server..."
        npm run dev > dev-server.log 2>&1 &
        DEV_PID=$!
        sleep 5
    fi
    
    # Run pre-deployment tests
    node pre-deployment-test.js || {
        log_error "Pre-deployment tests failed!"
        exit 1
    }
    
    log_info "Pre-deployment tests passed ✅"
}

# Build verification
build_verification() {
    log_section "BUILD VERIFICATION"
    
    # Run build
    log_info "Building project..."
    npm run build:only || {
        log_error "Build failed!"
        exit 1
    }
    
    # Verify build output
    log_info "Verifying build output..."
    
    # Check critical files
    CRITICAL_FILES=(
        "$BUILD_DIR/index.html"
        "$BUILD_DIR/assets"
        "$BUILD_DIR/manifest.json"
        "$BUILD_DIR/favicon.ico"
    )
    
    for file in "${CRITICAL_FILES[@]}"; do
        if [[ -e "$file" ]]; then
            log_info "✅ Found: $file"
        else
            log_error "❌ Missing: $file"
            exit 1
        fi
    done
    
    # Check HTML content
    if grep -q "CBLIX2_VERSION" "$BUILD_DIR/index.html"; then
        log_info "✅ Version info in HTML"
    else
        log_error "❌ Version info missing from HTML"
        exit 1
    fi
    
    # Check JS bundle exists
    JS_COUNT=$(find "$BUILD_DIR/assets" -name "*.js" | wc -l)
    if [[ $JS_COUNT -gt 0 ]]; then
        log_info "✅ JavaScript bundles found: $JS_COUNT"
    else
        log_error "❌ No JavaScript bundles found"
        exit 1
    fi
    
    # Check CSS bundle exists
    CSS_COUNT=$(find "$BUILD_DIR/assets" -name "*.css" | wc -l)
    if [[ $CSS_COUNT -gt 0 ]]; then
        log_info "✅ CSS bundles found: $CSS_COUNT"
    else
        log_error "❌ No CSS bundles found"
        exit 1
    fi
}

# Deploy to Cloudflare
deploy_to_cloudflare() {
    log_section "DEPLOYING TO CLOUDFLARE"
    
    # Copy assets to correct location
    log_info "Preparing assets..."
    cp -r dist/assets dist/public/ 2>/dev/null || true
    cp dist/*.{ico,png,js,json} dist/public/ 2>/dev/null || true
    
    # Deploy
    log_info "Deploying to Cloudflare Pages..."
    DEPLOY_OUTPUT=$(wrangler pages deploy "$BUILD_DIR" --project-name="$PROJECT_NAME" 2>&1)
    echo "$DEPLOY_OUTPUT"
    
    # Extract deployment URL
    DEPLOY_URL=$(echo "$DEPLOY_OUTPUT" | grep -oE 'https://[a-f0-9]+\.'$PROJECT_NAME'\.pages\.dev' | head -1)
    if [[ -n "$DEPLOY_URL" ]]; then
        log_info "Deployed to: $DEPLOY_URL"
        echo "$DEPLOY_URL" > .last_deployment_url
    else
        log_error "Failed to extract deployment URL"
        exit 1
    fi
    
    # Wait for propagation
    log_info "Waiting for deployment to propagate..."
    sleep 15
}

# Post-deployment tests
post_deployment_tests() {
    log_section "POST-DEPLOYMENT TESTS"
    
    # Create comprehensive post-deployment test
    cat > post-deployment-test.js << 'EOF'
import { chromium, devices } from 'playwright';

async function postDeploymentTest() {
  const results = { passed: 0, failed: 0, critical: [] };
  const browser = await chromium.launch({ headless: true });
  
  try {
    // Test production URL
    console.log('🌐 Testing production site...\n');
    
    const page = await browser.newPage();
    
    // Test 1: Site loads
    console.log('1️⃣ Testing site accessibility...');
    try {
      await page.goto('https://cblix2.franzai.com', { 
        waitUntil: 'networkidle',
        timeout: 30000 
      });
      console.log('✅ Site loads successfully');
      results.passed++;
    } catch (error) {
      console.log('❌ Site failed to load');
      results.failed++;
      results.critical.push('Site not accessible');
      throw error;
    }
    
    // Test 2: Check for blank page
    const pageContent = await page.content();
    const hasContent = pageContent.includes('CBLIX2') || pageContent.includes('app');
    if (hasContent) {
      console.log('✅ Page has content (not blank)');
      results.passed++;
    } else {
      console.log('❌ BLANK PAGE DETECTED!');
      results.failed++;
      results.critical.push('Blank page - no content');
    }
    
    // Test 3: JavaScript loaded
    const jsLoaded = await page.evaluate(() => {
      return typeof window.CBLIX2_VERSION !== 'undefined';
    });
    if (jsLoaded) {
      const version = await page.evaluate(() => window.CBLIX2_VERSION);
      console.log(`✅ JavaScript loaded - Version: ${version}`);
      results.passed++;
    } else {
      console.log('❌ JavaScript not loaded');
      results.failed++;
      results.critical.push('JavaScript bundle not loading');
    }
    
    // Test 4: CSS loaded
    const cssLoaded = await page.evaluate(() => {
      const styles = window.getComputedStyle(document.body);
      return styles.backgroundColor !== 'rgba(0, 0, 0, 0)';
    });
    if (cssLoaded) {
      console.log('✅ CSS loaded');
      results.passed++;
    } else {
      console.log('❌ CSS not loaded');
      results.failed++;
      results.critical.push('CSS not loading');
    }
    
    // Test 5: Main menu visible
    const startVisible = await page.locator('#start-btn').isVisible().catch(() => false);
    if (startVisible) {
      console.log('✅ Start button visible');
      results.passed++;
    } else {
      console.log('❌ Start button not visible');
      results.failed++;
      results.critical.push('Main menu not rendering');
    }
    
    // Test 6: Game functionality
    if (startVisible) {
      await page.click('#start-btn');
      await page.waitForTimeout(3000);
      
      const gameCanvas = await page.locator('#game-canvas').isVisible().catch(() => false);
      const colorButtons = await page.locator('.color-button').count();
      
      if (gameCanvas && colorButtons > 0) {
        console.log(`✅ Game loads - ${colorButtons} color buttons`);
        results.passed++;
      } else {
        console.log('❌ Game not loading properly');
        results.failed++;
        results.critical.push('Game not functional');
      }
    }
    
    // Test 7: Mobile responsiveness
    console.log('\n📱 Testing mobile...');
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('https://cblix2.franzai.com', { waitUntil: 'networkidle' });
    
    const mobileWorks = await page.locator('#start-btn').isVisible().catch(() => false);
    if (mobileWorks) {
      console.log('✅ Mobile site works');
      results.passed++;
    } else {
      console.log('❌ Mobile site broken');
      results.failed++;
    }
    
    // Take screenshots
    await page.screenshot({ path: 'screenshots/post-deployment-prod.png', fullPage: true });
    
  } catch (error) {
    console.error('Critical test error:', error);
    results.failed++;
  } finally {
    await browser.close();
  }
  
  // Summary
  console.log(`\n📊 Post-deployment: ${results.passed} passed, ${results.failed} failed`);
  if (results.critical.length > 0) {
    console.log('🚨 CRITICAL ISSUES:', results.critical.join(', '));
  }
  
  if (results.failed > 0) {
    process.exit(1);
  }
}

postDeploymentTest();
EOF

    # Run post-deployment tests
    node post-deployment-test.js || {
        log_error "Post-deployment tests failed!"
        log_error "DEPLOYMENT FAILED - Site is broken!"
        exit 1
    }
    
    # Additional curl tests
    log_info "Running curl tests..."
    
    # Test HTTP status
    HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$PRODUCTION_URL")
    if [[ "$HTTP_STATUS" == "200" ]]; then
        log_info "✅ HTTP 200 OK"
    else
        log_error "❌ HTTP $HTTP_STATUS"
        exit 1
    fi
    
    # Test content
    CONTENT=$(curl -s "$PRODUCTION_URL")
    if echo "$CONTENT" | grep -q "CBLIX2"; then
        log_info "✅ Content verified"
    else
        log_error "❌ Content missing"
        exit 1
    fi
    
    log_info "All post-deployment tests passed! ✅"
}

# Generate report
generate_report() {
    log_section "DEPLOYMENT REPORT"
    
    cat > deployment-report.md << EOF
# CBLIX2 Deployment Report
Generated: $(date)

## Status: ✅ SUCCESS

## URLs
- Production: $PRODUCTION_URL
- Pages.dev: $PAGES_URL
- Deployment: $(cat .last_deployment_url 2>/dev/null || echo "N/A")

## Test Results
- Pre-deployment tests: ✅ PASSED
- Build verification: ✅ PASSED
- Post-deployment tests: ✅ PASSED
- Site is LIVE and WORKING

## Verified Features
- ✅ No blank pages
- ✅ JavaScript loading
- ✅ CSS loading
- ✅ Game functional
- ✅ Tutorial working
- ✅ Mobile responsive
- ✅ No scrolling issues
- ✅ Color buttons visible

## Screenshots
- Pre-deployment: screenshots/pre-deployment.png
- Post-deployment: screenshots/post-deployment-prod.png
EOF

    log_info "Report saved to deployment-report.md"
    cat deployment-report.md
}

# Auto-increment version
auto_increment_version() {
    log_section "VERSION INCREMENT"
    
    log_info "Current version: $(node -p "require('./package.json').version")"
    
    # Run auto-version script
    node scripts/auto-version.js || {
        log_error "Failed to increment version"
        exit 1
    }
    
    NEW_VERSION=$(node -p "require('./package.json').version")
    log_info "New version: $NEW_VERSION"
}

# Commit and push to GitHub
push_to_github() {
    log_section "GITHUB PUSH"
    
    # Check if we have uncommitted changes
    if [[ -n $(git status --porcelain) ]]; then
        log_info "Committing deployment changes..."
        git add -A
        git commit -m "🚀 Deploy v$NEW_VERSION - Auto-deployment with tests" || {
            log_warn "No changes to commit"
        }
    fi
    
    # Push to GitHub
    log_info "Pushing to GitHub..."
    git push origin main || {
        log_error "Failed to push to GitHub"
        log_warn "Deployment succeeded but GitHub push failed"
        # Don't exit - deployment worked
    }
    
    # Create and push tag
    git tag -a "v$NEW_VERSION" -m "Release v$NEW_VERSION - Automated deployment" || {
        log_warn "Tag already exists"
    }
    git push origin "v$NEW_VERSION" || {
        log_warn "Failed to push tag"
    }
}

# Main deployment flow
main() {
    log_section "CBLIX2 DEPLOYMENT WITH FULL TESTING"
    
    # Check dependencies
    command -v node >/dev/null 2>&1 || { log_error "Node.js required"; exit 1; }
    command -v wrangler >/dev/null 2>&1 || { log_error "Wrangler required"; exit 1; }
    command -v curl >/dev/null 2>&1 || { log_error "Curl required"; exit 1; }
    command -v git >/dev/null 2>&1 || { log_error "Git required"; exit 1; }
    
    # Install playwright if needed
    if [[ ! -d "node_modules/playwright" ]]; then
        log_info "Installing Playwright..."
        npm install playwright
    fi
    
    # Auto-increment version
    auto_increment_version
    
    # Run deployment pipeline
    pre_deployment_tests
    build_verification
    deploy_to_cloudflare
    post_deployment_tests
    
    # Run asset verification
    log_section "ASSET VERIFICATION"
    log_info "Running comprehensive asset verification..."
    ./verify-assets.sh "$PRODUCTION_URL" || {
        log_error "Asset verification failed!"
        exit 1
    }
    
    # Push to GitHub
    push_to_github
    
    generate_report
    
    log_section "🎉 DEPLOYMENT SUCCESSFUL!"
    log_info "CBLIX2 is LIVE and VERIFIED at $PRODUCTION_URL"
}

# Run
main "$@"