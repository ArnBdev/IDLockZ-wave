'use strict';

const { CPU_PROFILES, HEAP_PROFILES, METRICS } = require('../fixtures/profile-fixtures');

/**
 * Mock Inspector Session
 */
class MockInspectorSession {
    constructor(options = {}) {
        this.connected = false;
        this.profiles = {
            cpu: { ...CPU_PROFILES[options.cpuProfile || 'clean'] },
            heap: { ...HEAP_PROFILES[options.heapProfile || 'normal'] }
        };
        this.errors = options.errors || {};
    }

    connect() {
        if (this.errors.connect) {
            throw new Error('Failed to connect to inspector');
        }
        this.connected = true;
    }

    disconnect() {
        this.connected = false;
    }

    post(method, ...args) {
        const callback = args[args.length - 1];
        
        if (this.errors[method]) {
            return callback(new Error(`Failed to execute ${method}`));
        }

        switch (method) {
            case 'Profiler.enable':
            case 'HeapProfiler.enable':
                callback(null);
                break;

            case 'Profiler.start':
                callback(null, { timestamp: Date.now() });
                break;

            case 'Profiler.stop':
                callback(null, { profile: this.profiles.cpu });
                break;

            case 'HeapProfiler.startSampling':
                callback(null, { timestamp: Date.now() });
                break;

            case 'HeapProfiler.stopSampling':
                callback(null, { profile: this.profiles.heap });
                break;

            default:
                callback(null);
        }
    }
}

/**
 * Mock Process Stats
 */
class MockProcessStats {
    constructor(options = {}) {
        this.memory = {
            heapUsed: options.heapUsed || 50000000,
            heapTotal: options.heapTotal || 100000000,
            external: options.external || 10000000,
            rss: options.rss || 200000000
        };
        this.cpu = {
            user: options.cpuUser || 1000000,
            system: options.cpuSystem || 500000
        };
    }

    memoryUsage() {
        return { ...this.memory };
    }

    cpuUsage() {
        return { ...this.cpu };
    }

    hrtime() {
        return [0, 1e6]; // 1ms
    }
}

/**
 * Mock File System Operations
 */
class MockFileSystem {
    constructor(options = {}) {
        this.files = new Map();
        this.errors = options.errors || {};
    }

    async writeFile(path, content) {
        if (this.errors.writeFile) {
            throw new Error('Failed to write file');
        }
        this.files.set(path, content);
    }

    async readFile(path) {
        if (this.errors.readFile) {
            throw new Error('Failed to read file');
        }
        if (!this.files.has(path)) {
            throw new Error('File not found');
        }
        return this.files.get(path);
    }

    async mkdir(path, options) {
        if (this.errors.mkdir) {
            throw new Error('Failed to create directory');
        }
    }

    async readdir(path) {
        if (this.errors.readdir) {
            throw new Error('Failed to read directory');
        }
        return Array.from(this.files.keys());
    }
}

/**
 * Mock System Monitor
 */
class MockSystemMonitor {
    constructor(options = {}) {
        this.metrics = {
            cpu: options.cpuUsage || 30,
            memory: options.memoryUsage || 50,
            disk: options.diskUsage || 40
        };
        this.errors = options.errors || {};
    }

    async getCPUUsage() {
        if (this.errors.cpu) {
            throw new Error('Failed to get CPU usage');
        }
        return this.metrics.cpu;
    }

    async getMemoryUsage() {
        if (this.errors.memory) {
            throw new Error('Failed to get memory usage');
        }
        return this.metrics.memory;
    }

    async getDiskUsage() {
        if (this.errors.disk) {
            throw new Error('Failed to get disk usage');
        }
        return this.metrics.disk;
    }
}

/**
 * Mock Performance Metrics
 */
const createMockMetrics = (type = 'baseline') => ({
    ...METRICS[type],
    timestamp: Date.now()
});

/**
 * Helper Functions
 */
function createErrorGenerator(probability = 0.1) {
    return () => Math.random() < probability;
}

function simulateAsyncOperation(duration = 100) {
    return new Promise(resolve => setTimeout(resolve, duration));
}

module.exports = {
    MockInspectorSession,
    MockProcessStats,
    MockFileSystem,
    MockSystemMonitor,
    createMockMetrics,
    createErrorGenerator,
    simulateAsyncOperation
};
