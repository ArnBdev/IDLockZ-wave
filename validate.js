const fs = require('fs').promises;
const path = require('path');

const requiredFiles = [
    'app.js',
    'app.json',
    'package.json',
    '.npmrc',
    'assets/images/large.png',
    'assets/images/small.png',
    'assets/autolock.svg',
    'assets/timer.svg',
    'assets/away.svg',
    'assets/pin.svg',
    'drivers/IDLock150/driver.js',
    'drivers/IDLock150/device.js',
    'drivers/IDLock150/assets/images/large.png',
    'drivers/IDLock150/assets/images/small.png',
    'drivers/IDLock150/settings/index.html',
    'drivers/IDLock150/settings/idlockApp.js',
    'locales/en.json',
    'locales/no.json',
    '.homeycompose/app.json',
    '.homeycompose/capabilities/autolock_enabled.json',
    '.homeycompose/capabilities/autolock_time.json',
    '.homeycompose/capabilities/away_mode.json',
    '.homeycompose/capabilities/user_code.json'
];

async function validateApp() {
    console.log('Validating ID Lock app structure...\n');
    let allValid = true;
    let missingFiles = [];

    for (const file of requiredFiles) {
        try {
            await fs.access(file);
            console.log(`✓ Found: ${file}`);
        } catch (error) {
            console.log(`✗ Missing: ${file}`);
            missingFiles.push(file);
            allValid = false;
        }
    }

    console.log('\nValidation complete!');
    if (allValid) {
        console.log('\n✓ All required files are present.');
        console.log('\nNext steps:');
        console.log('1. Run npm install');
        console.log('2. Run homey app validate');
        console.log('3. Run homey app run');
    } else {
        console.log('\n✗ Missing required files:');
        missingFiles.forEach(file => {
            console.log(`  - ${file}`);
        });
        console.log('\nRun these commands to set up missing files:');
        console.log('1. node setup.js');
        console.log('2. node create-images.js');
    }
}

validateApp().catch(console.error);
