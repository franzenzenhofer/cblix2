#!/bin/bash
# Quick deployment with version check

set -euo pipefail

GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}=== CBLIX2 DEPLOYMENT ===${NC}\n"

# Get current version
CURRENT_VERSION=$(node -p "require('./package.json').version")
echo -e "${GREEN}Current version: v$CURRENT_VERSION${NC}"

# Build with version injection
echo -e "\n${BLUE}Building...${NC}"
npm run build:only

# Deploy
echo -e "\n${BLUE}Deploying to Cloudflare...${NC}"
wrangler pages deploy dist/public --project-name=cblix2

# Wait for propagation
echo -e "\n${BLUE}Waiting for deployment...${NC}"
sleep 15

# Verify version
echo -e "\n${BLUE}Verifying deployment...${NC}"
LIVE_VERSION=$(curl -s https://cblix2.franzai.com | grep -oP "window\.CBLIX2_VERSION = '\K[^']+")

if [[ "$LIVE_VERSION" == "$CURRENT_VERSION" ]]; then
    echo -e "${GREEN}✅ SUCCESS! Version v$LIVE_VERSION is live at https://cblix2.franzai.com${NC}"
    
    # Git operations
    echo -e "\n${BLUE}Pushing to GitHub...${NC}"
    git add -A
    git commit -m "🚀 Deploy v$CURRENT_VERSION - Version verified on live site" || echo "No changes"
    git push origin main || echo "Push failed"
    git tag -a "v$CURRENT_VERSION" -m "Release v$CURRENT_VERSION" || echo "Tag exists"
    git push origin "v$CURRENT_VERSION" || echo "Tag push failed"
else
    echo -e "${RED}❌ FAILED! Version mismatch!${NC}"
    echo -e "${RED}Expected: v$CURRENT_VERSION${NC}"
    echo -e "${RED}Live: v$LIVE_VERSION${NC}"
    exit 1
fi