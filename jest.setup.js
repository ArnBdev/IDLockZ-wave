'use strict';

require('./__mocks__/setup');

// Add custom matchers
expect.extend({
    toHaveBeenCalledWithConfig(received, config) {
        const calls = received.mock.calls;
        const match = calls.some(call => {
            const [actualConfig] = call;
            return (
                actualConfig.id === config.id &&
                actualConfig.size === config.size &&
                actualConfig.value === config.value
            );
        });

        return {
            pass: match,
            message: () => 
                `Expected ${received.mock.calls} to contain configuration ${JSON.stringify(config)}`
        };
    }
});

// Add environment setup
process.env.NODE_ENV = 'test';
process.env.HOMEY_VERSION = '2.0.0';

// Add global test utilities
global.sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));
global.createMockCapability = (type, value) => ({
    id: type,
    value: value
});

// Add error handlers
process.on('unhandledRejection', (err) => {
    console.error('Unhandled rejection in test:', err);
    process.exit(1);
});

// Clean up after each test
afterEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
});

// Add snapshot serializers
expect.addSnapshotSerializer({
    test: (val) => val && val.mock && val.calls,
    print: (val) => JSON.stringify(val.mock.calls, null, 2)
});
