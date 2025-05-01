'use strict';

const fs = require('fs');
const path = require('path');
const { promisify } = require('util');
const rimraf = promisify(require('rimraf'));

// Directories to clean
const cleanDirs = [
    'node_modules',
    '.homeybuild',
    'coverage',
    'build',
    'dist'
];

// Files to remove
const cleanFiles = [
    'npm-debug.log',
    'yarn-debug.log',
    'yarn-error.log'
];

async function clean() {
    console.log('Cleaning project directories...\n');

    // Remove directories
    for (const dir of cleanDirs) {
        try {
            await rimraf(path.join(__dirname, dir));
            console.log(`✓ Removed directory: ${dir}`);
        } catch (err) {
            if (err.code !== 'ENOENT') {
                console.error(`Error removing ${dir}:`, err.message);
            }
        }
    }

    // Remove files
    for (const file of cleanFiles) {
        try {
            await fs.promises.unlink(path.join(__dirname, file));
            console.log(`✓ Removed file: ${file}`);
        } catch (err) {
            if (err.code !== 'ENOENT') {
                console.error(`Error removing ${file}:`, err.message);
            }
        }
    }

    console.log('\nNext steps:');
    console.log('1. nvm install 18.0.0');
    console.log('2. nvm use 18.0.0');
    console.log('3. npm install --no-optional --legacy-peer-deps');
    console.log('4. npm run verify');
}

clean().catch(err => {
    console.error('Clean failed:', err);
    process.exit(1);
});
