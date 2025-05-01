'use strict';

const EventEmitter = require('events');

/**
 * Simulated device for testing
 * Combines Z-Wave basics with monitoring capabilities
 */
class DeviceSimulator extends EventEmitter {
    constructor(options = {}) {
        super();
        
        this.id = options.id || 'test-device';
        this.name = options.name || 'Test Lock';
        this.available = true;
        
        // Device state
        this.state = {
            locked: false,
            battery: 100,
            autolock: true
        };

        // Storage simulation
        this.store = new Map();

        // Z-Wave simulation
        this.zwave = {
            node: {
                manufacturerId: 865,
                productTypeId: 1,
                productId: 1
            },
            values: new Map(),
            ready: true
        };

        // Initialize defaults
        this.store.set('performance', {
            samples: [],
            lastUpdate: Date.now(),
            alerts: []
        });
    }

    // Device capabilities
    hasCapability(cap) {
        return ['locked', 'measure_battery', 'autolock_enabled', 'user_code'].includes(cap);
    }

    async getCapabilityValue(cap) {
        switch (cap) {
            case 'locked':
                return this.state.locked;
            case 'measure_battery':
                return this.state.battery;
            case 'autolock_enabled':
                return this.state.autolock;
            default:
                return null;
        }
    }

    async setCapabilityValue(cap, value) {
        switch (cap) {
            case 'locked':
                this.state.locked = value;
                this.emit('locked', value);
                break;
            case 'autolock_enabled':
                this.state.autolock = value;
                break;
        }
        return true;
    }

    // Storage simulation
    async getStoreValue(key) {
        return this.store.get(key);
    }

    async setStoreValue(key, value) {
        this.store.set(key, value);
    }

    // Settings simulation
    getSetting(key) {
        return this.store.get(`setting_${key}`);
    }

    async setSettings(settings) {
        Object.entries(settings).forEach(([key, value]) => {
            this.store.set(`setting_${key}`, value);
        });
    }

    // State management
    getAvailable() {
        return this.available;
    }

    async setAvailable() {
        this.available = true;
        this.emit('available');
    }

    async setUnavailable(reason) {
        this.available = false;
        this.emit('unavailable', reason);
    }

    // Z-Wave simulation
    getZWaveNode() {
        return this.zwave.node;
    }

    setZWaveValue(commandClass, value) {
        this.zwave.values.set(commandClass, value);
    }

    getZWaveValue(commandClass) {
        return this.zwave.values.get(commandClass);
    }

    // Utility methods
    log(...args) {
        console.log(`[${this.id}]`, ...args);
    }

    error(...args) {
        console.error(`[${this.id}][ERROR]`, ...args);
    }

    // Simulation controls
    simulateBatteryDrain(amount = 10) {
        this.state.battery = Math.max(0, this.state.battery - amount);
        this.emit('battery_changed', this.state.battery);
    }

    simulateMemoryLeak(size = 1000000) {
        const leak = new Array(size).fill('leak');
        this.leakedMemory = (this.leakedMemory || []).concat(leak);
    }

    simulateHighLoad(duration = 1000) {
        const start = Date.now();
        while (Date.now() - start < duration) {
            Math.random() * Math.random();
        }
    }
}

module.exports = DeviceSimulator;
