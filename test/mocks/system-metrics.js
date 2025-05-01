'use strict';

/**
 * Mock system metrics for testing
 */
class MockSystemMetrics {
    constructor(options = {}) {
        this.cpuUsage = {
            current: options.cpuUsage || 0.3,
            trend: options.cpuTrend || 0,
            noise: options.cpuNoise || 0.05
        };

        this.memory = {
            total: options.totalMemory || 16 * 1024 * 1024 * 1024, // 16GB
            used: options.usedMemory || 8 * 1024 * 1024 * 1024,   // 8GB
            noise: options.memoryNoise || 0.02
        };

        this.heap = {
            total: options.heapTotal || 1024 * 1024 * 1024,    // 1GB
            used: options.heapUsed || 512 * 1024 * 1024,       // 512MB
            limit: options.heapLimit || 2 * 1024 * 1024 * 1024 // 2GB
        };

        this.eventLoop = {
            baselag: options.eventLoopLag || 1,
            noise: options.eventLoopNoise || 0.5
        };

        this.startTime = Date.now();
    }

    /**
     * Get simulated CPU metrics
     */
    getCPUMetrics() {
        const runTime = (Date.now() - this.startTime) / 1000;
        const trend = this.cpuUsage.trend * runTime;
        const noise = (Math.random() * 2 - 1) * this.cpuUsage.noise;
        
        const usage = Math.min(1, Math.max(0,
            this.cpuUsage.current + trend + noise
        ));

        return {
            usage,
            load: [usage * 4, usage * 2, usage], // 1m, 5m, 15m load averages
            count: 8,
            times: {
                user: 1000000 * usage,
                system: 500000 * usage,
                idle: 1000000 * (1 - usage)
            }
        };
    }

    /**
     * Get simulated memory metrics
     */
    getMemoryMetrics() {
        const noise = (Math.random() * 2 - 1) * this.memory.noise * this.memory.total;
        const used = Math.min(this.memory.total,
            Math.max(0, this.memory.used + noise)
        );

        return {
            total: this.memory.total,
            free: this.memory.total - used,
            used,
            buffers: used * 0.2,
            cached: used * 0.3,
            processUsage: {
                heapTotal: this.heap.total,
                heapUsed: this.heap.used,
                external: this.heap.used * 0.1,
                arrayBuffers: this.heap.used * 0.05
            }
        };
    }

    /**
     * Get simulated heap metrics
     */
    getHeapMetrics() {
        const noise = (Math.random() * 2 - 1) * 0.05 * this.heap.used;
        const used = Math.min(this.heap.limit,
            Math.max(0, this.heap.used + noise)
        );

        return {
            total: this.heap.total,
            used,
            limit: this.heap.limit,
            spaces: [
                {
                    name: 'new_space',
                    size: this.heap.total * 0.1,
                    used: used * 0.1,
                    available: this.heap.total * 0.1 - used * 0.1
                },
                {
                    name: 'old_space',
                    size: this.heap.total * 0.7,
                    used: used * 0.7,
                    available: this.heap.total * 0.7 - used * 0.7
                },
                {
                    name: 'code_space',
                    size: this.heap.total * 0.1,
                    used: used * 0.1,
                    available: this.heap.total * 0.1 - used * 0.1
                },
                {
                    name: 'map_space',
                    size: this.heap.total * 0.05,
                    used: used * 0.05,
                    available: this.heap.total * 0.05 - used * 0.05
                },
                {
                    name: 'large_object_space',
                    size: this.heap.total * 0.05,
                    used: used * 0.05,
                    available: this.heap.total * 0.05 - used * 0.05
                }
            ]
        };
    }

    /**
     * Get simulated event loop metrics
     */
    getEventLoopMetrics() {
        const noise = (Math.random() * 2 - 1) * this.eventLoop.noise;
        const lag = Math.max(0, this.eventLoop.baselag + noise);

        return {
            lag,
            activeTasks: Math.floor(lag * 2),
            activeHandles: Math.floor(lag)
        };
    }

    /**
     * Create system info snapshot
     */
    getSystemInfo() {
        return {
            platform: 'linux',
            release: '5.15.0',
            hostname: 'test-host',
            uptime: (Date.now() - this.startTime) / 1000,
            loadavg: this.getCPUMetrics().load,
            totalmem: this.memory.total,
            freemem: this.memory.total - this.getMemoryMetrics().used
        };
    }

    /**
     * Simulate load increase
     */
    increaseLoad(factor = 1.5) {
        this.cpuUsage.current = Math.min(1, this.cpuUsage.current * factor);
        this.memory.used = Math.min(this.memory.total, this.memory.used * factor);
        this.heap.used = Math.min(this.heap.limit, this.heap.used * factor);
        this.eventLoop.baselag *= factor;
        return this;
    }

    /**
     * Simulate load decrease
     */
    decreaseLoad(factor = 0.5) {
        this.cpuUsage.current *= factor;
        this.memory.used *= factor;
        this.heap.used *= factor;
        this.eventLoop.baselag *= factor;
        return this;
    }

    /**
     * Add gradual trend
     */
    setTrend(trend = 0.001) {
        this.cpuUsage.trend = trend;
        return this;
    }
}

// Predefined scenarios
const SCENARIOS = {
    normal: {
        cpuUsage: 0.3,
        totalMemory: 16 * 1024 * 1024 * 1024,
        usedMemory: 8 * 1024 * 1024 * 1024,
        eventLoopLag: 1
    },
    high: {
        cpuUsage: 0.8,
        totalMemory: 16 * 1024 * 1024 * 1024,
        usedMemory: 14 * 1024 * 1024 * 1024,
        eventLoopLag: 10
    },
    degrading: {
        cpuUsage: 0.4,
        cpuTrend: 0.001,
        totalMemory: 16 * 1024 * 1024 * 1024,
        usedMemory: 10 * 1024 * 1024 * 1024,
        eventLoopLag: 2
    },
    unstable: {
        cpuUsage: 0.5,
        cpuNoise: 0.2,
        totalMemory: 16 * 1024 * 1024 * 1024,
        usedMemory: 12 * 1024 * 1024 * 1024,
        eventLoopNoise: 5
    }
};

module.exports = {
    MockSystemMetrics,
    SCENARIOS,
    createMockMetrics: (scenario = 'normal') => new MockSystemMetrics(SCENARIOS[scenario])
};
