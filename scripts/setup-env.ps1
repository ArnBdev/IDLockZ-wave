# PowerShell script to set up Node environment
Write-Host "Setting up Node.js environment..." -ForegroundColor Green

# Check for NVM
if (-not (Get-Command nvm -ErrorAction SilentlyContinue)) {
    Write-Host "NVM not found. Please install NVM first." -ForegroundColor Red
    exit 1
}

# Install and use Node 18
Write-Host "Installing Node.js 18.0.0..." -ForegroundColor Yellow
nvm install 18.0.0
if ($LASTEXITCODE -ne 0) {
    Write-Host "Failed to install Node.js 18.0.0" -ForegroundColor Red
    exit 1
}

nvm use 18.0.0
if ($LASTEXITCODE -ne 0) {
    Write-Host "Failed to switch to Node.js 18.0.0" -ForegroundColor Red
    exit 1
}

# Set environment variables
Write-Host "Setting environment variables..." -ForegroundColor Yellow
$env:NODE_ENV = "test"
$env:HOMEY_VERSION = "2.0.0"

# Clean project
Write-Host "Cleaning project..." -ForegroundColor Yellow
node clean.js
if ($LASTEXITCODE -ne 0) {
    Write-Host "Failed to clean project" -ForegroundColor Red
    exit 1
}

# Install dependencies
Write-Host "Installing dependencies..." -ForegroundColor Yellow
npm cache clean --force
npm install --no-optional --legacy-peer-deps
if ($LASTEXITCODE -ne 0) {
    Write-Host "Failed to install dependencies" -ForegroundColor Red
    exit 1
}

# Verify setup
Write-Host "Verifying setup..." -ForegroundColor Yellow
npm run verify
if ($LASTEXITCODE -ne 0) {
    Write-Host "Verification failed" -ForegroundColor Red
    exit 1
}

Write-Host "`nSetup complete!" -ForegroundColor Green
Write-Host "Node version: $(node -v)"
Write-Host "NPM version: $(npm -v)"
