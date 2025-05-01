'use strict';

const { validateBudgets, budgetSchema } = require('../scripts/validate-budgets');
const fs = require('fs').promises;
const path = require('path');

describe('Performance Budget Validation', () => {
    let mockBudgets;

    beforeEach(() => {
        // Valid baseline configuration
        mockBudgets = {
            thresholds: {
                versionUpdate: {
                    warning: 800,
                    error: 1000,
                    regression: 10
                },
                release: {
                    warning: 2500,
                    error: 3000,
                    regression: 15
                },
                rollback: {
                    warning: 1200,
                    error: 1500,
                    regression: 10
                },
                memory: {
                    heapUsed: {
                        warning: 100,
                        error: 150,
                        regression: 5
                    },
                    rss: {
                        warning: 200,
                        error: 300,
                        regression: 10
                    }
                }
            },
            ci: {
                failOnError: true,
                warnOnRegression: true,
                allowedRegressions: 1,
                requiredSamples: 5,
                stabilityThreshold: 3
            },
            reporting: {
                notifications: {
                    slack: {
                        threshold: 'error',
                        channel: '#performance'
                    },
                    email: {
                        threshold: 'warning',
                        recipients: ['dev-team@idlock.no']
                    }
                },
                metrics: {
                    capture: ['mean', 'p95', 'max', 'min', 'stddev'],
                    trends: {
                        period: '7d',
                        samples: 10
                    }
                }
            },
            environments: {
                ci: {
                    warmup: 2,
                    samples: 5,
                    maxRetries: 3
                },
                local: {
                    warmup: 1,
                    samples: 3,
                    maxRetries: 1
                }
            },
            ignorePatterns: [
                'test/**/*.js',
                'scripts/debug.js'
            ]
        };
    });

    describe('Schema Validation', () => {
        test('should validate valid configuration', async () => {
            await expect(validateBudgets(mockBudgets)).resolves.toBe(true);
        });

        test('should reject missing required fields', async () => {
            delete mockBudgets.thresholds;
            await expect(validateBudgets(mockBudgets)).rejects.toThrow();
        });

        test('should validate threshold values', async () => {
            mockBudgets.thresholds.versionUpdate.warning = -1;
            await expect(validateBudgets(mockBudgets)).rejects.toThrow();
        });

        test('should validate notification settings', async () => {
            mockBudgets.reporting.notifications.slack.threshold = 'invalid';
            await expect(validateBudgets(mockBudgets)).rejects.toThrow();
        });
    });

    describe('Threshold Validation', () => {
        test('should validate warning < error', async () => {
            mockBudgets.thresholds.versionUpdate.warning = 1200;
            mockBudgets.thresholds.versionUpdate.error = 1000;
            await expect(validateBudgets(mockBudgets)).rejects.toThrow(/Warning threshold/);
        });

        test('should validate memory thresholds', async () => {
            mockBudgets.thresholds.memory.heapUsed.warning = 200;
            mockBudgets.thresholds.memory.heapUsed.error = 150;
            await expect(validateBudgets(mockBudgets)).rejects.toThrow(/memory.heapUsed/);
        });

        test('should validate regression percentages', async () => {
            mockBudgets.thresholds.release.regression = -5;
            await expect(validateBudgets(mockBudgets)).rejects.toThrow();
        });
    });

    describe('Environment Validation', () => {
        test('should validate CI sample requirements', async () => {
            mockBudgets.environments.ci.samples = 2;
            mockBudgets.environments.local.samples = 3;
            await expect(validateBudgets(mockBudgets)).rejects.toThrow(/CI environment/);
        });

        test('should validate warmup runs', async () => {
            mockBudgets.environments.ci.warmup = 0;
            mockBudgets.environments.local.warmup = 1;
            await expect(validateBudgets(mockBudgets)).rejects.toThrow(/CI environment/);
        });

        test('should allow equal environment settings', async () => {
            mockBudgets.environments.ci.samples = 3;
            mockBudgets.environments.local.samples = 3;
            await expect(validateBudgets(mockBudgets)).resolves.toBe(true);
        });
    });

    describe('Notification Validation', () => {
        test('should validate email format', async () => {
            mockBudgets.reporting.notifications.email.recipients = ['invalid-email'];
            await expect(validateBudgets(mockBudgets)).rejects.toThrow(/Invalid email/);
        });

        test('should validate Slack channel format', async () => {
            mockBudgets.reporting.notifications.slack.channel = 'performance';
            await expect(validateBudgets(mockBudgets)).rejects.toThrow(/Slack channel/);
        });

        test('should accept valid email addresses', async () => {
            mockBudgets.reporting.notifications.email.recipients = ['test@example.com'];
            await expect(validateBudgets(mockBudgets)).resolves.toBe(true);
        });
    });

    describe('File Handling', () => {
        test('should handle missing file', async () => {
            const originalPath = process.env.BUDGETS_FILE;
            process.env.BUDGETS_FILE = 'non-existent.json';
            
            await expect(validateBudgets()).rejects.toThrow(/ENOENT/);
            
            process.env.BUDGETS_FILE = originalPath;
        });

        test('should handle invalid JSON', async () => {
            jest.spyOn(fs, 'readFile').mockResolvedValue('invalid json');
            await expect(validateBudgets()).rejects.toThrow(/JSON/);
        });
    });

    describe('Edge Cases', () => {
        test('should handle empty arrays', async () => {
            mockBudgets.ignorePatterns = [];
            await expect(validateBudgets(mockBudgets)).resolves.toBe(true);
        });

        test('should handle minimum values', async () => {
            mockBudgets.thresholds.versionUpdate = {
                warning: 0,
                error: 1,
                regression: 0
            };
            await expect(validateBudgets(mockBudgets)).resolves.toBe(true);
        });

        test('should handle missing optional fields', async () => {
            delete mockBudgets.ignorePatterns;
            await expect(validateBudgets(mockBudgets)).resolves.toBe(true);
        });
    });
});
