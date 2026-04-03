#!/bin/bash

# ==================== FINSIGHT API CI/CD SETUP ====================
# This script helps configure GitHub Actions secrets for CI/CD deployment
# Run this after creating your GitHub repository
# Usage: bash setup-cicd.sh

set -e

echo "🚀 FinSight API CI/CD Setup"
echo "================================"
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check prerequisites
echo "📋 Checking prerequisites..."

if ! command -v gh &> /dev/null; then
    echo -e "${RED}❌ GitHub CLI not found. Install from: https://cli.github.com/${NC}"
    exit 1
fi

if ! gh auth status &> /dev/null; then
    echo -e "${RED}❌ Not authenticated with GitHub. Run: gh auth login${NC}"
    exit 1
fi

echo -e "${GREEN}✅ GitHub CLI authenticated${NC}"
echo ""

# Get repository info
echo "📦 Repository Configuration"
REPO=$(gh repo view --json nameWithOwner -q)
echo "Repository: $REPO"
echo ""

# Generate JWT Secret
echo "🔐 Generating JWT_SECRET..."
JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('base64'))")
echo -e "${GREEN}✅ JWT_SECRET generated${NC}"
echo ""

# Prompt for Render credentials
echo "🎯 Render Configuration"
echo "========================"
echo ""
echo "Get these values from your Render dashboard:"
echo "  - Service ID: https://dashboard.render.com/web/srv-YOUR_ID"
echo "  - API Key: https://dashboard.render.com/account/api-keys"
echo ""

read -p "Enter your Render Service ID (e.g., srv-abc123): " RENDER_SERVICE_ID
read -sp "Enter your Render API Key: " RENDER_API_KEY
echo ""
echo ""

if [ -z "$RENDER_SERVICE_ID" ] || [ -z "$RENDER_API_KEY" ]; then
    echo -e "${RED}❌ Render credentials cannot be empty${NC}"
    exit 1
fi

# Optional: Snyk and Slack
echo "🛡️  Optional Security & Notifications"
echo "======================================"
echo ""

read -p "Do you want to enable Snyk security scanning? (y/n) " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    read -sp "Enter your Snyk API Token (or leave empty to skip): " SNYK_TOKEN
    echo ""
fi

read -p "Do you want to enable Slack notifications? (y/n) " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    read -p "Enter your Slack Webhook URL (or leave empty to skip): " SLACK_WEBHOOK_URL
    echo ""
fi

# Set GitHub Actions Secrets
echo ""
echo "🔑 Setting GitHub Actions Secrets..."
echo "====================================="
echo ""

gh secret set JWT_SECRET -b"$JWT_SECRET" --repo "$REPO"
echo -e "${GREEN}✅ JWT_SECRET set${NC}"

gh secret set RENDER_SERVICE_ID -b"$RENDER_SERVICE_ID" --repo "$REPO"
echo -e "${GREEN}✅ RENDER_SERVICE_ID set${NC}"

gh secret set RENDER_API_KEY -b"$RENDER_API_KEY" --repo "$REPO"
echo -e "${GREEN}✅ RENDER_API_KEY set${NC}"

if [ ! -z "$SNYK_TOKEN" ]; then
    gh secret set SNYK_TOKEN -b"$SNYK_TOKEN" --repo "$REPO"
    echo -e "${GREEN}✅ SNYK_TOKEN set${NC}"
fi

if [ ! -z "$SLACK_WEBHOOK_URL" ]; then
    gh secret set SLACK_WEBHOOK_URL -b"$SLACK_WEBHOOK_URL" --repo "$REPO"
    echo -e "${GREEN}✅ SLACK_WEBHOOK_URL set${NC}"
fi

echo ""
echo -e "${GREEN}✅ All secrets configured!${NC}"
echo ""
echo "📋 Configuration Summary:"
echo "  Repository: $REPO"
echo "  Render Service ID: ${RENDER_SERVICE_ID:0:10}..."
echo "  JWT Secret: ${JWT_SECRET:0:20}..."
echo ""
echo "📚 Next Steps:"
echo "  1. Visit: https://github.com/$REPO/settings/secrets/actions"
echo "  2. Verify all secrets are present"
echo "  3. Make a test push to 'main' branch to trigger pipeline"
echo "  4. Monitor GitHub Actions tab"
echo ""
echo "📖 Documentation: See CI-CD-DEPLOYMENT.md for detailed guide"
echo ""
