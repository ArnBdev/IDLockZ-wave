'use strict';

const HomeyViz = require('../lib/homey-viz');

describe('HomeyViz', () => {
    let viz;
    let mockData;

    beforeEach(() => {
        viz = new HomeyViz({
            width: 400,
            height: 200
        });

        // Create mock performance data
        mockData = {
            deviceId: 'test-device',
            lastUpdate: Date.now(),
            samples: [
                {
                    timestamp: Date.now() - 3600000,
                    memory: {
                        heapUsed: 50000000,
                        heapTotal: 100000000,
                        external: 0,
                        rss: 150000000
                    },
                    cpu: {
                        user: 1000000,
                        system: 500000
                    }
                },
                {
                    timestamp: Date.now(),
                    memory: {
                        heapUsed: 60000000,
                        heapTotal: 100000000,
                        external: 0,
                        rss: 160000000
                    },
                    cpu: {
                        user: 1200000,
                        system: 600000
                    }
                }
            ],
            alerts: [],
            summary: {
                memoryGrowth: 10000000,
                averageCpuLoad: 1100000,
                sampleCount: 2
            },
            device: {
                battery: 80
            }
        };
    });

    describe('SVG Generation', () => {
        test('should generate timeline SVG', () => {
            const svg = viz.generateSVG(mockData, 'timeline');
            
            expect(svg).toContain('<svg');
            expect(svg).toContain('</svg>');
            expect(svg).toContain('path class="data"');
            expect(svg).toContain('stroke="#4CAF50"'); // Memory color
        });

        test('should generate summary SVG', () => {
            const svg = viz.generateSVG(mockData, 'summary');
            
            expect(svg).toContain('<svg');
            expect(svg).toContain('Memory');
            expect(svg).toContain('CPU Load');
            expect(svg).toContain('Battery');
            expect(svg).toContain('MB/sample');
        });

        test('should generate status SVG', () => {
            const svg = viz.generateSVG(mockData, 'status');
            
            expect(svg).toContain('<svg');
            expect(svg).toContain('NORMAL');
            expect(svg).toContain('circle');
        });

        test('should handle empty data', () => {
            const emptyData = {
                samples: [],
                alerts: [],
                summary: {
                    memoryGrowth: 0,
                    averageCpuLoad: 0,
                    sampleCount: 0
                }
            };

            expect(() => viz.generateSVG(emptyData, 'timeline')).not.toThrow();
            expect(() => viz.generateSVG(emptyData, 'summary')).not.toThrow();
            expect(() => viz.generateSVG(emptyData, 'status')).not.toThrow();
        });

        test('should throw on invalid type', () => {
            expect(() => viz.generateSVG(mockData, 'invalid')).toThrow();
        });
    });

    describe('Timeline Visualization', () => {
        test('should scale data points correctly', () => {
            const svg = viz.generateSVG(mockData, 'timeline');
            const path = svg.match(/path class="data" d="([^"]+)"/)[1];
            const points = path.split(' ');
            
            // Should have correct number of points
            expect(points.length).toBe(mockData.samples.length * 2);
            
            // Points should be within SVG bounds
            points.forEach((point, i) => {
                if (i % 2 === 1) { // Y coordinates
                    const y = parseFloat(point);
                    expect(y).toBeGreaterThanOrEqual(viz.options.padding);
                    expect(y).toBeLessThanOrEqual(viz.options.height - viz.options.padding);
                }
            });
        });

        test('should handle alerts', () => {
            mockData.alerts.push({
                type: 'memory',
                level: 'warning',
                message: 'High memory usage'
            });

            const svg = viz.generateSVG(mockData, 'timeline');
            expect(svg).toContain(colors.error);
        });
    });

    describe('Summary Visualization', () => {
        test('should format values correctly', () => {
            const svg = viz.generateSVG(mockData, 'summary');
            
            // Check memory growth formatting
            const memoryGrowth = (mockData.summary.memoryGrowth / 1024 / 1024).toFixed(2);
            expect(svg).toContain(`${memoryGrowth}MB/sample`);
            
            // Check CPU load formatting
            const cpuLoad = (mockData.summary.averageCpuLoad / 1000000).toFixed(2);
            expect(svg).toContain(`${cpuLoad}ms`);
        });

        test('should handle missing battery data', () => {
            delete mockData.device.battery;
            const svg = viz.generateSVG(mockData, 'summary');
            expect(svg).not.toContain('Battery');
        });
    });

    describe('Status Visualization', () => {
        test('should show warning status', () => {
            mockData.alerts.push({
                type: 'memory',
                level: 'warning',
                message: 'High memory usage'
            });

            const svg = viz.generateSVG(mockData, 'status');
            expect(svg).toContain('WARNING');
            expect(svg).toContain(colors.error);
        });

        test('should show normal status', () => {
            const svg = viz.generateSVG(mockData, 'status');
            expect(svg).toContain('NORMAL');
            expect(svg).toContain(colors.memory);
        });
    });

    describe('Customization', () => {
        test('should respect custom dimensions', () => {
            const customViz = new HomeyViz({
                width: 1000,
                height: 500,
                padding: 50
            });

            const svg = customViz.generateSVG(mockData, 'timeline');
            expect(svg).toContain('width="1000"');
            expect(svg).toContain('height="500"');
        });

        test('should apply custom styling', () => {
            const customViz = new HomeyViz({
                lineWidth: 4,
                pointRadius: 5
            });

            const svg = customViz.generateSVG(mockData, 'timeline');
            expect(svg).toContain('stroke-width="4"');
        });
    });
});
