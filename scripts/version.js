'use strict';

const fs = require('fs').promises;
const path = require('path');
const semver = require('semver');
const { execSync } = require('child_process');

// Files that need version updates
const VERSION_FILES = [
    'package.json',
    'app.json',
    '.homeychangelog.json'
];

async function updateVersion(type = 'patch') {
    console.log('📦 Starting version update...');
    
    try {
        // 1. Read current version
        const currentVersion = await getCurrentVersion();
        console.log(`Current version: ${currentVersion}`);

        // 2. Calculate new version
        const newVersion = semver.inc(currentVersion, type);
        if (!newVersion) {
            throw new Error('Invalid version increment type');
        }
        console.log(`New version: ${newVersion}`);

        // 3. Update files
        await updateFiles(newVersion);

        // 4. Create changelog entry
        await createChangelogEntry(newVersion);

        // 5. Create git tag
        createGitTag(newVersion);

        console.log('✨ Version update complete!');
        return newVersion;
    } catch (error) {
        console.error('❌ Version update failed:', error);
        process.exit(1);
    }
}

async function getCurrentVersion() {
    const pkg = JSON.parse(await fs.readFile('package.json'));
    return pkg.version;
}

async function updateFiles(version) {
    for (const file of VERSION_FILES) {
        console.log(`📝 Updating ${file}...`);
        
        const content = JSON.parse(await fs.readFile(file));
        
        switch (file) {
            case 'package.json':
            case 'app.json':
                content.version = version;
                break;
            
            case '.homeychangelog.json':
                if (!content[version]) {
                    content[version] = {
                        en: 'New version',
                        no: 'Ny versjon'
                    };
                }
                break;
        }
        
        await fs.writeFile(file, JSON.stringify(content, null, 2));
    }
}

async function createChangelogEntry(version) {
    console.log('📝 Creating changelog entry...');
    
    const changelog = JSON.parse(await fs.readFile('.homeychangelog.json'));
    
    if (!changelog[version]) {
        // Get git log since last tag
        const lastTag = execSync('git describe --tags --abbrev=0').toString().trim();
        const changes = execSync(`git log ${lastTag}..HEAD --pretty=format:%s`).toString();
        
        // Create changelog entry
        changelog[version] = {
            en: formatChangelog(changes, 'en'),
            no: formatChangelog(changes, 'no')
        };
        
        await fs.writeFile('.homeychangelog.json', JSON.stringify(changelog, null, 2));
    }
}

function formatChangelog(changes, locale) {
    const lines = changes.split('\n')
        .map(line => line.trim())
        .filter(line => line && !line.startsWith('Merge'))
        .map(line => `- ${line}`);
    
    if (lines.length === 0) {
        return locale === 'en' ? 'Various improvements and bug fixes' : 'Diverse forbedringer og feilrettinger';
    }
    
    return lines.join('\n');
}

function createGitTag(version) {
    console.log('🏷️ Creating git tag...');
    
    // Add changes
    execSync('git add .');
    
    // Commit version update
    execSync(`git commit -m "chore: bump version to ${version}"`);
    
    // Create tag
    execSync(`git tag -a v${version} -m "Version ${version}"`);
}

// Command line interface
if (require.main === module) {
    const type = process.argv[2] || 'patch';
    if (!['major', 'minor', 'patch'].includes(type)) {
        console.error('❌ Invalid version type. Use: major, minor, or patch');
        process.exit(1);
    }
    
    updateVersion(type).catch(error => {
        console.error('Version update failed:', error);
        process.exit(1);
    });
}

module.exports = {
    updateVersion,
    getCurrentVersion
};
