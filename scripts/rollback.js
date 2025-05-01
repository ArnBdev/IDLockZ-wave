'use strict';

const fs = require('fs').promises;
const path = require('path');
const { execSync } = require('child_process');
const { getCurrentVersion } = require('./version');

async function rollback(steps = 1) {
    console.log('🔄 Starting rollback process...');
    
    try {
        // 1. Get current version
        const currentVersion = await getCurrentVersion();
        console.log(`Current version: ${currentVersion}`);

        // 2. Get available tags
        const tags = getTags();
        const currentIndex = tags.indexOf(`v${currentVersion}`);
        
        if (currentIndex === -1) {
            throw new Error('Current version not found in git tags');
        }

        // 3. Calculate target version
        const targetIndex = currentIndex + steps;
        if (targetIndex >= tags.length) {
            throw new Error('Cannot rollback: no earlier version available');
        }

        const targetTag = tags[targetIndex];
        console.log(`Rolling back to: ${targetTag}`);

        // 4. Confirm action
        await confirmRollback(currentVersion, targetTag);

        // 5. Perform rollback
        await performRollback(targetTag);

        console.log('✨ Rollback complete!');
    } catch (error) {
        console.error('❌ Rollback failed:', error);
        process.exit(1);
    }
}

function getTags() {
    return execSync('git tag --sort=committerdate')
        .toString()
        .trim()
        .split('\n')
        .reverse(); // Most recent first
}

async function confirmRollback(current, target) {
    console.log('\n⚠️ WARNING: This will reset to a previous version');
    console.log('The following changes will occur:');
    console.log(`- Current version (${current}) will be archived`);
    console.log(`- Code will be reset to ${target}`);
    console.log('- All uncommitted changes will be lost');
    
    if (process.env.NODE_ENV !== 'test') {
        console.log('\nPress Ctrl+C to cancel or wait 10 seconds to continue...');
        await new Promise(resolve => setTimeout(resolve, 10000));
    }
}

async function performRollback(targetTag) {
    try {
        // 1. Create backup branch
        const backupBranch = `backup-${Date.now()}`;
        execSync(`git checkout -b ${backupBranch}`);
        console.log(`📦 Created backup branch: ${backupBranch}`);

        // 2. Checkout target version
        execSync(`git checkout ${targetTag}`);

        // 3. Update version files
        await updateVersionFiles(targetTag);

        // 4. Build app
        console.log('🔨 Building app...');
        execSync('npm run build');

        // 5. Create restoration instructions
        await createRestoreGuide(backupBranch, targetTag);

        console.log(`\n✅ Successfully rolled back to ${targetTag}`);
        console.log(`Backup branch created: ${backupBranch}`);
    } catch (error) {
        // Attempt to restore original state
        console.error('🔥 Rollback failed, attempting to restore original state...');
        execSync('git checkout main');
        throw error;
    }
}

async function updateVersionFiles(tag) {
    const version = tag.replace('v', '');
    const files = ['package.json', 'app.json'];

    for (const file of files) {
        const content = JSON.parse(await fs.readFile(file));
        content.version = version;
        await fs.writeFile(file, JSON.stringify(content, null, 2));
    }

    // Add rollback note to changelog
    const changelog = JSON.parse(await fs.readFile('.homeychangelog.json'));
    changelog[version] = {
        en: `Rollback to version ${version}`,
        no: `Tilbakestilling til versjon ${version}`
    };
    await fs.writeFile('.homeychangelog.json', JSON.stringify(changelog, null, 2));
}

async function createRestoreGuide(backupBranch, targetTag) {
    const guide = `# Rollback Recovery Guide

## Current State
- Rolled back to: ${targetTag}
- Backup branch: ${backupBranch}
- Timestamp: ${new Date().toISOString()}

## To Restore Previous Version
\`\`\`bash
# Switch to backup branch
git checkout ${backupBranch}

# Create new branch for fixes
git checkout -b fix-version

# Make necessary changes
# Test thoroughly
# Then merge back to main
\`\`\`

## Emergency Contact
- Email: support@idlock.no
- Phone: +47 XXX XX XXX
`;

    await fs.writeFile('ROLLBACK_GUIDE.md', guide);
    console.log('📝 Created restoration guide: ROLLBACK_GUIDE.md');
}

// Command line interface
if (require.main === module) {
    const steps = parseInt(process.argv[2]) || 1;
    if (isNaN(steps) || steps < 1) {
        console.error('❌ Invalid steps number. Use a positive integer.');
        process.exit(1);
    }
    
    rollback(steps).catch(error => {
        console.error('Rollback failed:', error);
        process.exit(1);
    });
}

module.exports = {
    rollback,
    getTags,
    performRollback
};
