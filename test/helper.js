'use strict';

const { ZwaveDevice, ZwaveDriver } = require('homey-zwavedriver');

// Helper to create a clean driver instance
function createTestDriver() {
    const driver = new ZwaveDriver();
    
    // Add standard flow mocks
    driver.homey.flow.getDeviceTriggerCard = jest.fn().mockReturnValue({
        registerRunListener: jest.fn().mockReturnThis(),
        register: jest.fn().mockReturnThis()
    });
    
    return driver;
}

// Helper to create a clean device instance
function createTestDevice(opts = {}) {
    const device = new ZwaveDevice();
    
    // Add any test specific configuration
    if (opts.capabilities) {
        opts.capabilities.forEach(cap => {
            device.hasCapability.mockImplementation(c => c === cap);
        });
    }
    
    return device;
}

// Helper to mock Z-Wave responses
function mockZwaveResponse(device, commandClass, command, value) {
    if (!device.node.CommandClass[commandClass]) {
        device.node.CommandClass[commandClass] = {};
    }
    
    device.node.CommandClass[commandClass][command] = jest.fn().mockResolvedValue(value);
    return device.node.CommandClass[commandClass][command];
}

module.exports = {
    createTestDriver,
    createTestDevice,
    mockZwaveResponse
};
