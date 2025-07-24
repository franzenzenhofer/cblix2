#!/bin/bash
# Test current CBLIX2 deployment

set -euo pipefail

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

# URLs to test
CUSTOM_DOMAIN="https://cblix2.franzai.com"
PAGES_URL="https://cblix2.pages.dev"

echo -e "${GREEN}=== CBLIX2 Deployment Test ===${NC}\n"

# Test custom domain
echo -e "${GREEN}[1/5] Testing custom domain...${NC}"
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$CUSTOM_DOMAIN")
if [ "$HTTP_STATUS" = "200" ]; then
    echo -e "${GREEN}✅ Custom domain is accessible (HTTP $HTTP_STATUS)${NC}"
else
    echo -e "${RED}❌ Custom domain returned HTTP $HTTP_STATUS${NC}"
    exit 1
fi

# Test pages.dev URL
echo -e "\n${GREEN}[2/5] Testing pages.dev URL...${NC}"
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$PAGES_URL")
if [ "$HTTP_STATUS" = "200" ]; then
    echo -e "${GREEN}✅ Pages.dev URL is accessible (HTTP $HTTP_STATUS)${NC}"
else
    echo -e "${RED}❌ Pages.dev URL returned HTTP $HTTP_STATUS${NC}"
    exit 1
fi

# Check version
echo -e "\n${GREEN}[3/5] Checking version...${NC}"
PAGE_CONTENT=$(curl -s "$CUSTOM_DOMAIN")
if echo "$PAGE_CONTENT" | grep -q "window.CBLIX2_VERSION = '2.0.0'"; then
    echo -e "${GREEN}✅ Version 2.0.0 found${NC}"
else
    echo -e "${RED}❌ Version 2.0.0 NOT found${NC}"
    exit 1
fi

# Check build date
echo -e "\n${GREEN}[4/5] Checking build date...${NC}"
if echo "$PAGE_CONTENT" | grep -q "window.CBLIX2_BUILD_DATE"; then
    BUILD_DATE=$(echo "$PAGE_CONTENT" | grep -oE "window.CBLIX2_BUILD_DATE = '[^']+'" | cut -d"'" -f2)
    echo -e "${GREEN}✅ Build date found: $BUILD_DATE${NC}"
else
    echo -e "${YELLOW}⚠️  Build date not found${NC}"
fi

# Check branding
echo -e "\n${GREEN}[5/5] Checking 'The Best App Ever' branding...${NC}"
if echo "$PAGE_CONTENT" | grep -q "The Best App Ever"; then
    echo -e "${GREEN}✅ 'The Best App Ever' branding found${NC}"
else
    echo -e "${RED}❌ 'The Best App Ever' branding NOT found${NC}"
    exit 1
fi

# Performance test
echo -e "\n${GREEN}=== Performance Test ===${NC}"
LOAD_TIME=$(curl -o /dev/null -s -w '%{time_total}' "$CUSTOM_DOMAIN")
echo -e "Page load time: ${YELLOW}${LOAD_TIME}s${NC}"

# Summary
echo -e "\n${GREEN}=== Summary ===${NC}"
echo -e "${GREEN}✅ All deployment tests passed!${NC}"
echo -e "\nGame URLs:"
echo -e "- Custom domain: ${GREEN}$CUSTOM_DOMAIN${NC}"
echo -e "- Pages.dev: ${GREEN}$PAGES_URL${NC}"
echo -e "\n${GREEN}🎮 CBLIX2 is live and ready to play!${NC}"