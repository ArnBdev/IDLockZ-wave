'use strict';

const EventEmitter = require('events');
const os = require('os');
const v8 = require('v8');

/**
 * Resource Monitor for tracking system and application performance
 */
class ResourceMonitor extends EventEmitter {
    constructor(options = {}) {
        super();
        this.interval = options.interval || 1000;
        this.samples = [];
        this.maxSamples = options.maxSamples || 1000;
        this.thresholds = {
            cpu: options.cpuThreshold || 0.8,
            memory: options.memoryThreshold || 0.8,
            heap: options.heapThreshold || 0.8,
            eventLoop: options.eventLoopThreshold || 50
        };
        this.monitoring = false;
        this.startTime = null;
    }

    /**
     * Start monitoring resources
     */
    start() {
        if (this.monitoring) return;
        
        this.monitoring = true;
        this.startTime = process.hrtime.bigint();
        this.samples = [];

        // Monitor resources
        this.timer = setInterval(() => {
            this.collectMetrics();
        }, this.interval);

        // Monitor event loop lag
        this.lastCheck = Date.now();
        this.lagTimer = setInterval(() => {
            const lag = Date.now() - this.lastCheck - this.interval;
            this.lastCheck = Date.now();
            
            if (lag > this.thresholds.eventLoop) {
                this.emit('alert', {
                    type: 'eventLoop',
                    message: `Event loop lag: ${lag}ms`,
                    value: lag
                });
            }
        }, this.interval);

        return this;
    }

    /**
     * Stop monitoring
     */
    stop() {
        this.monitoring = false;
        clearInterval(this.timer);
        clearInterval(this.lagTimer);
        return this;
    }

    /**
     * Collect current metrics
     */
    collectMetrics() {
        const metrics = {
            timestamp: Date.now(),
            cpu: this.getCPUUsage(),
            memory: this.getMemoryUsage(),
            heap: this.getHeapMetrics(),
            eventLoop: this.getEventLoopMetrics(),
            system: this.getSystemMetrics()
        };

        this.samples.push(metrics);
        if (this.samples.length > this.maxSamples) {
            this.samples.shift();
        }

        this.checkThresholds(metrics);
        this.emit('metrics', metrics);
        return metrics;
    }

    /**
     * Get CPU usage metrics
     */
    getCPUUsage() {
        const cpus = os.cpus();
        const totalIdle = cpus.reduce((acc, cpu) => acc + cpu.times.idle, 0);
        const totalTick = cpus.reduce((acc, cpu) => 
            acc + Object.values(cpu.times).reduce((a, b) => a + b), 0);
        
        return {
            usage: 1 - (totalIdle / totalTick),
            load: os.loadavg(),
            count: cpus.length
        };
    }

    /**
     * Get memory usage metrics
     */
    getMemoryUsage() {
        const total = os.totalmem();
        const free = os.freemem();
        const used = total - free;

        return {
            total,
            free,
            used,
            usage: used / total,
            process: process.memoryUsage()
        };
    }

    /**
     * Get V8 heap metrics
     */
    getHeapMetrics() {
        const stats = v8.getHeapStatistics();
        return {
            total: stats.total_heap_size,
            used: stats.used_heap_size,
            limit: stats.heap_size_limit,
            usage: stats.used_heap_size / stats.heap_size_limit,
            spaces: v8.getHeapSpaceStatistics()
        };
    }

    /**
     * Get event loop metrics
     */
    getEventLoopMetrics() {
        const lag = Date.now() - this.lastCheck - this.interval;
        return {
            lag,
            activeTasks: process._getActiveRequests().length,
            activeHandles: process._getActiveHandles().length
        };
    }

    /**
     * Get system-wide metrics
     */
    getSystemMetrics() {
        return {
            uptime: os.uptime(),
            platform: os.platform(),
            release: os.release(),
            hostname: os.hostname(),
            networkInterfaces: os.networkInterfaces()
        };
    }

    /**
     * Check metrics against thresholds
     */
    checkThresholds(metrics) {
        // CPU threshold
        if (metrics.cpu.usage > this.thresholds.cpu) {
            this.emit('alert', {
                type: 'cpu',
                message: `High CPU usage: ${(metrics.cpu.usage * 100).toFixed(1)}%`,
                value: metrics.cpu.usage
            });
        }

        // Memory threshold
        const memoryUsage = 1 - (metrics.memory.free / metrics.memory.total);
        if (memoryUsage > this.thresholds.memory) {
            this.emit('alert', {
                type: 'memory',
                message: `High memory usage: ${(memoryUsage * 100).toFixed(1)}%`,
                value: memoryUsage
            });
        }

        // Heap threshold
        if (metrics.heap.usage > this.thresholds.heap) {
            this.emit('alert', {
                type: 'heap',
                message: `High heap usage: ${(metrics.heap.usage * 100).toFixed(1)}%`,
                value: metrics.heap.usage
            });
        }
    }

    /**
     * Get statistics for collected metrics
     */
    getStatistics() {
        if (this.samples.length === 0) return null;

        return {
            duration: Number(process.hrtime.bigint() - this.startTime) / 1e6,
            samples: this.samples.length,
            cpu: this.calculateStats(this.samples.map(s => s.cpu.usage)),
            memory: this.calculateStats(this.samples.map(s => s.memory.usage)),
            heap: this.calculateStats(this.samples.map(s => s.heap.usage)),
            eventLoop: this.calculateStats(this.samples.map(s => s.eventLoop.lag))
        };
    }

    /**
     * Calculate statistics for a metric
     */
    calculateStats(values) {
        const sorted = [...values].sort((a, b) => a - b);
        const sum = values.reduce((a, b) => a + b, 0);
        
        return {
            min: sorted[0],
            max: sorted[sorted.length - 1],
            mean: sum / values.length,
            median: sorted[Math.floor(sorted.length / 2)],
            p95: sorted[Math.floor(sorted.length * 0.95)],
            p99: sorted[Math.floor(sorted.length * 0.99)]
        };
    }
}

module.exports = ResourceMonitor;
