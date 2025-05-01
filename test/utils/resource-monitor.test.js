'use strict';

const ResourceMonitor = require('./resource-monitor');

describe('Resource Monitor', () => {
    let monitor;

    beforeEach(() => {
        monitor = new ResourceMonitor({
            interval: 100,
            maxSamples: 10,
            cpuThreshold: 0.8,
            memoryThreshold: 0.8,
            heapThreshold: 0.8,
            eventLoopThreshold: 50
        });
    });

    afterEach(() => {
        monitor.stop();
    });

    describe('Basic Functionality', () => {
        test('should start and stop monitoring', () => {
            expect(monitor.monitoring).toBe(false);
            monitor.start();
            expect(monitor.monitoring).toBe(true);
            monitor.stop();
            expect(monitor.monitoring).toBe(false);
        });

        test('should collect metrics', async () => {
            const metrics = monitor.collectMetrics();
            
            expect(metrics).toHaveProperty('timestamp');
            expect(metrics).toHaveProperty('cpu');
            expect(metrics).toHaveProperty('memory');
            expect(metrics).toHaveProperty('heap');
            expect(metrics).toHaveProperty('eventLoop');
            expect(metrics).toHaveProperty('system');
        });

        test('should maintain sample limit', async () => {
            monitor.start();
            
            // Wait for samples to accumulate
            await new Promise(resolve => setTimeout(resolve, 1200));
            
            expect(monitor.samples.length).toBeLessThanOrEqual(monitor.maxSamples);
        });

        test('should emit metrics events', done => {
            monitor.on('metrics', metrics => {
                expect(metrics).toBeDefined();
                monitor.stop();
                done();
            });
            
            monitor.start();
        });
    });

    describe('Metrics Collection', () => {
        test('should collect CPU metrics', () => {
            const cpu = monitor.getCPUUsage();
            
            expect(cpu).toHaveProperty('usage');
            expect(cpu).toHaveProperty('load');
            expect(cpu).toHaveProperty('count');
            expect(cpu.usage).toBeGreaterThanOrEqual(0);
            expect(cpu.usage).toBeLessThanOrEqual(1);
        });

        test('should collect memory metrics', () => {
            const memory = monitor.getMemoryUsage();
            
            expect(memory).toHaveProperty('total');
            expect(memory).toHaveProperty('free');
            expect(memory).toHaveProperty('used');
            expect(memory).toHaveProperty('usage');
            expect(memory).toHaveProperty('process');
            expect(memory.usage).toBeGreaterThanOrEqual(0);
            expect(memory.usage).toBeLessThanOrEqual(1);
        });

        test('should collect heap metrics', () => {
            const heap = monitor.getHeapMetrics();
            
            expect(heap).toHaveProperty('total');
            expect(heap).toHaveProperty('used');
            expect(heap).toHaveProperty('limit');
            expect(heap).toHaveProperty('usage');
            expect(heap).toHaveProperty('spaces');
            expect(heap.usage).toBeGreaterThanOrEqual(0);
            expect(heap.usage).toBeLessThanOrEqual(1);
        });

        test('should collect event loop metrics', async () => {
            monitor.start();
            await new Promise(resolve => setTimeout(resolve, 200));
            
            const eventLoop = monitor.getEventLoopMetrics();
            expect(eventLoop).toHaveProperty('lag');
            expect(eventLoop).toHaveProperty('activeTasks');
            expect(eventLoop).toHaveProperty('activeHandles');
        });
    });

    describe('Threshold Alerts', () => {
        test('should emit CPU threshold alerts', done => {
            const originalGetCPUUsage = monitor.getCPUUsage;
            monitor.getCPUUsage = () => ({ usage: 0.9, load: [0.5], count: 4 });

            monitor.on('alert', alert => {
                expect(alert.type).toBe('cpu');
                expect(alert.value).toBeGreaterThan(monitor.thresholds.cpu);
                monitor.getCPUUsage = originalGetCPUUsage;
                done();
            });

            monitor.collectMetrics();
        });

        test('should emit memory threshold alerts', done => {
            const originalGetMemoryUsage = monitor.getMemoryUsage;
            monitor.getMemoryUsage = () => ({
                total: 1000,
                free: 100,
                used: 900,
                usage: 0.9,
                process: process.memoryUsage()
            });

            monitor.on('alert', alert => {
                expect(alert.type).toBe('memory');
                expect(alert.value).toBeGreaterThan(monitor.thresholds.memory);
                monitor.getMemoryUsage = originalGetMemoryUsage;
                done();
            });

            monitor.collectMetrics();
        });

        test('should emit heap threshold alerts', done => {
            const originalGetHeapMetrics = monitor.getHeapMetrics;
            monitor.getHeapMetrics = () => ({
                total: 1000,
                used: 900,
                limit: 1000,
                usage: 0.9,
                spaces: []
            });

            monitor.on('alert', alert => {
                expect(alert.type).toBe('heap');
                expect(alert.value).toBeGreaterThan(monitor.thresholds.heap);
                monitor.getHeapMetrics = originalGetHeapMetrics;
                done();
            });

            monitor.collectMetrics();
        });
    });

    describe('Statistics', () => {
        test('should calculate correct statistics', async () => {
            monitor.start();
            
            // Collect some samples
            await new Promise(resolve => setTimeout(resolve, 500));
            
            const stats = monitor.getStatistics();
            expect(stats).toHaveProperty('duration');
            expect(stats).toHaveProperty('samples');
            expect(stats).toHaveProperty('cpu');
            expect(stats).toHaveProperty('memory');
            expect(stats).toHaveProperty('heap');
            expect(stats).toHaveProperty('eventLoop');

            // Verify statistics calculations
            const cpuStats = stats.cpu;
            expect(cpuStats).toHaveProperty('min');
            expect(cpuStats).toHaveProperty('max');
            expect(cpuStats).toHaveProperty('mean');
            expect(cpuStats).toHaveProperty('median');
            expect(cpuStats).toHaveProperty('p95');
            expect(cpuStats).toHaveProperty('p99');
        });

        test('should handle no samples', () => {
            const stats = monitor.getStatistics();
            expect(stats).toBeNull();
        });

        test('should calculate percentiles correctly', () => {
            // Create known sample set
            const values = Array(100).fill().map((_, i) => i);
            const stats = monitor.calculateStats(values);
            
            expect(stats.min).toBe(0);
            expect(stats.max).toBe(99);
            expect(stats.median).toBe(49);
            expect(stats.p95).toBe(94);
            expect(stats.p99).toBe(98);
        });
    });

    describe('Resource Usage', () => {
        test('should not leak memory', async () => {
            const initialMemory = process.memoryUsage().heapUsed;
            
            monitor.start();
            await new Promise(resolve => setTimeout(resolve, 1000));
            monitor.stop();

            const finalMemory = process.memoryUsage().heapUsed;
            const increase = (finalMemory - initialMemory) / 1024 / 1024; // MB
            
            expect(increase).toBeLessThan(5); // Less than 5MB increase
        });

        test('should handle rapid start/stop cycles', () => {
            for (let i = 0; i < 100; i++) {
                monitor.start();
                monitor.stop();
            }
            
            expect(monitor.monitoring).toBe(false);
            expect(monitor.timer).toBeUndefined();
            expect(monitor.lagTimer).toBeUndefined();
        });
    });
});
