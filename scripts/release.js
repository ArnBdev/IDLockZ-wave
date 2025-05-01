'use strict';

const fs = require('fs').promises;
const path = require('path');
const { execSync } = require('child_process');
const { generateAssets, verifyAssets } = require('./store-assets');
const { optimizeImages } = require('./optimize-images');

const REQUIRED_COVERAGE = 80;
const MIN_FILES = ['README.md', '.homeychangelog.json', 'app.json'];

async function release() {
    console.log('🚀 Starting release process...');
    const errors = [];
    const warnings = [];

    try {
        // 1. Environment Check
        console.log('\n📋 Checking environment...');
        await checkEnvironment();

        // 2. Code Quality
        console.log('\n🧪 Checking code quality...');
        await checkCodeQuality(errors, warnings);

        // 3. Documentation
        console.log('\n📚 Verifying documentation...');
        await checkDocumentation(errors, warnings);

        // 4. Assets
        console.log('\n🎨 Preparing store assets...');
        await prepareAssets(errors, warnings);

        // 5. Version Check
        console.log('\n📦 Checking version consistency...');
        await checkVersions(errors, warnings);

        // Report Results
        reportResults(errors, warnings);

        if (errors.length === 0) {
            console.log('\n✨ Release preparation complete!');
            console.log('\nNext steps:');
            console.log('1. Review warnings (if any)');
            console.log('2. Run final manual checks');
            console.log('3. Execute: npm run release');
        } else {
            console.error('\n❌ Release preparation failed!');
            process.exit(1);
        }
    } catch (error) {
        console.error('\n❌ Release process failed:', error);
        process.exit(1);
    }
}

async function checkEnvironment() {
    // Check Node version
    const nodeVersion = process.version;
    if (!nodeVersion.startsWith('v18')) {
        throw new Error(`Node version 18 required, found ${nodeVersion}`);
    }

    // Check git status
    const status = execSync('git status --porcelain').toString();
    if (status !== '') {
        throw new Error('Working directory not clean. Commit or stash changes.');
    }

    // Check npm
    execSync('npm --version');
}

async function checkCodeQuality(errors, warnings) {
    try {
        // Run tests
        execSync('npm test', { stdio: 'inherit' });
        
        // Check coverage
        const coverage = JSON.parse(await fs.readFile('coverage/coverage-summary.json'));
        const totalCoverage = coverage.total.lines.pct;
        if (totalCoverage < REQUIRED_COVERAGE) {
            errors.push(`Test coverage ${totalCoverage}% below required ${REQUIRED_COVERAGE}%`);
        }

        // Check for debug logs
        const debugLogs = execSync('grep -r "console.log" drivers/').toString();
        if (debugLogs) {
            warnings.push('Debug logs found in code');
        }

        // Validate code
        execSync('npm run validate', { stdio: 'inherit' });
    } catch (error) {
        errors.push(`Code quality checks failed: ${error.message}`);
    }
}

async function checkDocumentation(errors, warnings) {
    for (const file of MIN_FILES) {
        try {
            await fs.access(file);
            const stats = await fs.stat(file);
            if (stats.size === 0) {
                errors.push(`${file} is empty`);
            }
        } catch {
            errors.push(`${file} missing`);
        }
    }

    // Check translations
    const locales = await fs.readdir('locales');
    if (!locales.includes('en.json')) {
        errors.push('English translations missing');
    }
}

async function prepareAssets(errors, warnings) {
    try {
        // Generate screenshots
        await generateAssets();
        
        // Optimize images
        await optimizeImages();
        
        // Verify assets
        await verifyAssets();
    } catch (error) {
        errors.push(`Asset preparation failed: ${error.message}`);
    }
}

async function checkVersions(errors, warnings) {
    // Read versions from different files
    const pkg = JSON.parse(await fs.readFile('package.json'));
    const app = JSON.parse(await fs.readFile('app.json'));
    
    // Compare versions
    if (pkg.version !== app.version) {
        errors.push(`Version mismatch: package.json (${pkg.version}) != app.json (${app.version})`);
    }

    // Check changelog
    try {
        const changelog = JSON.parse(await fs.readFile('.homeychangelog.json'));
        if (!changelog[pkg.version]) {
            warnings.push(`No changelog entry for version ${pkg.version}`);
        }
    } catch {
        errors.push('Missing or invalid changelog');
    }
}

function reportResults(errors, warnings) {
    console.log('\n📝 Release Check Results:');
    
    if (warnings.length > 0) {
        console.log('\n⚠️ Warnings:');
        warnings.forEach(w => console.log(`- ${w}`));
    }

    if (errors.length > 0) {
        console.log('\n❌ Errors:');
        errors.forEach(e => console.log(`- ${e}`));
    }
}

// Run if called directly
if (require.main === module) {
    release().catch(error => {
        console.error('Release preparation failed:', error);
        process.exit(1);
    });
}

module.exports = {
    release,
    checkVersions,
    checkCodeQuality
};
