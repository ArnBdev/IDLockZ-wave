'use strict';

const fs = require('fs').promises;
const path = require('path');
const { execSync } = require('child_process');
const { release, checkVersions } = require('../scripts/release');
const { updateVersion, getCurrentVersion } = require('../scripts/version');
const { rollback, getTags } = require('../scripts/rollback');
const {
    TEST_FILES,
    TEST_COMMITS,
    VERSION_INCREMENTS,
    ERROR_SCENARIOS,
    TEST_ENVIRONMENTS,
    MOCK_RESPONSES,
    createTestRepo,
    mockGitCommands,
    createChangelog
} = require('./fixtures/release-fixtures');

// Setup test environment
process.env.NODE_ENV = 'test';
jest.setTimeout(30000); // 30 seconds

describe('Release Management Tests', () => {
    let originalCwd;
    let testRepo;

    beforeAll(() => {
        originalCwd = process.cwd();
    });

    beforeEach(async () => {
        // Create test directory
        await fs.mkdir('test-temp', { recursive: true });
        process.chdir('test-temp');

        // Setup test repository
        testRepo = createTestRepo();
        
        // Create test files
        for (const [file, content] of Object.entries(testRepo.files)) {
            await fs.writeFile(file, JSON.stringify(content, null, 2));
        }

        // Initialize git
        execSync('git init');
        execSync('git config user.name "Test User"');
        execSync('git config user.email "test@example.com"');
        execSync('git add .');
        execSync('git commit -m "Initial commit"');
        execSync('git tag v1.0.0');
    });

    afterEach(async () => {
        process.chdir(originalCwd);
        await fs.rm('test-temp', { recursive: true, force: true });
    });

    describe('Version Management', () => {
        test('should get current version', async () => {
            const version = await getCurrentVersion();
            expect(version).toBe('1.0.0');
        });

        Object.entries(VERSION_INCREMENTS).forEach(([type, data]) => {
            test(`should handle ${type} version update`, async () => {
                // Setup test commits
                for (const commit of data.commits) {
                    await fs.appendFile('test.txt', commit + '\n');
                    execSync('git add .');
                    execSync(`git commit -m "${commit}"`);
                }

                await updateVersion(type);
                const newVersion = await getCurrentVersion();
                expect(newVersion).toBe(data.to);

                // Check changelog
                const changelog = JSON.parse(await fs.readFile('.homeychangelog.json'));
                expect(changelog[data.to]).toBeDefined();
            });
        });

        test('should prevent invalid version updates', async () => {
            await expect(updateVersion('invalid')).rejects.toThrow();
        });

        test('should handle merge commits', async () => {
            execSync('git checkout -b feature');
            await fs.appendFile('feature.txt', 'new feature\n');
            execSync('git add .');
            execSync('git commit -m "feat: new feature"');
            execSync('git checkout main');
            execSync('git merge feature --no-ff');

            await updateVersion('minor');
            const changelog = JSON.parse(await fs.readFile('.homeychangelog.json'));
            expect(changelog['1.1.0']).toBeDefined();
        });
    });

    describe('Release Process', () => {
        test('should verify clean working directory', async () => {
            await fs.appendFile('test.txt', 'uncommitted change');
            await expect(release()).rejects.toThrow();
        });

        test('should handle missing dependencies', async () => {
            const pkg = JSON.parse(await fs.readFile('package.json'));
            delete pkg.dependencies;
            await fs.writeFile('package.json', JSON.stringify(pkg));
            
            const warnings = [];
            await checkVersions([], warnings);
            expect(warnings).toContain('No dependencies specified');
        });

        test('should validate documentation completeness', async () => {
            await fs.unlink('README.md');
            const errors = [];
            await checkDocumentation(errors, []);
            expect(errors).toContain('README.md missing');
        });

        Object.entries(TEST_ENVIRONMENTS).forEach(([env, vars]) => {
            test(`should handle ${env} environment`, async () => {
                Object.entries(vars).forEach(([key, value]) => {
                    process.env[key] = value;
                });

                const result = await release();
                expect(result).toBe(true);
            });
        });
    });

    describe('Rollback Process', () => {
        beforeEach(async () => {
            // Create multiple versions
            for (const commit of VERSION_INCREMENTS.minor.commits) {
                await fs.appendFile('test.txt', commit + '\n');
                execSync('git add .');
                execSync(`git commit -m "${commit}"`);
            }
            await updateVersion('minor');
        });

        test('should handle rollback to specific version', async () => {
            const tags = getTags();
            await rollback(1);
            const version = await getCurrentVersion();
            expect(version).toBe('1.0.0');
        });

        test('should preserve changes in backup branch', async () => {
            await rollback(1);
            const branches = execSync('git branch').toString();
            const backupBranch = branches.match(/backup-\d+/)[0];
            
            execSync(`git checkout ${backupBranch}`);
            const files = await fs.readdir('.');
            expect(files).toContain('test.txt');
        });

        test('should update changelog after rollback', async () => {
            await rollback(1);
            const changelog = JSON.parse(await fs.readFile('.homeychangelog.json'));
            expect(changelog['1.0.0'].en).toContain('Rollback');
        });

        test('should handle failed rollback gracefully', async () => {
            // Simulate git failure
            jest.spyOn(require('child_process'), 'execSync')
                .mockImplementationOnce(() => { throw new Error('Git error'); });

            await expect(rollback(1)).rejects.toThrow();
            const version = await getCurrentVersion();
            expect(version).toBe('1.1.0'); // Should remain unchanged
        });
    });

    describe('Error Handling', () => {
        test('should handle missing files', async () => {
            for (const file of ERROR_SCENARIOS.missingFiles) {
                await fs.unlink(file);
            }
            await expect(release()).rejects.toThrow();
        });

        test('should handle invalid JSON', async () => {
            for (const [file, content] of Object.entries(ERROR_SCENARIOS.invalidContent)) {
                await fs.writeFile(file, content);
            }
            await expect(release()).rejects.toThrow(/JSON/);
        });

        test('should detect version mismatches', async () => {
            const errors = [];
            for (const [file, content] of Object.entries(ERROR_SCENARIOS.versionMismatch)) {
                await fs.writeFile(file, JSON.stringify(content));
            }
            await checkVersions(errors, []);
            expect(errors.length).toBeGreaterThan(0);
        });
    });
});
