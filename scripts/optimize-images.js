'use strict';

const fs = require('fs').promises;
const path = require('path');
const sharp = require('sharp');
const { execSync } = require('child_process');

const STORE_DIR = path.join(__dirname, '../assets/store');
const SIZES = {
    'app-screen-1.png': { width: 1024, height: 768 },
    'app-screen-2.png': { width: 1024, height: 768 },
    'app-screen-3.png': { width: 1024, height: 768 },
    'app-screen-4.png': { width: 1024, height: 768 },
    'icon.png': { width: 512, height: 512 },
    'promo.png': { width: 1500, height: 500 }
};

async function optimizeImages() {
    console.log('🎨 Optimizing store assets...');

    try {
        // Install sharp if not present
        try {
            require.resolve('sharp');
        } catch (e) {
            console.log('📦 Installing sharp package...');
            execSync('npm install --save-dev sharp');
        }

        // Ensure store directory exists
        await fs.mkdir(STORE_DIR, { recursive: true });

        // Process each image
        const files = await fs.readdir(STORE_DIR);
        for (const file of files) {
            if (file.endsWith('.png')) {
                await optimizeImage(file);
            }
        }

        console.log('✨ Image optimization complete!');
    } catch (error) {
        console.error('❌ Error optimizing images:', error);
        process.exit(1);
    }
}

async function optimizeImage(filename) {
    const filepath = path.join(STORE_DIR, filename);
    const specs = SIZES[filename];

    if (!specs) {
        console.log(`⚠️ No optimization specs for ${filename}, skipping...`);
        return;
    }

    console.log(`🖼️ Optimizing ${filename}...`);

    try {
        const image = sharp(filepath);
        const metadata = await image.metadata();

        // Create optimized version
        const optimized = image
            .resize(specs.width, specs.height, {
                fit: 'contain',
                background: { r: 255, g: 255, b: 255, alpha: 1 }
            })
            .png({
                quality: 90,
                compressionLevel: 9,
                palette: true
            });

        // Get original size
        const originalSize = (await fs.stat(filepath)).size;

        // Save optimized version
        const tempPath = filepath + '.temp';
        await optimized.toFile(tempPath);
        const newSize = (await fs.stat(tempPath)).size;

        // Replace if smaller
        if (newSize < originalSize) {
            await fs.rename(tempPath, filepath);
            console.log(`✅ ${filename}: ${formatBytes(originalSize)} → ${formatBytes(newSize)}`);
        } else {
            await fs.unlink(tempPath);
            console.log(`ℹ️ ${filename}: Already optimized`);
        }
    } catch (error) {
        console.error(`❌ Error optimizing ${filename}:`, error);
    }
}

function formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Run if called directly
if (require.main === module) {
    optimizeImages().catch(error => {
        console.error('❌ Unexpected error:', error);
        process.exit(1);
    });
}

module.exports = {
    optimizeImages,
    SIZES
};
