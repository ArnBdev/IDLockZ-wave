'use strict';

const { createCanvas, loadImage } = require('canvas');
const fs = require('fs').promises;
const path = require('path');

async function generateScreenshots() {
    const outputDir = path.join(__dirname, '../assets/store');
    await fs.mkdir(outputDir, { recursive: true });

    console.log('Generating screenshots...');
    
    try {
        // Screenshot 1: Main Interface
        console.log('Creating main interface...');
        const mainScreen = await generateMainInterface();
        await saveScreenshot(mainScreen, 'app-screen-1.png');

        // Screenshot 2: Settings Panel
        console.log('Creating settings panel...');
        const settingsScreen = await generateSettingsPanel();
        await saveScreenshot(settingsScreen, 'app-screen-2.png');

        // Screenshot 3: Flow Management
        console.log('Creating flow panel...');
        const flowScreen = await generateFlowPanel();
        await saveScreenshot(flowScreen, 'app-screen-3.png');

        // Screenshot 4: User Management
        console.log('Creating user panel...');
        const userScreen = await generateUserPanel();
        await saveScreenshot(userScreen, 'app-screen-4.png');

        console.log('Screenshots generated successfully!');
    } catch (error) {
        console.error('Error generating screenshots:', error);
        process.exit(1);
    }
}

async function generateMainInterface() {
    const canvas = createCanvas(1024, 768);
    const ctx = canvas.getContext('2d');

    // Background
    ctx.fillStyle = '#f5f6fa';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Header
    ctx.fillStyle = '#14171a';
    ctx.fillRect(0, 0, canvas.width, 60);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 20px Arial';
    ctx.fillText('ID Lock 150', 20, 38);
    
    // Lock status
    await drawLockStatus(ctx, 'Locked', true);
    
    // Battery indicator
    await drawBatteryLevel(ctx, 85);
    
    // Quick actions
    await drawQuickActions(ctx);

    // Status info
    drawStatusInfo(ctx);

    return canvas;
}

async function generateSettingsPanel() {
    const canvas = createCanvas(1024, 768);
    const ctx = canvas.getContext('2d');

    // Background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Header
    ctx.fillStyle = '#14171a';
    ctx.fillRect(0, 0, canvas.width, 60);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 20px Arial';
    ctx.fillText('Settings', 20, 38);

    // Settings sections
    await drawSettingsSections(ctx);

    return canvas;
}

async function generateFlowPanel() {
    const canvas = createCanvas(1024, 768);
    const ctx = canvas.getContext('2d');

    // Background
    ctx.fillStyle = '#f8f9fb';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Header
    ctx.fillStyle = '#14171a';
    ctx.fillRect(0, 0, canvas.width, 60);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 20px Arial';
    ctx.fillText('Flow Cards', 20, 38);

    // Flow card examples
    await drawFlowCards(ctx);

    return canvas;
}

async function generateUserPanel() {
    const canvas = createCanvas(1024, 768);
    const ctx = canvas.getContext('2d');

    // Background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Header
    ctx.fillStyle = '#14171a';
    ctx.fillRect(0, 0, canvas.width, 60);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 20px Arial';
    ctx.fillText('User Management', 20, 38);

    // User management interface
    await drawUserManagement(ctx);

    return canvas;
}

async function drawSettingsSections(ctx) {
    const sections = [
        { title: 'Auto-lock Settings', items: ['Enable auto-lock', 'Lock delay: 30 seconds', 'Sound feedback'] },
        { title: 'Security', items: ['Away mode', 'Require PIN for manual unlock', 'Guest access'] },
        { title: 'Notifications', items: ['Battery alerts', 'Failed access attempts', 'Door state changes'] }
    ];

    let yOffset = 80;
    sections.forEach(section => {
        // Section title
        ctx.font = 'bold 18px Arial';
        ctx.fillStyle = '#000000';
        ctx.fillText(section.title, 20, yOffset);

        // Section items
        ctx.font = '16px Arial';
        section.items.forEach((item, index) => {
            yOffset += 40;
            ctx.fillText(item, 40, yOffset);
        });
        yOffset += 60;
    });
}

async function drawFlowCards(ctx) {
    const cards = [
        { type: 'Trigger', title: 'When door is locked' },
        { type: 'Condition', title: 'Door is locked' },
        { type: 'Action', title: 'Lock the door' }
    ];

    let yOffset = 80;
    cards.forEach(card => {
        // Card background
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(20, yOffset, 300, 100);
        ctx.strokeStyle = '#e1e1e1';
        ctx.strokeRect(20, yOffset, 300, 100);

        // Card content
        ctx.font = 'bold 14px Arial';
        ctx.fillStyle = '#666666';
        ctx.fillText(card.type, 35, yOffset + 25);
        
        ctx.font = '16px Arial';
        ctx.fillStyle = '#000000';
        ctx.fillText(card.title, 35, yOffset + 55);

        yOffset += 120;
    });
}

async function drawUserManagement(ctx) {
    // User slots
    const users = [
        { slot: 1, name: 'Master Code', type: 'PIN' },
        { slot: 2, name: 'Daily User', type: 'PIN' },
        { slot: 3, name: 'Guest Access', type: 'Temporary' }
    ];

    let yOffset = 80;
    users.forEach(user => {
        // User entry background
        ctx.fillStyle = '#f8f9fb';
        ctx.fillRect(20, yOffset, 400, 60);

        // User info
        ctx.font = 'bold 16px Arial';
        ctx.fillStyle = '#000000';
        ctx.fillText(`Slot ${user.slot}: ${user.name}`, 35, yOffset + 25);
        
        ctx.font = '14px Arial';
        ctx.fillStyle = '#666666';
        ctx.fillText(`Type: ${user.type}`, 35, yOffset + 45);

        yOffset += 70;
    });
}

function drawStatusInfo(ctx) {
    const info = [
        'Last action: Auto-locked at 15:30',
        'Network: Connected',
        'Signal strength: Good',
        'Firmware: v2.0.1'
    ];

    ctx.font = '14px Arial';
    ctx.fillStyle = '#666666';
    
    let yOffset = 400;
    info.forEach(line => {
        ctx.fillText(line, 20, yOffset);
        yOffset += 25;
    });
}

async function saveScreenshot(canvas, filename) {
    const buffer = canvas.toBuffer('image/png');
    const outputPath = path.join(__dirname, '../assets/store', filename);
    await fs.writeFile(outputPath, buffer);
    console.log(`Saved ${filename}`);
}

// Run generator
console.log('Starting screenshot generation...');
generateScreenshots().catch(error => {
    console.error('Screenshot generation failed:', error);
    process.exit(1);
});
