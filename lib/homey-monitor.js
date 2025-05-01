'use strict';

const Homey = require('homey');

/**
 * HomeyMonitor - Performance monitoring adapted for Homey apps
 */
class HomeyMonitor {
    constructor(options = {}) {
        this.deviceStore = new Map();
        this.options = {
            storageRotation: options.storageRotation || 1000, // Max stored samples per device
            sampleInterval: options.sampleInterval || 60000,   // 1 minute
            batteryWarningThreshold: options.batteryWarningThreshold || 20,
            memoryWarningThreshold: options.memoryWarningThreshold || 0.8
        };
    }

    /**
     * Initialize monitoring for a device
     */
    async initDevice(device) {
        // Initialize device store if needed
        if (!device.getStoreValue('performance')) {
            await device.setStoreValue('performance', {
                samples: [],
                lastUpdate: Date.now(),
                alerts: []
            });
        }

        // Set up monitoring
        this.deviceStore.set(device.id, {
            timer: setInterval(() => this.collectMetrics(device), this.options.sampleInterval),
            metrics: {
                lastMemory: process.memoryUsage(),
                lastCpu: process.cpuUsage()
            }
        });

        // Initial collection
        await this.collectMetrics(device);
    }

    /**
     * Stop monitoring a device
     */
    stopDevice(device) {
        const deviceData = this.deviceStore.get(device.id);
        if (deviceData) {
            clearInterval(deviceData.timer);
            this.deviceStore.delete(device.id);
        }
    }

    /**
     * Collect metrics for a device
     */
    async collectMetrics(device) {
        try {
            const metrics = await this.gatherDeviceMetrics(device);
            await this.storeMetrics(device, metrics);
            await this.checkThresholds(device, metrics);
        } catch (error) {
            this.handleError(device, error);
        }
    }

    /**
     * Gather device-specific metrics
     */
    async gatherDeviceMetrics(device) {
        const deviceData = this.deviceStore.get(device.id);
        const now = Date.now();

        // Collect memory metrics
        const memory = process.memoryUsage();
        const memoryDiff = {
            heapUsed: memory.heapUsed - deviceData.metrics.lastMemory.heapUsed,
            external: memory.external - deviceData.metrics.lastMemory.external,
            rss: memory.rss - deviceData.metrics.lastMemory.rss
        };
        deviceData.metrics.lastMemory = memory;

        // Collect CPU metrics
        const cpu = process.cpuUsage();
        const cpuDiff = {
            user: cpu.user - deviceData.metrics.lastCpu.user,
            system: cpu.system - deviceData.metrics.lastCpu.system
        };
        deviceData.metrics.lastCpu = cpu;

        // Get battery status if available
        const batteryLevel = device.hasCapability('measure_battery') ? 
            await device.getCapabilityValue('measure_battery') : null;

        return {
            timestamp: now,
            memory: {
                ...memory,
                diff: memoryDiff
            },
            cpu: {
                ...cpu,
                diff: cpuDiff
            },
            device: {
                available: device.getAvailable(),
                battery: batteryLevel,
                store: await device.getStoreValue('performance')
            }
        };
    }

    /**
     * Store metrics in device store
     */
    async storeMetrics(device, metrics) {
        const store = await device.getStoreValue('performance');
        
        // Add new sample
        store.samples.push({
            timestamp: metrics.timestamp,
            memory: metrics.memory,
            cpu: metrics.cpu
        });

        // Rotate old samples if needed
        if (store.samples.length > this.options.storageRotation) {
            store.samples = store.samples.slice(-this.options.storageRotation);
        }

        store.lastUpdate = metrics.timestamp;
        await device.setStoreValue('performance', store);
    }

    /**
     * Check metrics against thresholds
     */
    async checkThresholds(device, metrics) {
        const alerts = [];

        // Check battery level
        if (metrics.device.battery !== null && 
            metrics.device.battery < this.options.batteryWarningThreshold) {
            alerts.push({
                type: 'battery',
                level: 'warning',
                message: `Low battery: ${metrics.device.battery}%`
            });
        }

        // Check memory usage
        const memoryUsage = metrics.memory.heapUsed / metrics.memory.heapTotal;
        if (memoryUsage > this.options.memoryWarningThreshold) {
            alerts.push({
                type: 'memory',
                level: 'warning',
                message: `High memory usage: ${(memoryUsage * 100).toFixed(1)}%`
            });
        }

        // Store alerts
        if (alerts.length > 0) {
            const store = await device.getStoreValue('performance');
            store.alerts = alerts;
            await device.setStoreValue('performance', store);
        }

        // Handle availability
        if (!metrics.device.available) {
            await device.setUnavailable('Device not responding');
        } else if (alerts.some(alert => alert.level === 'error')) {
            await device.setUnavailable('Critical performance issue detected');
        } else {
            await device.setAvailable();
        }
    }

    /**
     * Handle monitoring errors
     */
    handleError(device, error) {
        this.emit('error', {
            deviceId: device.id,
            error: error.message
        });
    }

    /**
     * Get performance report for a device
     */
    async getDeviceReport(device) {
        const store = await device.getStoreValue('performance');
        if (!store) return null;

        return {
            deviceId: device.id,
            lastUpdate: store.lastUpdate,
            samples: store.samples,
            alerts: store.alerts,
            summary: this.calculateSummary(store.samples)
        };
    }

    /**
     * Calculate summary statistics
     */
    calculateSummary(samples) {
        if (samples.length === 0) return null;

        // Calculate memory trends
        const memoryTrend = samples.map(s => s.memory.heapUsed);
        const memoryGrowth = (memoryTrend[memoryTrend.length - 1] - memoryTrend[0]) / samples.length;

        // Calculate CPU load
        const cpuLoad = samples.reduce((acc, s) => acc + s.cpu.diff.user + s.cpu.diff.system, 0) / samples.length;

        return {
            memoryGrowth: memoryGrowth,
            averageCpuLoad: cpuLoad,
            sampleCount: samples.length
        };
    }
}

module.exports = HomeyMonitor;
