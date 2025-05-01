'use strict';

const inspector = require('inspector');
const fs = require('fs').promises;
const path = require('path');
const { runBenchmarks } = require('./benchmark');
const { validateBudgets } = require('./validate-budgets');
const { analyzeTrends } = require('./analyze-trends');

const PROFILE_DIR = path.join(__dirname, '../profiles');
const METRICS = ['versionUpdate', 'release', 'rollback'];

async function profile(options = {}) {
    const session = new inspector.Session();
    session.connect();

    const profiles = {
        cpu: [],
        heap: [],
        metrics: {}
    };

    try {
        console.log('🔍 Starting performance profiling...');

        // Create profiles directory
        await fs.mkdir(PROFILE_DIR, { recursive: true });

        // Profile each operation
        for (const metric of METRICS) {
            console.log(`\nProfiling ${metric}...`);
            profiles.metrics[metric] = await profileOperation(metric, session, options);
        }

        // Generate report
        await generateReport(profiles);

        console.log('\n✨ Profiling complete! Check profiles directory for results.');
    } finally {
        session.disconnect();
    }

    return profiles;
}

async function profileOperation(metric, session, options) {
    const results = {
        cpu: null,
        heap: null,
        timing: null,
        metrics: {}
    };

    // Start CPU profiling
    await startCPUProfiling(session);

    // Start heap profiling if enabled
    if (options.heap !== false) {
        await startHeapProfiling(session);
    }

    // Record timing
    const startTime = process.hrtime.bigint();

    try {
        // Run the operation
        const benchmarkResults = await runBenchmarks();
        results.metrics = benchmarkResults.results[metric];

        // Record execution time
        const endTime = process.hrtime.bigint();
        results.timing = Number(endTime - startTime) / 1e6; // Convert to ms

        // Collect CPU profile
        results.cpu = await stopCPUProfiling(session);

        // Collect heap profile if enabled
        if (options.heap !== false) {
            results.heap = await stopHeapProfiling(session);
        }

        // Save profiles
        await saveProfiles(metric, results);

    } catch (error) {
        console.error(`Failed to profile ${metric}:`, error);
        throw error;
    }

    return results;
}

async function startCPUProfiling(session) {
    return new Promise((resolve, reject) => {
        session.post('Profiler.enable', (err) => {
            if (err) return reject(err);
            session.post('Profiler.start', resolve);
        });
    });
}

async function stopCPUProfiling(session) {
    return new Promise((resolve, reject) => {
        session.post('Profiler.stop', (err, { profile }) => {
            if (err) return reject(err);
            session.post('Profiler.disable', () => resolve(profile));
        });
    });
}

async function startHeapProfiling(session) {
    return new Promise((resolve, reject) => {
        session.post('HeapProfiler.enable', (err) => {
            if (err) return reject(err);
            session.post('HeapProfiler.startSampling', resolve);
        });
    });
}

async function stopHeapProfiling(session) {
    return new Promise((resolve, reject) => {
        session.post('HeapProfiler.stopSampling', (err, { profile }) => {
            if (err) return reject(err);
            session.post('HeapProfiler.disable', () => resolve(profile));
        });
    });
}

async function saveProfiles(metric, results) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    
    // Save CPU profile
    if (results.cpu) {
        await fs.writeFile(
            path.join(PROFILE_DIR, `${metric}-cpu-${timestamp}.cpuprofile`),
            JSON.stringify(results.cpu)
        );
    }

    // Save heap profile
    if (results.heap) {
        await fs.writeFile(
            path.join(PROFILE_DIR, `${metric}-heap-${timestamp}.heapprofile`),
            JSON.stringify(results.heap)
        );
    }

    // Save metrics
    await fs.writeFile(
        path.join(PROFILE_DIR, `${metric}-metrics-${timestamp}.json`),
        JSON.stringify({
            timing: results.timing,
            metrics: results.metrics
        }, null, 2)
    );
}

async function generateReport(profiles) {
    const report = {
        timestamp: new Date().toISOString(),
        summary: {},
        recommendations: []
    };

    // Analyze each metric
    for (const metric of METRICS) {
        const data = profiles.metrics[metric];
        report.summary[metric] = analyzeMetric(data);
    }

    // Generate recommendations
    report.recommendations = generateRecommendations(report.summary);

    // Save report
    await fs.writeFile(
        path.join(PROFILE_DIR, 'profile-report.md'),
        generateMarkdownReport(report)
    );
}

function analyzeMetric(data) {
    return {
        timing: {
            mean: data.timing,
            p95: calculateP95(data.cpu.samples),
            hotspots: findHotspots(data.cpu)
        },
        memory: data.heap ? {
            allocated: calculateTotalAllocated(data.heap),
            retained: calculateRetainedSize(data.heap),
            leaks: findPotentialLeaks(data.heap)
        } : null
    };
}

function generateRecommendations(summary) {
    const recommendations = [];

    for (const [metric, data] of Object.entries(summary)) {
        // Check execution time
        if (data.timing.mean > 1000) {
            recommendations.push({
                level: 'warning',
                metric,
                issue: 'High execution time',
                suggestion: 'Consider optimizing hotspots'
            });
        }

        // Check memory usage
        if (data.memory && data.memory.leaks.length > 0) {
            recommendations.push({
                level: 'error',
                metric,
                issue: 'Potential memory leak',
                suggestion: 'Review memory allocation patterns'
            });
        }

        // Check hotspots
        data.timing.hotspots.forEach(hotspot => {
            if (hotspot.percentage > 20) {
                recommendations.push({
                    level: 'warning',
                    metric,
                    issue: `Hot function: ${hotspot.functionName}`,
                    suggestion: 'Consider optimization or caching'
                });
            }
        });
    }

    return recommendations;
}

function generateMarkdownReport(report) {
    return `# Performance Profile Report

Generated: ${report.timestamp}

## Summary

${Object.entries(report.summary).map(([metric, data]) => `
### ${metric}
- Mean execution time: ${data.timing.mean.toFixed(2)}ms
- P95: ${data.timing.p95.toFixed(2)}ms
${data.memory ? `- Memory allocated: ${formatBytes(data.memory.allocated)}
- Memory retained: ${formatBytes(data.memory.retained)}` : ''}

#### Hotspots
${data.timing.hotspots.map(h => `- ${h.functionName}: ${h.percentage.toFixed(1)}%`).join('\n')}
`).join('\n')}

## Recommendations

${report.recommendations.map(r => `### ${r.level.toUpperCase()}: ${r.metric}
- Issue: ${r.issue}
- Suggestion: ${r.suggestion}
`).join('\n')}
`;
}

// Helper functions
function calculateP95(samples) {
    const sorted = [...samples].sort((a, b) => a - b);
    const index = Math.ceil(sorted.length * 0.95) - 1;
    return sorted[index];
}

function findHotspots(cpuProfile) {
    const nodes = new Map();
    
    // Aggregate time spent in each function
    cpuProfile.samples.forEach((nodeId, i) => {
        const time = cpuProfile.timeDeltas[i];
        if (!nodes.has(nodeId)) {
            nodes.set(nodeId, { time: 0 });
        }
        nodes.get(nodeId).time += time;
    });

    // Calculate percentages and sort
    const totalTime = Array.from(nodes.values()).reduce((sum, node) => sum + node.time, 0);
    
    return Array.from(nodes.entries())
        .map(([nodeId, data]) => ({
            functionName: cpuProfile.nodes[nodeId].functionName || 'anonymous',
            percentage: (data.time / totalTime) * 100
        }))
        .sort((a, b) => b.percentage - a.percentage)
        .slice(0, 5); // Top 5 hotspots
}

function formatBytes(bytes) {
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unit = 0;
    
    while (size >= 1024 && unit < units.length - 1) {
        size /= 1024;
        unit++;
    }
    
    return `${size.toFixed(2)} ${units[unit]}`;
}

// Run if called directly
if (require.main === module) {
    profile().catch(console.error);
}

module.exports = {
    profile,
    analyzeMetric,
    generateRecommendations
};
