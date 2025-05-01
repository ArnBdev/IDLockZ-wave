'use strict';

const fs = require('fs').promises;
const path = require('path');
const Ajv = require('ajv');

const BUDGETS_FILE = path.join(__dirname, '../performance-budgets.json');

// JSON Schema for performance budgets
const budgetSchema = {
    type: 'object',
    required: ['thresholds', 'ci', 'reporting', 'environments'],
    properties: {
        thresholds: {
            type: 'object',
            required: ['versionUpdate', 'release', 'rollback', 'memory'],
            properties: {
                versionUpdate: {
                    type: 'object',
                    required: ['warning', 'error', 'regression'],
                    properties: {
                        warning: { type: 'number', minimum: 0 },
                        error: { type: 'number', minimum: 0 },
                        regression: { type: 'number', minimum: 0 }
                    }
                },
                release: {
                    type: 'object',
                    required: ['warning', 'error', 'regression'],
                    properties: {
                        warning: { type: 'number', minimum: 0 },
                        error: { type: 'number', minimum: 0 },
                        regression: { type: 'number', minimum: 0 }
                    }
                },
                rollback: {
                    type: 'object',
                    required: ['warning', 'error', 'regression'],
                    properties: {
                        warning: { type: 'number', minimum: 0 },
                        error: { type: 'number', minimum: 0 },
                        regression: { type: 'number', minimum: 0 }
                    }
                },
                memory: {
                    type: 'object',
                    required: ['heapUsed', 'rss'],
                    properties: {
                        heapUsed: {
                            type: 'object',
                            required: ['warning', 'error', 'regression'],
                            properties: {
                                warning: { type: 'number', minimum: 0 },
                                error: { type: 'number', minimum: 0 },
                                regression: { type: 'number', minimum: 0 }
                            }
                        },
                        rss: {
                            type: 'object',
                            required: ['warning', 'error', 'regression'],
                            properties: {
                                warning: { type: 'number', minimum: 0 },
                                error: { type: 'number', minimum: 0 },
                                regression: { type: 'number', minimum: 0 }
                            }
                        }
                    }
                }
            }
        },
        ci: {
            type: 'object',
            required: ['failOnError', 'warnOnRegression', 'allowedRegressions', 'requiredSamples', 'stabilityThreshold'],
            properties: {
                failOnError: { type: 'boolean' },
                warnOnRegression: { type: 'boolean' },
                allowedRegressions: { type: 'number', minimum: 0 },
                requiredSamples: { type: 'number', minimum: 1 },
                stabilityThreshold: { type: 'number', minimum: 1 }
            }
        },
        reporting: {
            type: 'object',
            required: ['notifications', 'metrics'],
            properties: {
                notifications: {
                    type: 'object',
                    properties: {
                        slack: {
                            type: 'object',
                            required: ['threshold', 'channel'],
                            properties: {
                                threshold: { type: 'string', enum: ['warning', 'error'] },
                                channel: { type: 'string' }
                            }
                        },
                        email: {
                            type: 'object',
                            required: ['threshold', 'recipients'],
                            properties: {
                                threshold: { type: 'string', enum: ['warning', 'error'] },
                                recipients: { 
                                    type: 'array',
                                    items: { type: 'string', format: 'email' }
                                }
                            }
                        }
                    }
                },
                metrics: {
                    type: 'object',
                    required: ['capture', 'trends'],
                    properties: {
                        capture: { 
                            type: 'array',
                            items: { type: 'string' }
                        },
                        trends: {
                            type: 'object',
                            required: ['period', 'samples'],
                            properties: {
                                period: { type: 'string' },
                                samples: { type: 'number', minimum: 1 }
                            }
                        }
                    }
                }
            }
        },
        environments: {
            type: 'object',
            required: ['ci', 'local'],
            properties: {
                ci: {
                    type: 'object',
                    required: ['warmup', 'samples', 'maxRetries'],
                    properties: {
                        warmup: { type: 'number', minimum: 0 },
                        samples: { type: 'number', minimum: 1 },
                        maxRetries: { type: 'number', minimum: 0 }
                    }
                },
                local: {
                    type: 'object',
                    required: ['warmup', 'samples', 'maxRetries'],
                    properties: {
                        warmup: { type: 'number', minimum: 0 },
                        samples: { type: 'number', minimum: 1 },
                        maxRetries: { type: 'number', minimum: 0 }
                    }
                }
            }
        },
        ignorePatterns: {
            type: 'array',
            items: { type: 'string' }
        }
    }
};

async function validateBudgets() {
    console.log('🔍 Validating performance budgets...');

    try {
        // Load budgets file
        const budgets = JSON.parse(await fs.readFile(BUDGETS_FILE));

        // Validate schema
        const ajv = new Ajv({ allErrors: true });
        const validate = ajv.compile(budgetSchema);
        const valid = validate(budgets);

        if (!valid) {
            console.error('❌ Invalid performance budgets configuration:');
            validate.errors.forEach(error => {
                console.error(`- ${error.instancePath}: ${error.message}`);
            });
            process.exit(1);
        }

        // Additional validations
        validateThresholds(budgets.thresholds);
        validateEnvironments(budgets.environments);
        validateNotifications(budgets.reporting.notifications);

        console.log('✅ Performance budgets validation successful!');
        return true;
    } catch (error) {
        console.error('❌ Validation failed:', error.message);
        process.exit(1);
    }
}

function validateThresholds(thresholds) {
    // Validate threshold relationships
    const metrics = ['versionUpdate', 'release', 'rollback'];
    metrics.forEach(metric => {
        if (thresholds[metric].warning >= thresholds[metric].error) {
            throw new Error(`${metric}: Warning threshold must be less than error threshold`);
        }
    });

    // Validate memory thresholds
    ['heapUsed', 'rss'].forEach(metric => {
        if (thresholds.memory[metric].warning >= thresholds.memory[metric].error) {
            throw new Error(`memory.${metric}: Warning threshold must be less than error threshold`);
        }
    });
}

function validateEnvironments(environments) {
    // Validate CI has stricter requirements
    if (environments.ci.samples < environments.local.samples) {
        throw new Error('CI environment should have more samples than local');
    }
    if (environments.ci.warmup < environments.local.warmup) {
        throw new Error('CI environment should have more warmup runs than local');
    }
}

function validateNotifications(notifications) {
    // Validate email addresses
    if (notifications.email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        notifications.email.recipients.forEach(email => {
            if (!emailRegex.test(email)) {
                throw new Error(`Invalid email address: ${email}`);
            }
        });
    }

    // Validate Slack channel format
    if (notifications.slack && !notifications.slack.channel.startsWith('#')) {
        throw new Error('Slack channel must start with #');
    }
}

// Run if called directly
if (require.main === module) {
    validateBudgets().catch(console.error);
}

module.exports = {
    validateBudgets,
    budgetSchema
};
