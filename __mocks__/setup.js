'use strict';

// Mock functions
function createMockFunction() {
    function mockFn(...args) {
        mockFn.mock.calls.push(args);
        return mockFn.mock.implementation ? mockFn.mock.implementation(...args) : mockFn.mock.returnValue;
    }
    
    mockFn.mock = {
        calls: [],
        implementation: null,
        returnValue: mockFn
    };
    
    mockFn.mockReturnValue = function(val) {
        this.mock.returnValue = val;
        return this;
    };
    
    mockFn.mockReturnThis = function() {
        this.mock.returnValue = this;
        return this;
    };
    
    mockFn.mockImplementation = function(fn) {
        this.mock.implementation = fn;
        return this;
    };
    
    mockFn.mockClear = function() {
        this.mock.calls = [];
        return this;
    };
    
    return mockFn;
}

// Mock Homey environment
const mockHomeyFlow = {
    FlowCard: class {
        constructor() {
            this.registerRunListener = createMockFunction();
            this.register = createMockFunction();
            
            this.registerRunListener.mockReturnThis();
            this.register.mockReturnThis();
        }
    }
};

const flowCard = new mockHomeyFlow.FlowCard();
mockHomeyFlow.getDeviceTriggerCard = createMockFunction().mockReturnValue(flowCard);
mockHomeyFlow.getConditionCard = createMockFunction().mockReturnValue(flowCard);
mockHomeyFlow.getActionCard = createMockFunction().mockReturnValue(flowCard);

// Mock Z-wave driver
class MockZwaveDevice {
    constructor() {
        this.log = createMockFunction();
        this.error = createMockFunction();
        this.registerCapability = createMockFunction();
        this.registerReportListener = createMockFunction();
        this.setCapabilityValue = createMockFunction();
        this.getCapabilityValue = createMockFunction();
        this.enableDebug = createMockFunction();
        this.configurationSet = createMockFunction();
        this.triggerFlow = createMockFunction();
    }
}

class MockZwaveDriver {
    constructor() {
        this.manifest = {
            zwave: {
                manufacturerId: 865,
                productTypeId: [1],
                productId: [1]
            }
        };
        this.log = createMockFunction();
        this.error = createMockFunction();
    }
    
    onInit() {}
    enableDebug() {}
}

global.ZwaveDevice = MockZwaveDevice;
global.ZwaveDriver = MockZwaveDriver;
global.Homey = {
    manifest: require('../app.json'),
    SimpleClass: class {},
    Device: class {},
    Driver: class {},
    FlowCard: mockHomeyFlow.FlowCard,
    Flow: mockHomeyFlow,
    log: createMockFunction(),
    error: createMockFunction(),
    version: '2.0.0',
    flow: mockHomeyFlow
};

// Export mock utilities
global.mockFn = createMockFunction;
