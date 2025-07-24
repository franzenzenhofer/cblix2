#!/bin/bash
# CBLIX2 Asset Verification Script
# Verifies all CSS/JS assets load correctly with cache busting

set -euo pipefail

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
SITE_URL="${1:-https://cblix2.franzai.com}"
TEMP_DIR="/tmp/cblix2-asset-check"
FAILED_ASSETS=()
MISSING_ASSETS=()

# Logging
log_info() { echo -e "${GREEN}[INFO]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_section() { echo -e "\n${BLUE}=== $1 ===${NC}\n"; }

# Create temp directory
mkdir -p "$TEMP_DIR"

# Function to extract asset URLs from HTML
extract_assets() {
    local html_content="$1"
    local asset_urls=()
    
    # Extract CSS links
    while IFS= read -r line; do
        [[ -n "$line" ]] && asset_urls+=("$line")
    done < <(echo "$html_content" | grep -oE 'href="(/assets/[^"]+\.css)"' | sed 's/href="//; s/"//')
    
    # Extract JS scripts
    while IFS= read -r line; do
        [[ -n "$line" ]] && asset_urls+=("$line")
    done < <(echo "$html_content" | grep -oE 'src="(/assets/[^"]+\.js)"' | sed 's/src="//; s/"//')
    
    printf '%s\n' "${asset_urls[@]}"
}

# Function to verify asset loads
verify_asset() {
    local asset_path="$1"
    local full_url="${SITE_URL}${asset_path}"
    
    log_info "Checking: $full_url"
    
    # Download asset and check status
    local response=$(curl -s -w "\n%{http_code}\n%{size_download}\n%{content_type}" -o "$TEMP_DIR/asset_content" "$full_url")
    local http_code=$(echo "$response" | tail -3 | head -1)
    local size=$(echo "$response" | tail -2 | head -1)
    local content_type=$(echo "$response" | tail -1)
    
    if [[ "$http_code" != "200" ]]; then
        log_error "Failed to load: $asset_path (HTTP $http_code)"
        FAILED_ASSETS+=("$asset_path")
        return 1
    fi
    
    if [[ "$size" -lt 100 ]]; then
        log_warn "Asset suspiciously small: $asset_path (${size} bytes)"
    fi
    
    # Verify content type
    if [[ "$asset_path" =~ \.css$ ]] && [[ ! "$content_type" =~ "text/css" ]]; then
        log_error "Wrong content-type for CSS: $content_type"
        FAILED_ASSETS+=("$asset_path")
        return 1
    fi
    
    if [[ "$asset_path" =~ \.js$ ]] && [[ ! "$content_type" =~ "javascript" ]]; then
        log_error "Wrong content-type for JS: $content_type"
        FAILED_ASSETS+=("$asset_path")
        return 1
    fi
    
    # Verify cache busting hash
    if [[ ! "$asset_path" =~ -[a-zA-Z0-9]{8}\.(css|js)$ ]]; then
        log_warn "Asset missing cache-busting hash: $asset_path"
    fi
    
    log_info "✅ Asset OK: $asset_path (${size} bytes, ${content_type})"
    return 0
}

# Main verification
main() {
    log_section "CBLIX2 Asset Verification"
    log_info "Target: $SITE_URL"
    
    # Step 1: Download HTML
    log_section "Downloading HTML"
    HTML_CONTENT=$(curl -s "$SITE_URL")
    
    if [[ -z "$HTML_CONTENT" ]]; then
        log_error "Failed to download HTML"
        exit 1
    fi
    
    # Save HTML for debugging
    echo "$HTML_CONTENT" > "$TEMP_DIR/index.html"
    log_info "HTML downloaded ($(echo "$HTML_CONTENT" | wc -l) lines)"
    
    # Step 2: Extract asset URLs
    log_section "Extracting Asset URLs"
    ASSETS=($(extract_assets "$HTML_CONTENT"))
    
    if [[ ${#ASSETS[@]} -eq 0 ]]; then
        log_error "No assets found in HTML!"
        log_error "This likely means the build failed or assets aren't properly linked"
        exit 1
    fi
    
    log_info "Found ${#ASSETS[@]} assets to verify"
    
    # Step 3: Verify each asset
    log_section "Verifying Assets"
    for asset in "${ASSETS[@]}"; do
        verify_asset "$asset" || true
    done
    
    # Step 4: Check critical files exist
    log_section "Checking Critical Files"
    
    # Check if main JS bundle exists
    if ! echo "$HTML_CONTENT" | grep -q 'src="/assets/index-.*\.js"'; then
        log_error "Main JS bundle missing!"
        MISSING_ASSETS+=("index.js")
    fi
    
    # Check if main CSS exists
    if ! echo "$HTML_CONTENT" | grep -q 'href="/assets/index-.*\.css"'; then
        log_error "Main CSS bundle missing!"
        MISSING_ASSETS+=("index.css")
    fi
    
    # Step 5: Performance checks
    log_section "Performance Checks"
    
    # Check total asset size
    TOTAL_SIZE=0
    for asset in "${ASSETS[@]}"; do
        size=$(curl -sI "${SITE_URL}${asset}" | grep -i content-length | awk '{print $2}' | tr -d '\r')
        if [[ -n "$size" ]]; then
            TOTAL_SIZE=$((TOTAL_SIZE + size))
        fi
    done
    
    TOTAL_MB=$(echo "scale=2; $TOTAL_SIZE / 1048576" | bc)
    log_info "Total asset size: ${TOTAL_MB}MB"
    
    if (( $(echo "$TOTAL_MB > 5" | bc -l) )); then
        log_warn "Assets are large (${TOTAL_MB}MB) - consider optimization"
    fi
    
    # Step 6: Verify app loads
    log_section "App Load Verification"
    
    # Use curl with JavaScript execution simulation
    APP_CHECK=$(curl -s "$SITE_URL" | grep -c "CBLIX2_VERSION" || true)
    if [[ "$APP_CHECK" -gt 0 ]]; then
        log_info "✅ App version script found"
    else
        log_error "App version script missing!"
    fi
    
    # Step 7: Summary
    log_section "VERIFICATION SUMMARY"
    
    TOTAL_CHECKED=${#ASSETS[@]}
    TOTAL_FAILED=${#FAILED_ASSETS[@]}
    TOTAL_MISSING=${#MISSING_ASSETS[@]}
    TOTAL_PASSED=$((TOTAL_CHECKED - TOTAL_FAILED))
    
    echo "Assets checked: $TOTAL_CHECKED"
    echo "Passed: $TOTAL_PASSED"
    echo "Failed: $TOTAL_FAILED"
    echo "Missing: $TOTAL_MISSING"
    
    if [[ $TOTAL_FAILED -gt 0 ]]; then
        log_error "Failed assets:"
        printf '%s\n' "${FAILED_ASSETS[@]}"
    fi
    
    if [[ $TOTAL_MISSING -gt 0 ]]; then
        log_error "Missing critical assets:"
        printf '%s\n' "${MISSING_ASSETS[@]}"
    fi
    
    # Cleanup
    rm -rf "$TEMP_DIR"
    
    # Exit code
    if [[ $TOTAL_FAILED -gt 0 ]] || [[ $TOTAL_MISSING -gt 0 ]]; then
        log_error "❌ Asset verification FAILED!"
        exit 1
    else
        log_info "✅ All assets verified successfully!"
        exit 0
    fi
}

# Run if not sourced
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi