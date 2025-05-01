'use strict';

const fs = require('fs').promises;
const path = require('path');
const { validateBudgets } = require('../../scripts/validate-budgets');
const { runBenchmarks } = require('../../scripts/benchmark');
const { analyzeTrends } = require('../../scripts/analyze-trends');

describe('Performance Monitoring Integration', () => {
    let originalBudgets;
    let testDir;

    beforeAll(async () => {
        // Save original budgets
        originalBudgets = JSON.parse(
            await fs.readFile(path.join(__dirname, '../../performance-budgets.json'))
        );

        // Create test directory
        testDir = path.join(__dirname, '../temp-test');
        await fs.mkdir(testDir, { recursive: true });
    });

    afterAll(async () => {
        // Restore original budgets
        await fs.writeFile(
            path.join(__dirname, '../../performance-budgets.json'),
            JSON.stringify(originalBudgets, null, 2)
        );

        // Clean up test directory
        await fs.rm(testDir, { recursive: true, force: true });
    });

    beforeEach(async () => {
        // Reset test environment
        process.env.NODE_ENV = 'test';
        process.env.TEST_DIR = testDir;
        
        // Clear previous results
        try {
            await fs.unlink(path.join(testDir, 'benchmark-results.json'));
        } catch {
            // File might not exist
        }
    });

    describe('Full Monitoring Cycle', () => {
        test('should complete full monitoring cycle', async () => {
            // 1. Validate budgets
            await expect(validateBudgets()).resolves.toBe(true);

            // 2. Run benchmarks
            const benchmarkResults = await runBenchmarks();
            expect(benchmarkResults).toBeDefined();
            expect(benchmarkResults.results).toBeDefined();

            // 3. Analyze trends
            const trends = await analyzeTrends();
            expect(trends).toBeDefined();
        }, 30000); // 30 second timeout

        test('should detect performance regressions', async () => {
            // 1. Run initial benchmarks
            await runBenchmarks();

            // 2. Simulate performance degradation
            const results = JSON.parse(
                await fs.readFile(path.join(testDir, 'benchmark-results.json'))
            );
            
            // Degrade version update performance by 20%
            results.results.versionUpdate.mean *= 1.2;
            
            await fs.writeFile(
                path.join(testDir, 'benchmark-results.json'),
                JSON.stringify(results)
            );

            // 3. Analyze trends should detect regression
            const trends = await analyzeTrends();
            expect(trends.regressions).toContain('versionUpdate');
        });

        test('should handle missing historical data', async () => {
            // Analyze without previous benchmark data
            const trends = await analyzeTrends();
            expect(trends.status).toBe('insufficient_data');
        });
    });

    describe('Environment Specific Behavior', () => {
        test('should use CI settings in CI environment', async () => {
            process.env.CI = 'true';
            
            const results = await runBenchmarks();
            expect(results.environment.samples).toBe(5); // CI sample count
        });

        test('should use local settings in development', async () => {
            process.env.CI = '';
            process.env.NODE_ENV = 'development';
            
            const results = await runBenchmarks();
            expect(results.environment.samples).toBe(3); // Local sample count
        });
    });

    describe('Notification System', () => {
        test('should trigger notifications on threshold violations', async () => {
            // Mock notification services
            const mockSlack = jest.fn();
            const mockEmail = jest.fn();
            
            global.notifySlack = mockSlack;
            global.notifyEmail = mockEmail;

            // Create results that exceed thresholds
            const results = {
                results: {
                    versionUpdate: {
                        mean: 2000 // Exceeds error threshold
                    }
                }
            };

            await fs.writeFile(
                path.join(testDir, 'benchmark-results.json'),
                JSON.stringify(results)
            );

            await analyzeTrends();

            expect(mockSlack).toHaveBeenCalled();
            expect(mockEmail).toHaveBeenCalled();
        });
    });

    describe('Long-term Trends', () => {
        test('should track performance over time', async () => {
            // Create historical data
            const historical = [];
            const baseTime = Date.now() - (7 * 24 * 60 * 60 * 1000); // 7 days ago

            for (let i = 0; i < 7; i++) {
                historical.push({
                    timestamp: new Date(baseTime + (i * 24 * 60 * 60 * 1000)).toISOString(),
                    results: {
                        versionUpdate: {
                            mean: 800 + (i * 10) // Gradual degradation
                        }
                    }
                });
            }

            await fs.writeFile(
                path.join(testDir, 'benchmark-results.json'),
                JSON.stringify(historical)
            );

            const trends = await analyzeTrends();
            expect(trends.trends.versionUpdate.slope).toBeGreaterThan(0);
        });

        test('should handle seasonal patterns', async () => {
            // Create data with daily pattern
            const historical = [];
            const baseTime = Date.now() - (7 * 24 * 60 * 60 * 1000);

            for (let i = 0; i < 7 * 24; i++) { // Hourly data for a week
                historical.push({
                    timestamp: new Date(baseTime + (i * 60 * 60 * 1000)).toISOString(),
                    results: {
                        versionUpdate: {
                            // Simulate daily pattern
                            mean: 800 + (Math.sin(i * Math.PI / 12) * 100)
                        }
                    }
                });
            }

            await fs.writeFile(
                path.join(testDir, 'benchmark-results.json'),
                JSON.stringify(historical)
            );

            const trends = await analyzeTrends();
            expect(trends.patterns.daily).toBeDefined();
            expect(trends.patterns.weekly).toBeDefined();
        });
    });
});
