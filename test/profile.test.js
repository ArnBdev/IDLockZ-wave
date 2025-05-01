'use strict';

const fs = require('fs').promises;
const path = require('path');
const { profile, analyzeMetric, generateRecommendations } = require('../scripts/profile');

describe('Performance Profiling', () => {
    let testDir;

    beforeAll(async () => {
        testDir = path.join(__dirname, 'temp-profile');
        await fs.mkdir(testDir, { recursive: true });
        process.env.PROFILE_DIR = testDir;
    });

    afterAll(async () => {
        await fs.rm(testDir, { recursive: true, force: true });
    });

    describe('Profile Generation', () => {
        test('should generate CPU profile', async () => {
            const results = await profile({ heap: false });
            
            expect(results.metrics).toBeDefined();
            expect(Object.keys(results.metrics)).toContain('versionUpdate');
            
            // Check profile files
            const files = await fs.readdir(testDir);
            expect(files.some(f => f.includes('cpu'))).toBe(true);
            expect(files.some(f => f.includes('metrics'))).toBe(true);
        }, 30000);

        test('should generate heap profile when enabled', async () => {
            const results = await profile({ heap: true });
            
            const files = await fs.readdir(testDir);
            expect(files.some(f => f.includes('heap'))).toBe(true);
        }, 30000);

        test('should generate markdown report', async () => {
            await profile();
            
            const reportPath = path.join(testDir, 'profile-report.md');
            const report = await fs.readFile(reportPath, 'utf8');
            
            expect(report).toContain('Performance Profile Report');
            expect(report).toContain('Summary');
            expect(report).toContain('Recommendations');
        }, 30000);
    });

    describe('Metric Analysis', () => {
        test('should identify hotspots', () => {
            const mockData = {
                cpu: {
                    samples: [1, 2, 1, 3, 2, 1],
                    timeDeltas: [100, 200, 150, 300, 250, 100],
                    nodes: {
                        1: { functionName: 'test1' },
                        2: { functionName: 'test2' },
                        3: { functionName: 'test3' }
                    }
                },
                timing: 1100
            };

            const analysis = analyzeMetric(mockData);
            
            expect(analysis.timing.hotspots).toBeDefined();
            expect(analysis.timing.hotspots.length).toBeGreaterThan(0);
            expect(analysis.timing.hotspots[0]).toHaveProperty('percentage');
        });

        test('should calculate P95', () => {
            const mockData = {
                cpu: {
                    samples: Array(100).fill().map((_, i) => i),
                    timeDeltas: Array(100).fill(10),
                    nodes: {}
                },
                timing: 1000
            };

            const analysis = analyzeMetric(mockData);
            expect(analysis.timing.p95).toBeDefined();
            expect(analysis.timing.p95).toBeLessThanOrEqual(95);
        });

        test('should handle empty profiles', () => {
            const mockData = {
                cpu: {
                    samples: [],
                    timeDeltas: [],
                    nodes: {}
                },
                timing: 0
            };

            const analysis = analyzeMetric(mockData);
            expect(analysis.timing.hotspots).toHaveLength(0);
        });
    });

    describe('Recommendations', () => {
        test('should identify performance issues', () => {
            const mockSummary = {
                versionUpdate: {
                    timing: {
                        mean: 1500, // Above threshold
                        hotspots: [
                            { functionName: 'slowFunc', percentage: 25 }
                        ]
                    }
                }
            };

            const recommendations = generateRecommendations(mockSummary);
            
            expect(recommendations).toContainEqual(expect.objectContaining({
                level: 'warning',
                metric: 'versionUpdate'
            }));
        });

        test('should prioritize critical issues', () => {
            const mockSummary = {
                versionUpdate: {
                    timing: {
                        mean: 2000,
                        hotspots: [
                            { functionName: 'criticalFunc', percentage: 50 }
                        ]
                    },
                    memory: {
                        leaks: ['potentialLeak']
                    }
                }
            };

            const recommendations = generateRecommendations(mockSummary);
            const errors = recommendations.filter(r => r.level === 'error');
            const warnings = recommendations.filter(r => r.level === 'warning');
            
            expect(errors.length).toBeGreaterThan(0);
            expect(warnings.length).toBeGreaterThan(0);
        });

        test('should handle clean profiles', () => {
            const mockSummary = {
                versionUpdate: {
                    timing: {
                        mean: 500,
                        hotspots: [
                            { functionName: 'fastFunc', percentage: 10 }
                        ]
                    },
                    memory: {
                        leaks: []
                    }
                }
            };

            const recommendations = generateRecommendations(mockSummary);
            expect(recommendations).toHaveLength(0);
        });
    });

    describe('Profile Data Management', () => {
        test('should cleanup old profiles', async () => {
            // Create some old profile files
            const oldDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().replace(/[:.]/g, '-');
            await fs.writeFile(
                path.join(testDir, `test-cpu-${oldDate}.cpuprofile`),
                '{}'
            );

            await profile({ cleanup: true });

            const files = await fs.readdir(testDir);
            expect(files.some(f => f.includes(oldDate))).toBe(false);
        });

        test('should handle profile file errors', async () => {
            // Make directory read-only
            await fs.chmod(testDir, 0o444);

            await expect(profile()).rejects.toThrow();

            // Restore permissions
            await fs.chmod(testDir, 0o777);
        });
    });

    describe('Resource Usage', () => {
        test('should not leak memory during profiling', async () => {
            const initialMemory = process.memoryUsage().heapUsed;
            
            // Run multiple profiles
            for (let i = 0; i < 5; i++) {
                await profile();
            }

            const finalMemory = process.memoryUsage().heapUsed;
            const increase = (finalMemory - initialMemory) / 1024 / 1024; // MB
            
            expect(increase).toBeLessThan(50); // Max 50MB increase
        }, 60000);

        test('should handle system resource limits', async () => {
            // Simulate low memory conditions
            const largeArrays = [];
            try {
                while (true) {
                    largeArrays.push(Buffer.alloc(100 * 1024 * 1024)); // 100MB each
                }
            } catch (e) {
                // Out of memory, continue with test
            }

            await expect(profile()).rejects.toThrow();

            // Cleanup
            largeArrays.length = 0;
            global.gc && global.gc();
        });
    });
});
