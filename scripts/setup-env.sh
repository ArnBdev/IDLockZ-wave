#!/bin/bash
set -e # Exit on error

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}Setting up Node.js environment...${NC}"

# Check for NVM
if ! command -v nvm &> /dev/null; then
    echo -e "${RED}NVM not found. Please install NVM first.${NC}"
    exit 1
fi

# Install and use Node 18
echo -e "${YELLOW}Installing Node.js 18.0.0...${NC}"
nvm install 18.0.0 || {
    echo -e "${RED}Failed to install Node.js 18.0.0${NC}"
    exit 1
}

nvm use 18.0.0 || {
    echo -e "${RED}Failed to switch to Node.js 18.0.0${NC}"
    exit 1
}

# Set environment variables
echo -e "${YELLOW}Setting environment variables...${NC}"
export NODE_ENV=test
export HOMEY_VERSION=2.0.0

# Clean project
echo -e "${YELLOW}Cleaning project...${NC}"
node clean.js || {
    echo -e "${RED}Failed to clean project${NC}"
    exit 1
}

# Install dependencies
echo -e "${YELLOW}Installing dependencies...${NC}"
npm cache clean --force
npm install --no-optional --legacy-peer-deps || {
    echo -e "${RED}Failed to install dependencies${NC}"
    exit 1
}

# Verify setup
echo -e "${YELLOW}Verifying setup...${NC}"
npm run verify || {
    echo -e "${RED}Verification failed${NC}"
    exit 1
}

echo -e "\n${GREEN}Setup complete!${NC}"
echo "Node version: $(node -v)"
echo "NPM version: $(npm -v)"
