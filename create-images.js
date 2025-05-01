const fs = require('fs');
const { createCanvas } = require('canvas');
const path = require('path');

// Create placeholder images for both sizes
const sizes = {
    small: 250,
    large: 500
};

console.log('Creating placeholder images...');

// Function to create a simple placeholder image
async function createPlaceholderImage(size, filePath) {
    const canvas = createCanvas(size, size);
    const ctx = canvas.getContext('2d');

    // Fill background
    ctx.fillStyle = '#f5f5f5';
    ctx.fillRect(0, 0, size, size);

    // Draw border
    ctx.strokeStyle = '#cccccc';
    ctx.lineWidth = size * 0.02;
    ctx.strokeRect(size * 0.1, size * 0.1, size * 0.8, size * 0.8);

    // Add text
    ctx.fillStyle = '#666666';
    ctx.font = `${size * 0.1}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('ID Lock', size * 0.5, size * 0.4);
    ctx.fillText(`${size}x${size}`, size * 0.5, size * 0.6);

    // Ensure directory exists
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }

    // Save image
    const buffer = canvas.toBuffer('image/png');
    fs.writeFileSync(filePath, buffer);
    console.log(`Created: ${filePath}`);
}

// Create SVG icon content
const svgIcons = {
    autolock: `<?xml version="1.0" encoding="UTF-8"?>
<svg width="24" height="24" viewBox="0 0 24 24">
    <path d="M12 1.5c-3.9 0-7 3.1-7 7V10H4v12h16V10h-1V8.5c0-3.9-3.1-7-7-7zm0 2c2.8 0 5 2.2 5 5V10H7V8.5c0-2.8 2.2-5 5-5z"/>
    <path d="M12 13c1.1 0 2 .9 2 2 0 .7-.4 1.4-1 1.7V19h-2v-2.3c-.6-.3-1-1-1-1.7 0-1.1.9-2 2-2z"/>
</svg>`,
    timer: `<?xml version="1.0" encoding="UTF-8"?>
<svg width="24" height="24" viewBox="0 0 24 24">
    <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm0 2c4.4 0 8 3.6 8 8s-3.6 8-8 8-8-3.6-8-8 3.6-8 8-8z"/>
    <path d="M12 6v6l4 4" stroke="#000" stroke-width="2" fill="none" stroke-linecap="round"/>
</svg>`,
    away: `<?xml version="1.0" encoding="UTF-8"?>
<svg width="24" height="24" viewBox="0 0 24 24">
    <path d="M12 3L2 12h3v8h6v-6h2v6h6v-8h3L12 3zm0 2.5l6 5.5h-1v8h-3v-6H10v6H7v-8H6l6-5.5z"/>
</svg>`,
    pin: `<?xml version="1.0" encoding="UTF-8"?>
<svg width="24" height="24" viewBox="0 0 24 24">
    <path d="M12 2C8.7 2 6 4.7 6 8v2H5v10h14V10h-1V8c0-3.3-2.7-6-6-6zm0 2c2.2 0 4 1.8 4 4v2H8V8c0-2.2 1.8-4 4-4z"/>
    <circle cx="12" cy="15" r="2"/>
</svg>`
};

// Function to create SVG icon
function createSvgIcon(name, content) {
    const filePath = `assets/${name}.svg`;
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(filePath, content);
    console.log(`Created: ${filePath}`);
}

// Create app images
Object.entries(sizes).forEach(([type, size]) => {
    const appPath = `assets/images/${type}.png`;
    const driverPath = `drivers/IDLock150/assets/images/${type}.png`;

    // Create images
    createPlaceholderImage(size, appPath);
    createPlaceholderImage(size, driverPath);
});

// Create SVG icons
Object.entries(svgIcons).forEach(([name, content]) => {
    createSvgIcon(name, content);
});

console.log('\nImage creation complete!');
console.log('Remember to replace placeholder images with actual product images before publishing.');
