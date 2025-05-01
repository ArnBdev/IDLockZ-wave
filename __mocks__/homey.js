'use strict';

module.exports = jest.createMockFromModule('homey');

// Mock Flow methods
const flow = {
    getDeviceTriggerCard: jest.fn(() => ({
        registerRunListener: jest.fn().mockReturnThis(),
        register: jest.fn().mockReturnThis()
    })),
    getConditionCard: jest.fn(() => ({
        registerRunListener: jest.fn().mockReturnThis(),
        register: jest.fn().mockReturnThis()
    })),
    getActionCard: jest.fn(() => ({
        registerRunListener: jest.fn().mockReturnThis(),
        register: jest.fn().mockReturnThis()
    }))
};

// Mock Device and Driver base classes
class Device {}
class Driver {}

// Export mocked version
module.exports = {
    SimpleClass: class {},
    Device,
    Driver,
    flow,
    version: '2.0.0',
    manifest: require('../app.json'),
    log: jest.fn(),
    error: jest.fn()
};
