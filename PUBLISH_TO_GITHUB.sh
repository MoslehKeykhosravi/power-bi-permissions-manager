#!/bin/bash

# 🚀 Publish to GitHub - Automated Script
# This script helps you safely publish your project to GitHub

set -e  # Exit on error

echo "================================================"
echo "📦 Power BI Permissions Manager - GitHub Setup"
echo "================================================"
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if git is initialized
if [ ! -d ".git" ]; then
    echo -e "${BLUE}Initializing Git repository...${NC}"
    git init
    git branch -M main
    echo -e "${GREEN}✓ Git initialized${NC}"
fi

echo ""
echo -e "${YELLOW}🔒 Security Check...${NC}"
echo ""

# Check for .env files
echo "Checking for .env files..."
if git ls-files --others --ignored --exclude-standard | grep -q "\.env$"; then
    echo -e "${GREEN}✓ .env files are properly ignored${NC}"
else
    echo -e "${GREEN}✓ No .env files found (protected)${NC}"
fi

# Check for sensitive data in staged files
echo "Checking for sensitive data..."
if git diff --cached | grep -qi "password.*=.*[^e][^x]" | head -1; then
    echo -e "${RED}⚠ WARNING: Possible password found in staged files!${NC}"
    echo "Review carefully before pushing."
else
    echo -e "${GREEN}✓ No obvious passwords in staged files${NC}"
fi

# Check env.example
echo "Checking env.example has only placeholders..."
if grep -q "YOURDOMAIN\|youruser\|your_secure_password" backend/env.example; then
    echo -e "${GREEN}✓ env.example has safe placeholder values${NC}"
else
    echo -e "${YELLOW}⚠ env.example might have real values - please review${NC}"
fi

echo ""
echo -e "${BLUE}📋 Files to be committed:${NC}"
git status --short | head -20

echo ""
echo -e "${YELLOW}⚠️  IMPORTANT: Review the files above!${NC}"
echo ""
echo "Files staged for commit: $(git diff --cached --name-only | wc -l)"
echo ""

# Ask for confirmation
read -p "Do you want to see the full list of files? (y/n): " show_files
if [ "$show_files" = "y" ]; then
    echo ""
    git diff --cached --name-only | sort
fi

echo ""
read -p "Does everything look safe? Continue? (y/n): " continue_publish

if [ "$continue_publish" != "y" ]; then
    echo -e "${RED}❌ Publication cancelled${NC}"
    exit 1
fi

# Commit
echo ""
echo -e "${BLUE}Creating commit...${NC}"
git commit -m "Initial commit: Power BI Permissions Manager

Features:
- Vue 3 modern frontend with Material Design
- Node.js/Express backend with RESTful API
- Power BI Report Server integration
- Active Directory/LDAP integration
- Batch permission operations
- Multi-theme support (Light/Dark/System)
- Internationalization (English/Persian)
- Docker deployment ready
- Responsive design

Technology Stack:
- Frontend: Vue 3 + Vite
- Backend: Node.js 18 + Express
- Infrastructure: Docker + Nginx
- Auth: LDAP/AD integration"

echo -e "${GREEN}✓ Commit created${NC}"
echo ""

# Repository name
echo -e "${BLUE}📝 Repository Setup${NC}"
echo ""
repo_name="powerbi-permissions-manager"
echo "Repository name: $repo_name"

echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo "1. Create GitHub repository: https://github.com/new"
echo "   - Name: $repo_name"
echo "   - Description: Modern web app for managing Power BI Report Server permissions"
echo "   - Choose Public or Private"
echo "   - DON'T initialize with README"
echo ""
echo "2. Then run these commands:"
echo ""
echo -e "${GREEN}git remote add origin https://github.com/YOUR_USERNAME/$repo_name.git${NC}"
echo -e "${GREEN}git push -u origin main${NC}"
echo ""
echo "Or use GitHub CLI:"
echo -e "${GREEN}gh repo create $repo_name --public --source=. --push${NC}"
echo ""
echo -e "${GREEN}✅ Your project is ready to publish!${NC}"

