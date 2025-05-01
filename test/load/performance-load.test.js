'use strict';

const fs = require('fs').promises;
const path = require('path');
const { runBenchmarks } = require('../../scripts/benchmark');
const { validateBudgets } = require('../../scripts/validate-budgets');
const { execSync } = require('child_process');

describe('Performance Load Tests', () => {
    let testDir;
    const TEST_DURATION = 60000; // 1 minute
    const CONCURRENT_OPERATIONS = 5;

    beforeAll(async () => {
        testDir = path.join(__dirname, '../temp-load-test');
        await fs.mkdir(testDir, { recursive: true });
        process.env.TEST_DIR = testDir;
    });

    afterAll(async () => {
        await fs.rm(testDir, { recursive: true, force: true });
    });

    describe('Sustained Load', () => {
        test('should handle continuous operations', async () => {
            const startTime = Date.now();
            const results = [];
            
            // Run continuous operations for TEST_DURATION
            while (Date.now() - startTime < TEST_DURATION) {
                const result = await runBenchmarks();
                results.push(result);
                
                // Verify results still within thresholds
                await expect(validateBudgets()).resolves.toBe(true);
            }

            // Analyze results for stability
            const meanTimes = results.map(r => r.results.versionUpdate.mean);
            const stdDev = calculateStdDev(meanTimes);
            const variationCoeff = (stdDev / meanTimes.reduce((a, b) => a + b) / meanTimes.length) * 100;

            // Should have low variation coefficient (<10%)
            expect(variationCoeff).toBeLessThan(10);
        }, TEST_DURATION + 5000);

        test('should maintain performance under parallel operations', async () => {
            const operations = Array(CONCURRENT_OPERATIONS).fill().map(async () => {
                const results = [];
                const startTime = Date.now();

                while (Date.now() - startTime < TEST_DURATION / 2) {
                    const result = await runBenchmarks();
                    results.push(result);
                }

                return results;
            });

            const allResults = await Promise.all(operations);
            
            // Analyze results across all parallel operations
            allResults.forEach(results => {
                const means = results.map(r => r.results.versionUpdate.mean);
                expect(Math.max(...means) - Math.min(...means)).toBeLessThan(500); // Max 500ms variation
            });
        }, TEST_DURATION + 5000);
    });

    describe('Memory Pressure', () => {
        test('should handle memory pressure', async () => {
            const initialMemory = process.memoryUsage().heapUsed;
            const largeArrays = [];

            try {
                // Create memory pressure
                for (let i = 0; i < 10; i++) {
                    largeArrays.push(Buffer.alloc(100 * 1024 * 1024)); // 100MB each
                    await runBenchmarks();
                }

                const finalMemory = process.memoryUsage().heapUsed;
                const memoryIncrease = (finalMemory - initialMemory) / (1024 * 1024);

                // Should not increase more than 50MB per operation
                expect(memoryIncrease / 10).toBeLessThan(50);
            } finally {
                // Clean up
                largeArrays.length = 0;
                global.gc && global.gc();
            }
        });
    });

    describe('Resource Contention', () => {
        test('should handle CPU contention', async () => {
            const baseline = await runBenchmarks();

            // Create CPU load
            const cpuLoad = Array(require('os').cpus().length).fill().map(() => {
                return new Promise(resolve => {
                    let x = 0;
                    const startTime = Date.now();
                    while (Date.now() - startTime < TEST_DURATION / 2) {
                        x = Math.sqrt(Math.random() * x);
                    }
                    resolve();
                });
            });

            // Run benchmarks during CPU load
            const [loadResults] = await Promise.all([
                runBenchmarks(),
                ...cpuLoad
            ]);

            // Should not degrade more than 100%
            expect(loadResults.results.versionUpdate.mean)
                .toBeLessThan(baseline.results.versionUpdate.mean * 2);
        });

        test('should handle I/O contention', async () => {
            const baseline = await runBenchmarks();

            // Create I/O load
            const ioLoad = Array(5).fill().map(async () => {
                const startTime = Date.now();
                while (Date.now() - startTime < TEST_DURATION / 2) {
                    await fs.writeFile(
                        path.join(testDir, `load-${Math.random()}.tmp`),
                        Buffer.alloc(1024 * 1024) // 1MB
                    );
                }
            });

            // Run benchmarks during I/O load
            const [loadResults] = await Promise.all([
                runBenchmarks(),
                ...ioLoad
            ]);

            // Should not degrade more than 100%
            expect(loadResults.results.versionUpdate.mean)
                .toBeLessThan(baseline.results.versionUpdate.mean * 2);
        });
    });

    describe('Recovery', () => {
        test('should recover after heavy load', async () => {
            const baseline = await runBenchmarks();

            // Create heavy load
            const heavyLoad = async () => {
                const startTime = Date.now();
                while (Date.now() - startTime < TEST_DURATION / 2) {
                    await Promise.all([
                        runBenchmarks(),
                        fs.writeFile(path.join(testDir, 'load.tmp'), Buffer.alloc(10 * 1024 * 1024)),
                        new Promise(resolve => {
                            let x = 0;
                            for (let i = 0; i < 1000000; i++) x = Math.sqrt(x + i);
                            resolve();
                        })
                    ]);
                }
            };

            await heavyLoad();

            // Wait for system to stabilize
            await new Promise(resolve => setTimeout(resolve, 5000));

            // Check recovery
            const recoveryResults = await runBenchmarks();
            
            // Should be within 20% of baseline
            const difference = Math.abs(
                recoveryResults.results.versionUpdate.mean - baseline.results.versionUpdate.mean
            );
            expect(difference / baseline.results.versionUpdate.mean * 100).toBeLessThan(20);
        });
    });
});

// Helper functions
function calculateStdDev(values) {
    const mean = values.reduce((a, b) => a + b) / values.length;
    const squareDiffs = values.map(x => Math.pow(x - mean, 2));
    return Math.sqrt(squareDiffs.reduce((a, b) => a + b) / values.length);
}
