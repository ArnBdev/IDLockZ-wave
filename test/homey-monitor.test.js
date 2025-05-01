'use strict';

const HomeyMonitor = require('../lib/homey-monitor');

// Mock Homey device
class MockDevice {
    constructor(id, options = {}) {
        this.id = id;
        this.store = new Map();
        this.available = true;
        this.capabilities = options.capabilities || [];
        this.batteryLevel = options.batteryLevel || null;
    }

    async getStoreValue(key) {
        return this.store.get(key);
    }

    async setStoreValue(key, value) {
        this.store.set(key, value);
    }

    hasCapability(cap) {
        return this.capabilities.includes(cap);
    }

    async getCapabilityValue(cap) {
        if (cap === 'measure_battery') {
            return this.batteryLevel;
        }
        return null;
    }

    getAvailable() {
        return this.available;
    }

    async setAvailable() {
        this.available = true;
    }

    async setUnavailable(reason) {
        this.available = false;
        this.unavailableReason = reason;
    }
}

describe('HomeyMonitor', () => {
    let monitor;
    let device;

    beforeEach(() => {
        monitor = new HomeyMonitor({
            storageRotation: 10,
            sampleInterval: 100,
            batteryWarningThreshold: 20,
            memoryWarningThreshold: 0.8
        });

        device = new MockDevice('test-device-1', {
            capabilities: ['measure_battery'],
            batteryLevel: 50
        });
    });

    afterEach(() => {
        // Clean up any running monitors
        monitor.stopDevice(device);
    });

    describe('Device Initialization', () => {
        test('should initialize device monitoring', async () => {
            await monitor.initDevice(device);
            
            const store = await device.getStoreValue('performance');
            expect(store).toBeDefined();
            expect(store.samples).toBeInstanceOf(Array);
            expect(store.lastUpdate).toBeDefined();
        });

        test('should not duplicate initialization', async () => {
            await monitor.initDevice(device);
            const firstStore = await device.getStoreValue('performance');
            
            await monitor.initDevice(device);
            const secondStore = await device.getStoreValue('performance');
            
            expect(secondStore.lastUpdate).toBe(firstStore.lastUpdate);
        });
    });

    describe('Metric Collection', () => {
        test('should collect basic metrics', async () => {
            await monitor.initDevice(device);
            await monitor.collectMetrics(device);
            
            const store = await device.getStoreValue('performance');
            expect(store.samples).toHaveLength(1);
            
            const sample = store.samples[0];
            expect(sample.memory).toBeDefined();
            expect(sample.cpu).toBeDefined();
            expect(sample.timestamp).toBeDefined();
        });

        test('should respect storage rotation', async () => {
            monitor.options.storageRotation = 3;
            await monitor.initDevice(device);
            
            // Collect more samples than rotation limit
            for (let i = 0; i < 5; i++) {
                await monitor.collectMetrics(device);
            }
            
            const store = await device.getStoreValue('performance');
            expect(store.samples).toHaveLength(3);
        });

        test('should track battery status', async () => {
            device.batteryLevel = 15; // Below warning threshold
            await monitor.initDevice(device);
            await monitor.collectMetrics(device);
            
            const store = await device.getStoreValue('performance');
            expect(store.alerts).toHaveLength(1);
            expect(store.alerts[0].type).toBe('battery');
        });
    });

    describe('Threshold Monitoring', () => {
        test('should detect low battery', async () => {
            device.batteryLevel = 10;
            await monitor.initDevice(device);
            await monitor.collectMetrics(device);
            
            const store = await device.getStoreValue('performance');
            expect(store.alerts.some(a => a.type === 'battery')).toBe(true);
        });

        test('should detect high memory usage', async () => {
            // Mock high memory usage
            jest.spyOn(process, 'memoryUsage').mockImplementation(() => ({
                heapUsed: 900,
                heapTotal: 1000,
                external: 0,
                rss: 1000
            }));

            await monitor.initDevice(device);
            await monitor.collectMetrics(device);
            
            const store = await device.getStoreValue('performance');
            expect(store.alerts.some(a => a.type === 'memory')).toBe(true);
        });

        test('should mark device unavailable on critical issues', async () => {
            device.batteryLevel = 5; // Critical battery level
            await monitor.initDevice(device);
            await monitor.collectMetrics(device);
            
            expect(device.available).toBe(false);
            expect(device.unavailableReason).toBeDefined();
        });
    });

    describe('Performance Reporting', () => {
        test('should generate device report', async () => {
            await monitor.initDevice(device);
            await monitor.collectMetrics(device);
            
            const report = await monitor.getDeviceReport(device);
            expect(report).toBeDefined();
            expect(report.deviceId).toBe(device.id);
            expect(report.samples).toBeInstanceOf(Array);
            expect(report.summary).toBeDefined();
        });

        test('should calculate performance summary', async () => {
            await monitor.initDevice(device);
            
            // Collect multiple samples
            for (let i = 0; i < 3; i++) {
                await monitor.collectMetrics(device);
            }
            
            const report = await monitor.getDeviceReport(device);
            expect(report.summary.sampleCount).toBe(3);
            expect(report.summary.memoryGrowth).toBeDefined();
            expect(report.summary.averageCpuLoad).toBeDefined();
        });

        test('should handle missing data gracefully', async () => {
            const report = await monitor.getDeviceReport(device);
            expect(report).toBeNull();
        });
    });

    describe('Error Handling', () => {
        test('should handle device store errors', async () => {
            const errorDevice = new MockDevice('error-device');
            errorDevice.setStoreValue = jest.fn().mockRejectedValue(new Error('Store error'));
            
            await expect(monitor.initDevice(errorDevice)).rejects.toThrow();
        });

        test('should handle metric collection errors', async () => {
            await monitor.initDevice(device);
            
            // Mock a failing capability
            device.getCapabilityValue = jest.fn().mockRejectedValue(new Error('Capability error'));
            
            // Should not throw but log error
            await expect(monitor.collectMetrics(device)).resolves.not.toThrow();
        });
    });
});
