'use strict';

// Mock Z-Wave device class
class ZwaveDevice {
    constructor() {
        this.setCapabilityValue = jest.fn().mockResolvedValue(true);
        this.getCapabilityValue = jest.fn().mockResolvedValue(null);
        this.registerCapability = jest.fn();
        this.registerReportListener = jest.fn();
        this.enableDebug = jest.fn();
        this.log = jest.fn();
        this.error = jest.fn();
        this.homey = require('./homey');
        
        // Capability handling
        this.hasCapability = jest.fn().mockReturnValue(true);
        this.triggerCapabilityListener = jest.fn().mockResolvedValue(true);
        
        // Z-Wave specific
        this.node = {
            CommandClass: {
                COMMAND_CLASS_CONFIGURATION: {
                    CONFIGURATION_SET: jest.fn().mockResolvedValue(true)
                }
            }
        };
        this.configurationSet = jest.fn().mockResolvedValue(true);
    }
}

// Mock Z-Wave driver class
class ZwaveDriver {
    constructor() {
        this.manifest = {
            id: 'IDLock150',
            name: { en: 'ID Lock 150/202', no: 'ID Lock 150/202' },
            zwave: {
                manufacturerId: 865,
                productTypeId: [1],
                productId: [1],
                wakeUpInterval: 3600,
                learnmode: {
                    instruction: { en: 'Press any button', no: 'Trykk en knapp' }
                }
            }
        };
        this.homey = require('./homey');
        this.log = jest.fn();
        this.error = jest.fn();
        this.onInit = jest.fn();
        this.enableDebug = jest.fn();
    }
}

module.exports = {
    ZwaveDevice,
    ZwaveDriver
};
