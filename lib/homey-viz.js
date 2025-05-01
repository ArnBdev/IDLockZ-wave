'use strict';

const colors = {
    memory: '#4CAF50',
    cpu: '#2196F3',
    battery: '#FFC107',
    error: '#F44336'
};

/**
 * HomeyViz - Visualization tools for performance monitoring
 */
class HomeyViz {
    constructor(options = {}) {
        this.options = {
            width: options.width || 800,
            height: options.height || 400,
            padding: options.padding || 40,
            pointRadius: options.pointRadius || 3,
            lineWidth: options.lineWidth || 2,
            ...options
        };
    }

    /**
     * Generate SVG visualization of performance data
     */
    generateSVG(data, type = 'timeline') {
        switch (type) {
            case 'timeline':
                return this.generateTimeline(data);
            case 'summary':
                return this.generateSummary(data);
            case 'status':
                return this.generateStatus(data);
            default:
                throw new Error(`Unknown visualization type: ${type}`);
        }
    }

    /**
     * Generate timeline visualization
     */
    generateTimeline(data) {
        const { width, height, padding } = this.options;
        const plotWidth = width - (padding * 2);
        const plotHeight = height - (padding * 2);

        // Calculate scales
        const timeRange = data.samples.reduce(
            (range, sample) => ({
                min: Math.min(range.min, sample.timestamp),
                max: Math.max(range.max, sample.timestamp)
            }),
            { min: Infinity, max: -Infinity }
        );

        const valueRange = data.samples.reduce(
            (range, sample) => ({
                min: Math.min(range.min, sample.memory.heapUsed),
                max: Math.max(range.max, sample.memory.heapUsed)
            }),
            { min: Infinity, max: -Infinity }
        );

        // Generate path
        const points = data.samples.map((sample, i) => {
            const x = padding + (i / (data.samples.length - 1)) * plotWidth;
            const y = height - (padding + 
                ((sample.memory.heapUsed - valueRange.min) / (valueRange.max - valueRange.min)) * plotHeight
            );
            return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
        });

        // Add grid and axes
        const grid = this.generateGrid(timeRange, valueRange, plotWidth, plotHeight);
        const axes = this.generateAxes(timeRange, valueRange);

        return `
        <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
            <style>
                .grid { stroke: #eee; stroke-width: 1; }
                .axis { stroke: #666; stroke-width: 2; }
                .label { font-family: sans-serif; font-size: 12px; fill: #666; }
                .data { stroke: ${colors.memory}; stroke-width: ${this.options.lineWidth}; fill: none; }
                .point { fill: ${colors.memory}; }
                .alert { fill: ${colors.error}; }
            </style>
            ${grid}
            ${axes}
            <path class="data" d="${points.join(' ')}" />
            ${this.generateDataPoints(data.samples, plotWidth, plotHeight)}
            ${this.generateAlerts(data.alerts, plotWidth, plotHeight)}
        </svg>`;
    }

    /**
     * Generate summary visualization
     */
    generateSummary(data) {
        const { width, height, padding } = this.options;
        const metrics = [
            { 
                label: 'Memory',
                value: (data.summary.memoryGrowth / 1024 / 1024).toFixed(2),
                unit: 'MB/sample',
                color: colors.memory
            },
            {
                label: 'CPU Load',
                value: (data.summary.averageCpuLoad / 1000000).toFixed(2),
                unit: 'ms',
                color: colors.cpu
            }
        ];

        if (data.device && data.device.battery !== null) {
            metrics.push({
                label: 'Battery',
                value: data.device.battery,
                unit: '%',
                color: colors.battery
            });
        }

        const boxWidth = (width - (padding * 2)) / metrics.length;
        const boxes = metrics.map((metric, i) => `
            <g transform="translate(${padding + (i * boxWidth)}, ${padding})">
                <rect 
                    width="${boxWidth - 10}" 
                    height="${height - (padding * 2)}"
                    rx="5"
                    fill="white"
                    stroke="${metric.color}"
                    stroke-width="2"
                />
                <text x="${boxWidth/2 - 5}" y="30" class="label" text-anchor="middle">
                    ${metric.label}
                </text>
                <text x="${boxWidth/2 - 5}" y="${height/2}" class="value" text-anchor="middle">
                    ${metric.value}${metric.unit}
                </text>
            </g>
        `);

        return `
        <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
            <style>
                .label { font-family: sans-serif; font-size: 14px; fill: #666; }
                .value { font-family: sans-serif; font-size: 24px; fill: #333; }
            </style>
            ${boxes.join('\n')}
        </svg>`;
    }

    /**
     * Generate status visualization
     */
    generateStatus(data) {
        const { width, height, padding } = this.options;
        const status = data.alerts.length > 0 ? 'warning' : 'normal';
        const color = status === 'normal' ? colors.memory : colors.error;

        return `
        <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
            <style>
                .status { font-family: sans-serif; font-size: 18px; }
            </style>
            <circle 
                cx="${width/2}"
                cy="${height/2}"
                r="${Math.min(width, height)/3}"
                fill="${color}"
                opacity="0.2"
            />
            <text 
                x="${width/2}"
                y="${height/2}"
                class="status"
                text-anchor="middle"
                alignment-baseline="middle"
                fill="${color}"
            >
                ${status.toUpperCase()}
            </text>
        </svg>`;
    }

    // Helper methods for visualization components
    generateGrid(timeRange, valueRange, plotWidth, plotHeight) {
        // Implementation for grid lines
        return '';
    }

    generateAxes(timeRange, valueRange) {
        // Implementation for axes
        return '';
    }

    generateDataPoints(samples, plotWidth, plotHeight) {
        // Implementation for data points
        return '';
    }

    generateAlerts(alerts, plotWidth, plotHeight) {
        // Implementation for alert indicators
        return '';
    }
}

module.exports = HomeyViz;
