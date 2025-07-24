#!/bin/bash
# Quick deployment script with versioning and GitHub push

set -euo pipefail

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}=== CBLIX2 QUICK DEPLOYMENT ===${NC}\n"

# Auto-increment version
echo -e "${GREEN}Incrementing version...${NC}"
OLD_VERSION=$(node -p "require('./package.json').version")
node scripts/auto-version.js
NEW_VERSION=$(node -p "require('./package.json').version")
echo -e "${GREEN}Version: $OLD_VERSION → $NEW_VERSION${NC}\n"

# Build
echo -e "${GREEN}Building project...${NC}"
npm run build:only

# Deploy
echo -e "${GREEN}Deploying to Cloudflare...${NC}"
wrangler pages deploy dist/public --project-name=cblix2

# Wait for propagation
echo -e "${YELLOW}Waiting for deployment to propagate...${NC}"
sleep 10

# Verify deployment
echo -e "${GREEN}Verifying deployment...${NC}"
curl -s https://cblix2.franzai.com | grep -q "CBLIX2" && echo -e "${GREEN}✅ Site is live!${NC}" || echo -e "${YELLOW}⚠️  Site might still be propagating${NC}"

# Run asset verification
echo -e "${GREEN}Verifying assets...${NC}"
bash verify-assets.sh

# Commit and push to GitHub
echo -e "${GREEN}Pushing to GitHub...${NC}"
git add -A
git commit -m "🚀 Deploy v$NEW_VERSION - Auto-deployment" || echo "No changes to commit"
git push origin main || echo "Push failed - check git configuration"
git tag -a "v$NEW_VERSION" -m "Release v$NEW_VERSION" || echo "Tag already exists"
git push origin "v$NEW_VERSION" || echo "Tag push failed"

echo -e "\n${BLUE}=== DEPLOYMENT COMPLETE ===${NC}"
echo -e "${GREEN}✅ Version $NEW_VERSION deployed to https://cblix2.franzai.com${NC}"