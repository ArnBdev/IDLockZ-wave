const fs = require('fs');
const path = require('path');

// Create required directories
const dirs = [
    'assets/images',
    'drivers/IDLock150/assets/images',
    'drivers/IDLock150/assets',
    'locales'
];

// SVG content for learn mode icon
const learnmodeSvg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="240" height="240" version="1.1" viewBox="0 0 240 240" xmlns="http://www.w3.org/2000/svg">
 <rect x="60" y="40" width="120" height="160" rx="10" fill="#000"/>
 <rect x="70" y="50" width="100" height="30" rx="5" fill="#fff"/>
 <circle cx="120" cy="140" r="30" fill="#fff"/>
 <path d="m115 130h10v20h-10z" fill="#000"/>
 <path d="m105 140h30v10h-30z" fill="#000"/>
 <text x="120" y="70" text-anchor="middle" fill="#000" font-family="sans-serif" font-size="20">ID Lock</text>
 <circle cx="180" cy="60" r="40" fill="#4CAF50" opacity="0.7"/>
 <path d="m165 60 10 10 20-20" stroke="#fff" stroke-width="4" fill="none"/>
</svg>`;

console.log('Setting up ID Lock app directory structure...');

dirs.forEach(dir => {
    const fullPath = path.join(__dirname, dir);
    if (!fs.existsSync(fullPath)) {
        console.log(`Creating directory: ${dir}`);
        fs.mkdirSync(fullPath, { recursive: true });
    }
});

// Create placeholder images if they don't exist
const imagePlaceholders = [
    'assets/images/large.png',
    'assets/images/small.png',
    'drivers/IDLock150/assets/images/large.png',
    'drivers/IDLock150/assets/images/small.png'
];

imagePlaceholders.forEach(img => {
    const fullPath = path.join(__dirname, img);
    if (!fs.existsSync(fullPath)) {
        console.log(`Creating placeholder image: ${img}`);
        // Create an empty file as placeholder
        fs.writeFileSync(fullPath, '');
    }
});

// Create learnmode.svg
const learnmodePath = path.join(__dirname, 'drivers', 'IDLock150', 'assets', 'learnmode.svg');
fs.writeFileSync(learnmodePath, learnmodeSvg);
console.log('Created learnmode.svg');

console.log('\nSetup complete! Please:');
console.log('1. Add proper app icons to assets/images/');
console.log('2. Add device icons to drivers/IDLock150/assets/images/');
console.log('3. Run npm install');
console.log('4. Run homey app run\n');
