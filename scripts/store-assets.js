'use strict';

const fs = require('fs').promises;
const path = require('path');
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

const STORE_DIR = path.join(__dirname, '../assets/store');
const REQUIRED_ASSETS = [
    'app-screen-1.png',
    'app-screen-2.png',
    'app-screen-3.png',
    'app-screen-4.png'
];

async function main() {
    const command = process.argv[2];
    
    switch (command) {
        case 'generate':
            await generateAssets();
            break;
        case 'verify':
            await verifyAssets();
            break;
        case 'clean':
            await cleanAssets();
            break;
        default:
            showHelp();
            break;
    }
}

async function generateAssets() {
    console.log('🎨 Generating store assets...');

    try {
        // Ensure store directory exists
        await fs.mkdir(STORE_DIR, { recursive: true });

        // Generate screenshots
        console.log('📸 Generating screenshots...');
        await execPromise('node scripts/generate-screenshots.js');

        // Verify all assets
        console.log('✅ Verifying assets...');
        await verifyAssets();

        console.log('✨ Store assets generated successfully!');
    } catch (error) {
        console.error('❌ Error generating assets:', error);
        process.exit(1);
    }
}

async function verifyAssets() {
    console.log('🔍 Verifying store assets...');
    const missing = [];

    for (const asset of REQUIRED_ASSETS) {
        const assetPath = path.join(STORE_DIR, asset);
        try {
            await fs.access(assetPath);
            const stats = await fs.stat(assetPath);
            if (stats.size === 0) {
                missing.push(`${asset} (empty file)`);
            }
        } catch (error) {
            missing.push(asset);
        }
    }

    if (missing.length > 0) {
        console.error('❌ Missing required assets:', missing.join(', '));
        process.exit(1);
    }

    console.log('✅ All required assets present and valid');
    return true;
}

async function cleanAssets() {
    console.log('🧹 Cleaning store assets...');

    try {
        await fs.rm(STORE_DIR, { recursive: true, force: true });
        console.log('✨ Store assets cleaned successfully!');
    } catch (error) {
        console.error('❌ Error cleaning assets:', error);
        process.exit(1);
    }
}

function showHelp() {
    console.log(`
📦 Store Assets Manager

Commands:
  generate  Generate all required store assets
  verify    Verify all required assets exist
  clean     Remove all store assets

Usage:
  node store-assets.js <command>

Examples:
  node store-assets.js generate  # Generate all assets
  node store-assets.js verify    # Verify assets
  node store-assets.js clean     # Clean assets
`);
}

// Run if called directly
if (require.main === module) {
    main().catch(error => {
        console.error('❌ Unexpected error:', error);
        process.exit(1);
    });
}

module.exports = {
    generateAssets,
    verifyAssets,
    cleanAssets
};
