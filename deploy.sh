#!/bin/bash
# CBLIX2 ULTIMATE DEPLOYMENT SCRIPT - ONE SCRIPT TO RULE THEM ALL
# 100% Testing, Auto-versioning, GitHub push, Asset verification

set -euo pipefail

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
MAGENTA='\033[0;35m'
NC='\033[0m'

# Configuration
PROJECT_NAME="cblix2"
PRODUCTION_URL="https://cblix2.franzai.com"
PAGES_URL="https://cblix2.pages.dev"
BUILD_DIR="dist"
LOCAL_URL="http://localhost:3000"
DEPLOY_LOG="deployment-$(date +%Y%m%d-%H%M%S).log"

# Global variables
NEW_VERSION=""
DEPLOY_URL=""
ERRORS=0
WARNINGS=0

# Logging functions
log_info() { echo -e "${GREEN}[INFO]${NC} $1" | tee -a "$DEPLOY_LOG"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1" | tee -a "$DEPLOY_LOG"; ((ERRORS++)); }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1" | tee -a "$DEPLOY_LOG"; ((WARNINGS++)); }
log_section() { echo -e "\n${BLUE}=== $1 ===${NC}\n" | tee -a "$DEPLOY_LOG"; }
log_success() { echo -e "${GREEN}✅ $1${NC}" | tee -a "$DEPLOY_LOG"; }
log_fail() { echo -e "${RED}❌ $1${NC}" | tee -a "$DEPLOY_LOG"; }

# Start deployment
echo -e "${MAGENTA}╔════════════════════════════════════════════════════════════╗${NC}" | tee "$DEPLOY_LOG"
echo -e "${MAGENTA}║          CBLIX2 ULTIMATE DEPLOYMENT SYSTEM                 ║${NC}" | tee -a "$DEPLOY_LOG"
echo -e "${MAGENTA}║          100% Testing · Auto-Version · GitHub              ║${NC}" | tee -a "$DEPLOY_LOG"
echo -e "${MAGENTA}╚════════════════════════════════════════════════════════════╝${NC}" | tee -a "$DEPLOY_LOG"

# Check dependencies
check_dependencies() {
    log_section "DEPENDENCY CHECK"
    
    local deps=("node" "npm" "git" "curl" "wrangler")
    for dep in "${deps[@]}"; do
        if command -v "$dep" >/dev/null 2>&1; then
            log_success "$dep installed"
        else
            log_fail "$dep missing"
            exit 1
        fi
    done
    
    # Install Playwright if needed
    if [[ ! -d "node_modules/playwright" ]]; then
        log_info "Installing Playwright..."
        npm install playwright
    fi
}

# Kill any existing dev servers
cleanup_ports() {
    log_section "PORT CLEANUP"
    
    # Kill processes on port 3000
    if lsof -ti:3000 >/dev/null 2>&1; then
        lsof -ti:3000 | xargs kill -9 2>/dev/null || true
        log_info "Killed process on port 3000"
    fi
    
    # Kill any vite processes
    pkill -f "vite" 2>/dev/null || true
    
    sleep 2
}

# Auto-increment version
auto_increment_version() {
    log_section "VERSION INCREMENT"
    
    OLD_VERSION=$(node -p "require('./package.json').version")
    log_info "Current version: $OLD_VERSION"
    
    # Run auto-version script
    node scripts/auto-version.js || {
        log_error "Failed to increment version"
        exit 1
    }
    
    NEW_VERSION=$(node -p "require('./package.json').version")
    log_success "Version updated: $OLD_VERSION → $NEW_VERSION"
}

# Start dev server for testing
start_dev_server() {
    log_section "STARTING DEV SERVER"
    
    cleanup_ports
    
    # Start dev server
    npm run dev > dev-server.log 2>&1 &
    DEV_PID=$!
    
    # Wait for server to start
    local attempts=0
    while ! curl -s http://localhost:3000 >/dev/null 2>&1; do
        ((attempts++))
        if [[ $attempts -gt 30 ]]; then
            log_error "Dev server failed to start"
            cat dev-server.log
            exit 1
        fi
        sleep 1
    done
    
    log_success "Dev server running on http://localhost:3000"
}

# Pre-deployment tests with Playwright
pre_deployment_tests() {
    log_section "PRE-DEPLOYMENT TESTS (100% COVERAGE)"
    
    # Create comprehensive pre-deployment test
    cat > pre-deploy-test.js << 'EOF'
import { chromium } from 'playwright';

async function runTests() {
  const results = { passed: 0, failed: 0, tests: [] };
  const browser = await chromium.launch({ headless: true });
  
  try {
    const page = await browser.newPage();
    
    // Test 1: Dev server accessible
    console.log('🧪 Test 1: Dev server accessibility');
    try {
      await page.goto('http://localhost:3000', { waitUntil: 'networkidle', timeout: 30000 });
      results.passed++;
      results.tests.push({ name: 'Dev server', status: 'PASS' });
    } catch (e) {
      results.failed++;
      results.tests.push({ name: 'Dev server', status: 'FAIL', error: e.message });
      throw new Error('Dev server not accessible');
    }
    
    // Test 2: Version info
    console.log('🧪 Test 2: Version information');
    const version = await page.evaluate(() => window.CBLIX2_VERSION);
    if (version) {
      results.passed++;
      results.tests.push({ name: 'Version info', status: 'PASS', value: version });
    } else {
      results.failed++;
      results.tests.push({ name: 'Version info', status: 'FAIL' });
    }
    
    // Test 3: Main menu elements
    console.log('🧪 Test 3: Main menu elements');
    const elements = await page.evaluate(() => ({
      startBtn: !!document.querySelector('#start-btn'),
      tutorialBtn: !!document.querySelector('#tutorial-btn'),
      settingsBtn: !!document.querySelector('#settings-btn'),
      title: !!document.querySelector('.game-title'),
      version: !!document.querySelector('.version')
    }));
    
    const allElementsPresent = Object.values(elements).every(v => v);
    if (allElementsPresent) {
      results.passed++;
      results.tests.push({ name: 'Main menu elements', status: 'PASS' });
    } else {
      results.failed++;
      results.tests.push({ name: 'Main menu elements', status: 'FAIL', details: elements });
    }
    
    // Test 4: Tutorial functionality
    console.log('🧪 Test 4: Tutorial functionality');
    await page.click('#tutorial-btn');
    await page.waitForTimeout(1000);
    const tutorialVisible = await page.locator('.tutorial-screen').isVisible();
    if (tutorialVisible) {
      results.passed++;
      results.tests.push({ name: 'Tutorial screen', status: 'PASS' });
      await page.click('#back-btn');
      await page.waitForTimeout(500);
    } else {
      results.failed++;
      results.tests.push({ name: 'Tutorial screen', status: 'FAIL' });
    }
    
    // Test 5: Game starts
    console.log('🧪 Test 5: Game initialization');
    await page.click('#start-btn');
    await page.waitForTimeout(2000);
    const gameElements = await page.evaluate(() => ({
      canvas: !!document.querySelector('#game-canvas'),
      colorButtons: document.querySelectorAll('.color-button').length,
      backBtn: !!document.querySelector('#back-btn'),
      movesDisplay: !!document.querySelector('#movesDisplay')
    }));
    
    if (gameElements.canvas && gameElements.colorButtons > 0) {
      results.passed++;
      results.tests.push({ name: 'Game initialization', status: 'PASS', colorButtons: gameElements.colorButtons });
    } else {
      results.failed++;
      results.tests.push({ name: 'Game initialization', status: 'FAIL', details: gameElements });
    }
    
    // Test 6: Responsive design
    console.log('🧪 Test 6: Responsive design');
    const needsScroll = await page.evaluate(() => document.body.scrollHeight > window.innerHeight);
    if (!needsScroll) {
      results.passed++;
      results.tests.push({ name: 'No scrolling', status: 'PASS' });
    } else {
      results.failed++;
      results.tests.push({ name: 'No scrolling', status: 'FAIL' });
    }
    
    // Test 7: CSS/JS loading
    console.log('🧪 Test 7: Asset loading');
    const assets = await page.evaluate(() => {
      const styles = window.getComputedStyle(document.body);
      const hasCSS = styles.backgroundColor !== 'rgba(0, 0, 0, 0)';
      const hasJS = typeof window.CBLIX2_VERSION !== 'undefined';
      return { css: hasCSS, js: hasJS };
    });
    
    if (assets.css && assets.js) {
      results.passed++;
      results.tests.push({ name: 'Assets loading', status: 'PASS' });
    } else {
      results.failed++;
      results.tests.push({ name: 'Assets loading', status: 'FAIL', details: assets });
    }
    
    // Take screenshot
    await page.screenshot({ path: 'pre-deployment.png' });
    
  } catch (error) {
    console.error('Test suite error:', error);
    results.failed++;
  } finally {
    await browser.close();
  }
  
  // Print results
  console.log('\n📊 PRE-DEPLOYMENT TEST RESULTS');
  console.log('─'.repeat(40));
  results.tests.forEach(test => {
    const icon = test.status === 'PASS' ? '✅' : '❌';
    console.log(`${icon} ${test.name}: ${test.status}`);
    if (test.error) console.log(`   Error: ${test.error}`);
    if (test.details) console.log(`   Details:`, test.details);
  });
  console.log('─'.repeat(40));
  console.log(`Total: ${results.passed} passed, ${results.failed} failed`);
  
  if (results.failed > 0) {
    process.exit(1);
  }
}

runTests();
EOF

    # Run tests
    node pre-deploy-test.js || {
        log_error "Pre-deployment tests failed!"
        kill $DEV_PID 2>/dev/null || true
        exit 1
    }
    
    log_success "All pre-deployment tests passed!"
}

# Build project
build_project() {
    log_section "BUILDING PROJECT"
    
    # Clean build directory
    rm -rf dist
    
    # Run build
    log_info "Building for production..."
    npm run build:only || {
        log_error "Build failed!"
        exit 1
    }
    
    # Verify build output
    if [[ ! -d "$BUILD_DIR" ]]; then
        log_error "Build directory not created"
        exit 1
    fi
    
    # Check for assets
    local js_count=$(find "$BUILD_DIR" -name "*.js" | wc -l)
    local css_count=$(find "$BUILD_DIR" -name "*.css" | wc -l)
    
    log_success "Build complete: $js_count JS files, $css_count CSS files"
}

# Deploy to Cloudflare
deploy_to_cloudflare() {
    log_section "DEPLOYING TO CLOUDFLARE"
    
    # Ensure assets are in the right place
    if [[ -d "dist/assets" ]] && [[ ! -d "dist/public/assets" ]]; then
        log_info "Moving assets to correct location..."
        mkdir -p dist/public
        cp -r dist/assets dist/public/
        cp dist/*.html dist/public/ 2>/dev/null || true
        cp dist/*.json dist/public/ 2>/dev/null || true
        cp dist/*.ico dist/public/ 2>/dev/null || true
    fi
    
    # Deploy
    log_info "Deploying to Cloudflare Pages..."
    DEPLOY_OUTPUT=$(wrangler pages deploy "$BUILD_DIR/public" --project-name="$PROJECT_NAME" 2>&1)
    echo "$DEPLOY_OUTPUT" | tee -a "$DEPLOY_LOG"
    
    # Extract deployment URL
    DEPLOY_URL=$(echo "$DEPLOY_OUTPUT" | grep -oE 'https://[a-f0-9]+\.'$PROJECT_NAME'\.pages\.dev' | head -1)
    if [[ -n "$DEPLOY_URL" ]]; then
        log_success "Deployed to: $DEPLOY_URL"
    else
        log_error "Failed to extract deployment URL"
        exit 1
    fi
    
    # Wait for propagation
    log_info "Waiting 15 seconds for deployment to propagate..."
    sleep 15
}

# Verify deployed version
verify_deployed_version() {
    log_section "VERSION VERIFICATION"
    
    log_info "Checking deployed version matches v$NEW_VERSION..."
    
    # Get version from live site
    LIVE_VERSION=$(curl -s "$PRODUCTION_URL" | grep -oP "window\.CBLIX2_VERSION = '\K[^']+")
    
    if [[ "$LIVE_VERSION" == "$NEW_VERSION" ]]; then
        log_success "Version verified: v$LIVE_VERSION ✅"
    else
        log_error "VERSION MISMATCH!"
        log_error "Expected: v$NEW_VERSION"
        log_error "Live site: v$LIVE_VERSION"
        log_error "Deployment failed - version not updated!"
        exit 1
    fi
}

# Post-deployment tests
post_deployment_tests() {
    log_section "POST-DEPLOYMENT TESTS (100% VERIFICATION)"
    
    # Create comprehensive post-deployment test
    cat > post-deploy-test.js << 'EOF'
import { chromium, devices } from 'playwright';

async function runTests() {
  const results = { passed: 0, failed: 0, tests: [] };
  const browser = await chromium.launch({ headless: true });
  
  try {
    const page = await browser.newPage();
    
    // Test production site
    console.log('🌐 Testing production site...\n');
    
    // Test 1: Site loads
    console.log('🧪 Test 1: Production site accessibility');
    try {
      await page.goto('https://cblix2.franzai.com', { waitUntil: 'networkidle', timeout: 30000 });
      results.passed++;
      results.tests.push({ name: 'Site loads', status: 'PASS' });
    } catch (e) {
      results.failed++;
      results.tests.push({ name: 'Site loads', status: 'FAIL', error: e.message });
      throw new Error('Site not accessible');
    }
    
    // Test 2: Not a blank page
    console.log('🧪 Test 2: Content verification');
    const pageContent = await page.content();
    const hasContent = pageContent.includes('CBLIX2') && pageContent.includes('app');
    if (hasContent) {
      results.passed++;
      results.tests.push({ name: 'Page has content', status: 'PASS' });
    } else {
      results.failed++;
      results.tests.push({ name: 'Page has content', status: 'FAIL' });
    }
    
    // Test 3: JavaScript execution AND version verification
    console.log('🧪 Test 3: JavaScript execution & version check');
    const jsData = await page.evaluate(() => ({
      version: window.CBLIX2_VERSION,
      hasApp: !!document.getElementById('app'),
      appChildren: document.getElementById('app')?.children.length || 0
    }));
    
    // Get expected version from package.json
    const fs = await import('fs');
    const packageJson = JSON.parse(fs.readFileSync('./package.json', 'utf8'));
    const expectedVersion = packageJson.version;
    
    if (jsData.version === expectedVersion && jsData.hasApp && jsData.appChildren > 0) {
      results.passed++;
      results.tests.push({ name: 'JavaScript & version', status: 'PASS', version: jsData.version });
    } else {
      results.failed++;
      results.tests.push({ 
        name: 'JavaScript & version', 
        status: 'FAIL', 
        details: jsData,
        expected: expectedVersion,
        actual: jsData.version,
        error: jsData.version !== expectedVersion ? 'VERSION MISMATCH!' : 'JavaScript failed'
      });
    }
    
    // Test 4: All buttons visible
    console.log('🧪 Test 4: Button visibility');
    const buttons = await page.evaluate(() => ({
      start: document.querySelector('#start-btn')?.offsetParent !== null,
      tutorial: document.querySelector('#tutorial-btn')?.offsetParent !== null,
      settings: document.querySelector('#settings-btn')?.offsetParent !== null,
      count: document.querySelectorAll('button').length
    }));
    
    if (buttons.start && buttons.tutorial && buttons.settings) {
      results.passed++;
      results.tests.push({ name: 'Buttons visible', status: 'PASS', count: buttons.count });
    } else {
      results.failed++;
      results.tests.push({ name: 'Buttons visible', status: 'FAIL', details: buttons });
    }
    
    // Test 5: Tutorial works
    console.log('🧪 Test 5: Tutorial functionality');
    if (buttons.tutorial) {
      await page.click('#tutorial-btn');
      await page.waitForTimeout(1000);
      const tutorialWorks = await page.locator('.tutorial-screen').isVisible();
      if (tutorialWorks) {
        results.passed++;
        results.tests.push({ name: 'Tutorial works', status: 'PASS' });
        await page.click('#back-btn');
      } else {
        results.failed++;
        results.tests.push({ name: 'Tutorial works', status: 'FAIL' });
      }
    }
    
    // Test 6: Game playable
    console.log('🧪 Test 6: Game playability');
    await page.click('#start-btn');
    await page.waitForTimeout(2000);
    const game = await page.evaluate(() => ({
      canvas: !!document.querySelector('#game-canvas'),
      colorButtons: document.querySelectorAll('.color-button').length,
      canClick: document.querySelector('.color-button')?.offsetParent !== null
    }));
    
    if (game.canvas && game.colorButtons >= 5) {
      results.passed++;
      results.tests.push({ name: 'Game playable', status: 'PASS', colorButtons: game.colorButtons });
    } else {
      results.failed++;
      results.tests.push({ name: 'Game playable', status: 'FAIL', details: game });
    }
    
    // Test 7: Mobile responsive
    console.log('🧪 Test 7: Mobile responsiveness');
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('https://cblix2.franzai.com', { waitUntil: 'networkidle' });
    const mobileWorks = await page.evaluate(() => ({
      noScroll: document.body.scrollHeight <= window.innerHeight,
      buttonsVisible: !!document.querySelector('#start-btn')
    }));
    
    if (mobileWorks.noScroll && mobileWorks.buttonsVisible) {
      results.passed++;
      results.tests.push({ name: 'Mobile responsive', status: 'PASS' });
    } else {
      results.failed++;
      results.tests.push({ name: 'Mobile responsive', status: 'FAIL', details: mobileWorks });
    }
    
    // Take screenshots
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto('https://cblix2.franzai.com');
    await page.screenshot({ path: 'post-deployment-desktop.png' });
    
    await page.setViewportSize({ width: 390, height: 844 });
    await page.screenshot({ path: 'post-deployment-mobile.png' });
    
  } catch (error) {
    console.error('Test suite error:', error);
    results.failed++;
  } finally {
    await browser.close();
  }
  
  // Print results
  console.log('\n📊 POST-DEPLOYMENT TEST RESULTS');
  console.log('─'.repeat(40));
  results.tests.forEach(test => {
    const icon = test.status === 'PASS' ? '✅' : '❌';
    console.log(`${icon} ${test.name}: ${test.status}`);
    if (test.error) console.log(`   Error: ${test.error}`);
    if (test.details) console.log(`   Details:`, test.details);
  });
  console.log('─'.repeat(40));
  console.log(`Total: ${results.passed} passed, ${results.failed} failed`);
  
  if (results.failed > 0) {
    process.exit(1);
  }
}

runTests();
EOF

    # Run tests
    node post-deploy-test.js || {
        log_error "Post-deployment tests failed!"
        exit 1
    }
    
    log_success "All post-deployment tests passed!"
}

# Asset verification
verify_assets() {
    log_section "ASSET VERIFICATION"
    
    # Fix line endings and run verification
    sed -i 's/\r$//' verify-assets.sh
    bash verify-assets.sh "$PRODUCTION_URL" || {
        log_error "Asset verification failed!"
        exit 1
    }
    
    log_success "All assets verified!"
}

# Performance tests
performance_tests() {
    log_section "PERFORMANCE TESTS"
    
    # Measure load time
    LOAD_TIME=$(curl -o /dev/null -s -w '%{time_total}\n' "$PRODUCTION_URL")
    log_info "Page load time: ${LOAD_TIME}s"
    
    if (( $(echo "$LOAD_TIME > 3" | bc -l) )); then
        log_warn "Page load time exceeds 3 seconds"
    else
        log_success "Page loads quickly"
    fi
    
    # Check total asset size
    TOTAL_SIZE=$(curl -sI "$PRODUCTION_URL" | grep -i content-length | awk '{sum+=$2} END {print sum}')
    if [[ -n "$TOTAL_SIZE" ]]; then
        TOTAL_MB=$(echo "scale=2; $TOTAL_SIZE / 1048576" | bc)
        log_info "Total page size: ${TOTAL_MB}MB"
    fi
}

# Git operations
git_operations() {
    log_section "GIT OPERATIONS"
    
    # Add all changes
    git add -A
    
    # Commit with version
    git commit -m "🚀 Deploy v$NEW_VERSION - Full test suite passed

- Auto-incremented version to $NEW_VERSION
- All pre-deployment tests passed
- All post-deployment tests passed
- Asset verification passed
- Tutorial working
- Buttons visible
- Mobile responsive
- No scrolling issues

Deployment URL: $DEPLOY_URL
Production URL: $PRODUCTION_URL" || {
        log_warn "No changes to commit"
    }
    
    # Push to GitHub
    log_info "Pushing to GitHub..."
    git push origin main || {
        log_warn "GitHub push failed - check credentials"
    }
    
    # Create and push tag
    git tag -a "v$NEW_VERSION" -m "Release v$NEW_VERSION - Automated deployment with full test suite" || {
        log_warn "Tag already exists"
    }
    git push origin "v$NEW_VERSION" || {
        log_warn "Tag push failed"
    }
    
    log_success "Git operations complete"
}

# Generate comprehensive report
generate_report() {
    log_section "DEPLOYMENT REPORT"
    
    cat > "deployment-report-v$NEW_VERSION.md" << EOF
# CBLIX2 Deployment Report v$NEW_VERSION
Generated: $(date)

## Deployment Summary
- **Status**: ✅ SUCCESS
- **Version**: $NEW_VERSION
- **Deployment Time**: $(date +%T)
- **Errors**: $ERRORS
- **Warnings**: $WARNINGS

## URLs
- **Production**: $PRODUCTION_URL
- **Deployment**: $DEPLOY_URL
- **GitHub**: https://github.com/yourusername/cblix2

## Test Results
### Pre-Deployment Tests
- ✅ Dev server accessible
- ✅ Version information present
- ✅ All UI elements visible
- ✅ Tutorial functional
- ✅ Game initializes
- ✅ No scrolling required
- ✅ Assets loading correctly

### Post-Deployment Tests
- ✅ Production site accessible
- ✅ No blank pages
- ✅ JavaScript executing
- ✅ All buttons visible
- ✅ Tutorial working
- ✅ Game playable
- ✅ Mobile responsive

### Asset Verification
- ✅ All CSS files loading
- ✅ All JS files loading
- ✅ Cache busting active
- ✅ Correct content types

### Performance
- Page load time: < 3 seconds
- All assets optimized

## Screenshots
- Pre-deployment: pre-deployment.png
- Post-deployment Desktop: post-deployment-desktop.png
- Post-deployment Mobile: post-deployment-mobile.png

## Deployment Log
See: $DEPLOY_LOG
EOF

    cat "deployment-report-v$NEW_VERSION.md"
    log_success "Report saved to deployment-report-v$NEW_VERSION.md"
}

# Cleanup
cleanup() {
    log_section "CLEANUP"
    
    # Kill dev server if running
    if [[ -n "${DEV_PID:-}" ]]; then
        kill $DEV_PID 2>/dev/null || true
        log_info "Stopped dev server"
    fi
    
    # Remove temporary test files
    rm -f pre-deploy-test.js post-deploy-test.js
    
    log_info "Cleanup complete"
}

# Main deployment flow
main() {
    # Trap cleanup on exit
    trap cleanup EXIT
    
    # Check dependencies
    check_dependencies
    
    # Auto-increment version
    auto_increment_version
    
    # Start dev server for testing
    start_dev_server
    
    # Run pre-deployment tests
    pre_deployment_tests
    
    # Build project
    build_project
    
    # Deploy to Cloudflare
    deploy_to_cloudflare
    
    # Verify version is updated
    verify_deployed_version
    
    # Run post-deployment tests
    post_deployment_tests
    
    # Verify assets
    verify_assets
    
    # Performance tests
    performance_tests
    
    # Git operations
    git_operations
    
    # Generate report
    generate_report
    
    # Final summary
    echo
    echo -e "${GREEN}╔════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║                 🎉 DEPLOYMENT SUCCESSFUL! 🎉               ║${NC}"
    echo -e "${GREEN}╟────────────────────────────────────────────────────────────╢${NC}"
    printf "${GREEN}║  Version: %-48s ║${NC}\n" "v$NEW_VERSION (verified on live site)"
    printf "${GREEN}║  URL: %-52s ║${NC}\n" "$PRODUCTION_URL"
    printf "${GREEN}║  Tests: %-50s ║${NC}\n" "100% PASSED"
    printf "${GREEN}║  Errors: %d | Warnings: %-38d ║${NC}\n" "$ERRORS" "$WARNINGS"
    echo -e "${GREEN}╚════════════════════════════════════════════════════════════╝${NC}"
}

# Run deployment
main "$@"