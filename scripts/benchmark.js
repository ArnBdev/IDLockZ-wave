'use strict';

const fs = require('fs').promises;
const path = require('path');
const { execSync } = require('child_process');
const { release } = require('./release');
const { updateVersion } = require('./version');
const { rollback } = require('./rollback');

const RESULTS_FILE = path.join(__dirname, '../benchmark-results.json');
const ITERATIONS = 5;

async function runBenchmarks() {
    console.log('🏃 Running benchmarks...\n');
    const results = {
        timestamp: new Date().toISOString(),
        node: process.version,
        platform: process.platform,
        results: {}
    };

    try {
        // Setup test environment
        await setupTestEnv();

        // Run benchmarks
        results.results.versionUpdate = await benchmarkVersionUpdate();
        results.results.release = await benchmarkRelease();
        results.results.rollback = await benchmarkRollback();
        results.results.memoryUsage = measureMemoryUsage();

        // Save results
        await saveResults(results);

        // Generate report
        await generateReport(results);

        console.log('✨ Benchmarks complete!');
    } catch (error) {
        console.error('❌ Benchmark failed:', error);
        process.exit(1);
    } finally {
        // Cleanup
        await cleanup();
    }
}

async function setupTestEnv() {
    console.log('🔧 Setting up test environment...');
    await fs.mkdir('benchmark-test', { recursive: true });
    process.chdir('benchmark-test');

    // Initialize repository
    execSync('git init');
    execSync('git config user.name "Benchmark User"');
    execSync('git config user.email "benchmark@test.com"');

    // Create basic files
    const files = {
        'package.json': {
            version: '1.0.0',
            name: 'benchmark-test'
        },
        'app.json': {
            version: '1.0.0',
            name: 'Benchmark Test'
        },
        '.homeychangelog.json': {
            '1.0.0': {
                en: 'Initial version',
                no: 'Første versjon'
            }
        }
    };

    for (const [file, content] of Object.entries(files)) {
        await fs.writeFile(file, JSON.stringify(content, null, 2));
    }

    execSync('git add .');
    execSync('git commit -m "Initial commit"');
    execSync('git tag v1.0.0');
}

async function benchmarkVersionUpdate() {
    console.log('📊 Benchmarking version updates...');
    const results = [];

    for (let i = 0; i < ITERATIONS; i++) {
        const start = process.hrtime.bigint();
        await updateVersion('patch');
        const end = process.hrtime.bigint();
        results.push(Number(end - start) / 1e6); // Convert to milliseconds
    }

    return analyzeResults(results);
}

async function benchmarkRelease() {
    console.log('📊 Benchmarking release process...');
    const results = [];

    for (let i = 0; i < ITERATIONS; i++) {
        const start = process.hrtime.bigint();
        await release();
        const end = process.hrtime.bigint();
        results.push(Number(end - start) / 1e6);
    }

    return analyzeResults(results);
}

async function benchmarkRollback() {
    console.log('📊 Benchmarking rollback process...');
    const results = [];

    for (let i = 0; i < ITERATIONS; i++) {
        // Create version to roll back from
        await updateVersion('patch');
        
        const start = process.hrtime.bigint();
        await rollback(1);
        const end = process.hrtime.bigint();
        results.push(Number(end - start) / 1e6);
    }

    return analyzeResults(results);
}

function measureMemoryUsage() {
    const usage = process.memoryUsage();
    return {
        heapUsed: usage.heapUsed / 1024 / 1024,
        heapTotal: usage.heapTotal / 1024 / 1024,
        external: usage.external / 1024 / 1024,
        rss: usage.rss / 1024 / 1024
    };
}

function analyzeResults(results) {
    return {
        mean: results.reduce((a, b) => a + b, 0) / results.length,
        min: Math.min(...results),
        max: Math.max(...results),
        samples: results
    };
}

async function saveResults(results) {
    let history = [];
    try {
        const existing = await fs.readFile(RESULTS_FILE);
        history = JSON.parse(existing);
    } catch {
        // No existing results
    }

    history.push(results);
    await fs.writeFile(RESULTS_FILE, JSON.stringify(history, null, 2));
}

async function generateReport(results) {
    const report = `# Performance Benchmark Report

## System Information
- Node.js: ${results.node}
- Platform: ${results.platform}
- Date: ${results.timestamp}

## Results

### Version Update
- Mean: ${results.results.versionUpdate.mean.toFixed(2)}ms
- Min: ${results.results.versionUpdate.min.toFixed(2)}ms
- Max: ${results.results.versionUpdate.max.toFixed(2)}ms

### Release Process
- Mean: ${results.results.release.mean.toFixed(2)}ms
- Min: ${results.results.release.min.toFixed(2)}ms
- Max: ${results.results.release.max.toFixed(2)}ms

### Rollback Process
- Mean: ${results.results.rollback.mean.toFixed(2)}ms
- Min: ${results.results.rollback.min.toFixed(2)}ms
- Max: ${results.results.rollback.max.toFixed(2)}ms

### Memory Usage
- Heap Used: ${results.results.memoryUsage.heapUsed.toFixed(2)}MB
- Heap Total: ${results.results.memoryUsage.heapTotal.toFixed(2)}MB
- External: ${results.results.memoryUsage.external.toFixed(2)}MB
- RSS: ${results.results.memoryUsage.rss.toFixed(2)}MB
`;

    await fs.writeFile('benchmark-report.md', report);
    console.log('\n📝 Report generated: benchmark-report.md');
}

async function cleanup() {
    process.chdir('..');
    await fs.rm('benchmark-test', { recursive: true, force: true });
}

// Run if called directly
if (require.main === module) {
    runBenchmarks().catch(console.error);
}

module.exports = {
    runBenchmarks,
    analyzeResults,
    measureMemoryUsage
};
