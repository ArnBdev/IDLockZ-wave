'use strict';

/**
 * Test fixtures for performance profiling
 */
const CPU_PROFILES = {
    // Clean profile with expected performance
    clean: {
        cpu: {
            samples: [1, 2, 3, 1, 2, 3],
            timeDeltas: [100, 100, 100, 100, 100, 100],
            nodes: {
                1: { functionName: 'fastFunction' },
                2: { functionName: 'mediumFunction' },
                3: { functionName: 'slowFunction' }
            }
        },
        timing: 500,
        metrics: {
            mean: 500,
            p95: 550,
            max: 600
        }
    },

    // Profile with performance hotspots
    hotspots: {
        cpu: {
            samples: [1, 1, 1, 2, 2, 3],
            timeDeltas: [500, 500, 500, 200, 200, 100],
            nodes: {
                1: { functionName: 'expensiveOperation' },
                2: { functionName: 'moderateOperation' },
                3: { functionName: 'lightOperation' }
            }
        },
        timing: 2000,
        metrics: {
            mean: 2000,
            p95: 2200,
            max: 2500
        }
    },

    // Profile with memory leaks
    memoryLeaks: {
        cpu: {
            samples: [1, 2, 3],
            timeDeltas: [100, 100, 100],
            nodes: {
                1: { functionName: 'allocateMemory' },
                2: { functionName: 'processData' },
                3: { functionName: 'cleanup' }
            }
        },
        heap: {
            nodes: [
                { id: 1, name: 'LeakedArray', retainedSize: 50000000 },
                { id: 2, name: 'Cache', retainedSize: 20000000 }
            ],
            edges: [
                { from: 1, to: 2, type: 'internal' }
            ]
        },
        timing: 800
    }
};

const HEAP_PROFILES = {
    // Normal memory usage
    normal: {
        nodes: [
            { id: 1, name: 'WorkingSet', retainedSize: 10000000 },
            { id: 2, name: 'Cache', retainedSize: 5000000 }
        ],
        edges: [
            { from: 1, to: 2, type: 'internal' }
        ],
        statistics: {
            total: 15000000,
            v8heap: 8000000,
            native: 7000000
        }
    },

    // High memory usage
    high: {
        nodes: [
            { id: 1, name: 'LargeDataSet', retainedSize: 100000000 },
            { id: 2, name: 'TemporaryBuffer', retainedSize: 50000000 }
        ],
        edges: [
            { from: 1, to: 2, type: 'internal' }
        ],
        statistics: {
            total: 150000000,
            v8heap: 120000000,
            native: 30000000
        }
    }
};

const METRICS = {
    // Baseline performance metrics
    baseline: {
        versionUpdate: {
            mean: 800,
            p95: 900,
            max: 1000,
            min: 700,
            samples: 50
        },
        release: {
            mean: 2000,
            p95: 2500,
            max: 3000,
            min: 1800,
            samples: 50
        },
        rollback: {
            mean: 1200,
            p95: 1400,
            max: 1600,
            min: 1000,
            samples: 50
        }
    },

    // Degraded performance metrics
    degraded: {
        versionUpdate: {
            mean: 1200,
            p95: 1400,
            max: 1600,
            min: 1000,
            samples: 50
        },
        release: {
            mean: 3500,
            p95: 4000,
            max: 4500,
            min: 3000,
            samples: 50
        },
        rollback: {
            mean: 1800,
            p95: 2000,
            max: 2500,
            min: 1500,
            samples: 50
        }
    }
};

const HISTORICAL_DATA = {
    // Week of normal performance
    normal: Array(7).fill().map((_, i) => ({
        timestamp: new Date(Date.now() - (i * 24 * 60 * 60 * 1000)).toISOString(),
        results: {
            versionUpdate: METRICS.baseline.versionUpdate,
            release: METRICS.baseline.release,
            rollback: METRICS.baseline.rollback
        }
    })),

    // Week with gradual degradation
    degrading: Array(7).fill().map((_, i) => ({
        timestamp: new Date(Date.now() - (i * 24 * 60 * 60 * 1000)).toISOString(),
        results: {
            versionUpdate: {
                mean: METRICS.baseline.versionUpdate.mean * (1 + i * 0.1),
                p95: METRICS.baseline.versionUpdate.p95 * (1 + i * 0.1),
                max: METRICS.baseline.versionUpdate.max * (1 + i * 0.1),
                min: METRICS.baseline.versionUpdate.min * (1 + i * 0.1),
                samples: 50
            }
        }
    }))
};

const MOCK_SYSTEM_INFO = {
    normal: {
        cpu: {
            usage: 30,
            count: 8,
            speed: 2.6
        },
        memory: {
            total: 16000000000,
            free: 8000000000,
            usage: 50
        }
    },
    high: {
        cpu: {
            usage: 90,
            count: 8,
            speed: 2.6
        },
        memory: {
            total: 16000000000,
            free: 1000000000,
            usage: 94
        }
    }
};

module.exports = {
    CPU_PROFILES,
    HEAP_PROFILES,
    METRICS,
    HISTORICAL_DATA,
    MOCK_SYSTEM_INFO,
    createProfile: (type = 'clean') => ({
        ...CPU_PROFILES[type],
        timestamp: new Date().toISOString()
    }),
    createHeapSnapshot: (type = 'normal') => ({
        ...HEAP_PROFILES[type],
        timestamp: new Date().toISOString()
    }),
    createHistoricalData: (type = 'normal', days = 7) => 
        HISTORICAL_DATA[type].slice(0, days)
};
