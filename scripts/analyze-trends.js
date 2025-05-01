'use strict';

const fs = require('fs').promises;
const path = require('path');
const { createCanvas } = require('canvas');

const RESULTS_FILE = path.join(__dirname, '../benchmark-results.json');
const CHART_FILE = path.join(__dirname, '../benchmark-trends.png');
const TREND_REPORT = path.join(__dirname, '../trend-report.md');

const THRESHOLDS = {
    versionUpdate: 1000,  // 1 second
    release: 3000,        // 3 seconds
    rollback: 1500,       // 1.5 seconds
};

async function analyzeTrends() {
    console.log('📈 Analyzing performance trends...');

    try {
        // Load historical data
        const results = JSON.parse(await fs.readFile(RESULTS_FILE));
        
        // Generate statistics
        const stats = calculateStatistics(results);
        
        // Create visualizations
        await createCharts(results);
        
        // Generate trend report
        await generateTrendReport(stats, results);

        console.log('✨ Trend analysis complete!');
    } catch (error) {
        console.error('❌ Trend analysis failed:', error);
        process.exit(1);
    }
}

function calculateStatistics(results) {
    const stats = {
        versionUpdate: { trend: [], threshold: THRESHOLDS.versionUpdate },
        release: { trend: [], threshold: THRESHOLDS.release },
        rollback: { trend: [], threshold: THRESHOLDS.rollback },
        memoryUsage: { trend: [] }
    };

    results.forEach(result => {
        // Version update trends
        stats.versionUpdate.trend.push({
            timestamp: result.timestamp,
            value: result.results.versionUpdate.mean
        });

        // Release trends
        stats.release.trend.push({
            timestamp: result.timestamp,
            value: result.results.release.mean
        });

        // Rollback trends
        stats.rollback.trend.push({
            timestamp: result.timestamp,
            value: result.results.rollback.mean
        });

        // Memory trends
        stats.memoryUsage.trend.push({
            timestamp: result.timestamp,
            value: result.results.memoryUsage.heapUsed
        });
    });

    // Calculate trends
    Object.keys(stats).forEach(key => {
        const trend = stats[key].trend;
        if (trend.length > 1) {
            const first = trend[0].value;
            const last = trend[trend.length - 1].value;
            stats[key].change = ((last - first) / first) * 100;
            stats[key].improving = last < first;
        }
    });

    return stats;
}

async function createCharts(results) {
    const canvas = createCanvas(800, 600);
    const ctx = canvas.getContext('2d');

    // Set background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, 800, 600);

    // Draw performance trends
    drawPerformanceChart(ctx, results, 0, 0, 800, 300);
    
    // Draw memory usage
    drawMemoryChart(ctx, results, 0, 300, 800, 300);

    // Save chart
    const buffer = canvas.toBuffer('image/png');
    await fs.writeFile(CHART_FILE, buffer);
}

function drawPerformanceChart(ctx, results, x, y, width, height) {
    const metrics = ['versionUpdate', 'release', 'rollback'];
    const colors = ['#4CAF50', '#2196F3', '#FFC107'];

    // Calculate scales
    const maxValue = Math.max(...results.flatMap(r => 
        metrics.map(m => r.results[m].mean)
    ));
    const timeScale = width / (results.length - 1);
    const valueScale = (height - 40) / maxValue;

    // Draw axes
    ctx.strokeStyle = '#000000';
    ctx.beginPath();
    ctx.moveTo(x + 50, y + 20);
    ctx.lineTo(x + 50, y + height - 20);
    ctx.lineTo(x + width - 20, y + height - 20);
    ctx.stroke();

    // Draw data lines
    metrics.forEach((metric, i) => {
        ctx.strokeStyle = colors[i];
        ctx.beginPath();
        results.forEach((result, j) => {
            const px = x + 50 + j * timeScale;
            const py = y + height - 20 - (result.results[metric].mean * valueScale);
            if (j === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
        });
        ctx.stroke();

        // Draw threshold line
        if (THRESHOLDS[metric]) {
            ctx.strokeStyle = `${colors[i]}44`;
            ctx.setLineDash([5, 5]);
            const thy = y + height - 20 - (THRESHOLDS[metric] * valueScale);
            ctx.beginPath();
            ctx.moveTo(x + 50, thy);
            ctx.lineTo(x + width - 20, thy);
            ctx.stroke();
            ctx.setLineDash([]);
        }
    });
}

function drawMemoryChart(ctx, results, x, y, width, height) {
    const memoryData = results.map(r => r.results.memoryUsage.heapUsed);
    const maxMemory = Math.max(...memoryData);
    const timeScale = width / (results.length - 1);
    const valueScale = (height - 40) / maxMemory;

    // Draw axes
    ctx.strokeStyle = '#000000';
    ctx.beginPath();
    ctx.moveTo(x + 50, y + 20);
    ctx.lineTo(x + 50, y + height - 20);
    ctx.lineTo(x + width - 20, y + height - 20);
    ctx.stroke();

    // Draw memory line
    ctx.strokeStyle = '#E91E63';
    ctx.beginPath();
    results.forEach((result, i) => {
        const px = x + 50 + i * timeScale;
        const py = y + height - 20 - (result.results.memoryUsage.heapUsed * valueScale);
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
    });
    ctx.stroke();
}

async function generateTrendReport(stats, results) {
    const report = `# Performance Trend Analysis

## Overview
Last run: ${results[results.length - 1].timestamp}
Total runs: ${results.length}

## Performance Trends

### Version Update
- Current: ${stats.versionUpdate.trend.slice(-1)[0].value.toFixed(2)}ms
- Change: ${stats.versionUpdate.change?.toFixed(2)}%
- Status: ${getTrendStatus(stats.versionUpdate)}

### Release Process
- Current: ${stats.release.trend.slice(-1)[0].value.toFixed(2)}ms
- Change: ${stats.release.change?.toFixed(2)}%
- Status: ${getTrendStatus(stats.release)}

### Rollback Process
- Current: ${stats.rollback.trend.slice(-1)[0].value.toFixed(2)}ms
- Change: ${stats.rollback.change?.toFixed(2)}%
- Status: ${getTrendStatus(stats.rollback)}

### Memory Usage
- Current: ${stats.memoryUsage.trend.slice(-1)[0].value.toFixed(2)}MB
- Change: ${stats.memoryUsage.change?.toFixed(2)}%
- Trend: ${getMemoryTrendStatus(stats.memoryUsage)}

## Recommendations
${generateRecommendations(stats)}

## Charts
See benchmark-trends.png for visual trends.
`;

    await fs.writeFile(TREND_REPORT, report);
    console.log('📝 Trend report generated:', TREND_REPORT);
}

function getTrendStatus({ trend, threshold, improving }) {
    const current = trend.slice(-1)[0].value;
    if (current > threshold) {
        return '🔴 Above threshold' + (improving ? ' but improving' : '');
    }
    return improving ? '🟢 Improving' : '🟡 Stable';
}

function getMemoryTrendStatus({ trend, improving }) {
    const change = ((trend.slice(-1)[0].value - trend[0].value) / trend[0].value) * 100;
    if (Math.abs(change) < 5) return '🟢 Stable';
    return improving ? '🟢 Optimizing' : '🟡 Growing';
}

function generateRecommendations(stats) {
    const recs = [];

    Object.entries(stats).forEach(([key, data]) => {
        if (data.trend.slice(-1)[0].value > (data.threshold || 0)) {
            recs.push(`- Optimize ${key} performance (currently above threshold)`);
        }
        if (data.change > 10) {
            recs.push(`- Investigate ${key} regression (${data.change.toFixed(2)}% increase)`);
        }
    });

    return recs.length ? recs.join('\n') : '- All metrics within acceptable ranges';
}

// Run if called directly
if (require.main === module) {
    analyzeTrends().catch(console.error);
}

module.exports = {
    analyzeTrends,
    calculateStatistics
};
