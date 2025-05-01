'use strict';

const fs = require('fs').promises;
const { execSync } = require('child_process');
const { release } = require('../scripts/release');
const { updateVersion } = require('../scripts/version');
const { rollback } = require('../scripts/rollback');
const { createTestRepo, TEST_FILES } = require('./fixtures/release-fixtures');

describe('Performance Tests', () => {
    let originalCwd;
    let startTime;

    // Performance thresholds in milliseconds
    const THRESHOLDS = {
        versionUpdate: 1000,  // 1 second
        release: 3000,        // 3 seconds
        rollback: 1500,       // 1.5 seconds
        largeRepo: 5000       // 5 seconds
    };

    beforeAll(() => {
        originalCwd = process.cwd();
        jest.setTimeout(30000); // 30 seconds for performance tests
    });

    beforeEach(async () => {
        await fs.mkdir('perf-test', { recursive: true });
        process.chdir('perf-test');
        startTime = Date.now();
    });

    afterEach(async () => {
        const duration = Date.now() - startTime;
        console.log(`Test duration: ${duration}ms`);
        
        process.chdir(originalCwd);
        await fs.rm('perf-test', { recursive: true, force: true });
    });

    describe('Version Management Performance', () => {
        test('should update version quickly', async () => {
            // Setup
            const testRepo = createTestRepo();
            await initializeRepo(testRepo);

            // Measure version update
            const start = Date.now();
            await updateVersion('minor');
            const duration = Date.now() - start;

            expect(duration).toBeLessThan(THRESHOLDS.versionUpdate);
        });

        test('should handle multiple sequential updates efficiently', async () => {
            const testRepo = createTestRepo();
            await initializeRepo(testRepo);

            const versions = ['patch', 'minor', 'patch', 'minor', 'patch'];
            const start = Date.now();

            for (const type of versions) {
                await updateVersion(type);
            }

            const duration = Date.now() - start;
            const averageTime = duration / versions.length;
            expect(averageTime).toBeLessThan(THRESHOLDS.versionUpdate);
        });
    });

    describe('Release Process Performance', () => {
        test('should complete release process within threshold', async () => {
            const testRepo = createTestRepo();
            await initializeRepo(testRepo);

            const start = Date.now();
            await release();
            const duration = Date.now() - start;

            expect(duration).toBeLessThan(THRESHOLDS.release);
        });

        test('should handle large repositories', async () => {
            // Create large repository simulation
            const testRepo = createTestRepo();
            await initializeRepo(testRepo);
            await createLargeRepo();

            const start = Date.now();
            await release();
            const duration = Date.now() - start;

            expect(duration).toBeLessThan(THRESHOLDS.largeRepo);
        });
    });

    describe('Rollback Performance', () => {
        test('should perform rollback quickly', async () => {
            const testRepo = createTestRepo();
            await initializeRepo(testRepo);
            
            // Create versions to roll back from
            await updateVersion('minor');
            await updateVersion('patch');

            const start = Date.now();
            await rollback(1);
            const duration = Date.now() - start;

            expect(duration).toBeLessThan(THRESHOLDS.rollback);
        });

        test('should handle multiple rollbacks efficiently', async () => {
            const testRepo = createTestRepo();
            await initializeRepo(testRepo);

            // Create multiple versions
            const versions = ['patch', 'minor', 'patch', 'minor'];
            for (const type of versions) {
                await updateVersion(type);
            }

            // Measure multiple rollbacks
            const start = Date.now();
            await rollback(1);
            await rollback(1);
            const duration = Date.now() - start;

            expect(duration).toBeLessThan(THRESHOLDS.rollback * 2);
        });
    });

    describe('Memory Usage', () => {
        test('should maintain stable memory usage', async () => {
            const testRepo = createTestRepo();
            await initializeRepo(testRepo);

            const initialMemory = process.memoryUsage().heapUsed;
            
            // Perform multiple operations
            await updateVersion('minor');
            await release();
            await rollback(1);

            const finalMemory = process.memoryUsage().heapUsed;
            const memoryIncrease = finalMemory - initialMemory;

            // Should not increase more than 50MB
            expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024);
        });
    });
});

// Helper functions
async function initializeRepo(testRepo) {
    for (const [file, content] of Object.entries(testRepo.files)) {
        await fs.writeFile(file, JSON.stringify(content, null, 2));
    }

    execSync('git init');
    execSync('git config user.name "Test User"');
    execSync('git config user.email "test@example.com"');
    execSync('git add .');
    execSync('git commit -m "Initial commit"');
    execSync('git tag v1.0.0');
}

async function createLargeRepo() {
    // Create many files
    for (let i = 0; i < 100; i++) {
        await fs.writeFile(
            `file${i}.js`,
            `console.log("File ${i}");`
        );
    }

    // Create many commits
    for (let i = 0; i < 50; i++) {
        execSync('git add .');
        execSync(`git commit -m "commit ${i}"`);
    }

    // Create many tags
    for (let i = 1; i <= 10; i++) {
        execSync(`git tag v1.0.${i}`);
    }
}
