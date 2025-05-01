'use strict';

const { MockSystemMetrics, SCENARIOS, createMockMetrics } = require('./system-metrics');

describe('Mock System Metrics', () => {
    describe('Basic Functionality', () => {
        test('should create with default values', () => {
            const metrics = new MockSystemMetrics();
            expect(metrics.cpuUsage.current).toBe(0.3);
            expect(metrics.memory.total).toBe(16 * 1024 * 1024 * 1024);
            expect(metrics.heap.total).toBe(1024 * 1024 * 1024);
            expect(metrics.eventLoop.baselag).toBe(1);
        });

        test('should create with custom values', () => {
            const metrics = new MockSystemMetrics({
                cpuUsage: 0.5,
                totalMemory: 8 * 1024 * 1024 * 1024,
                heapTotal: 512 * 1024 * 1024
            });

            expect(metrics.cpuUsage.current).toBe(0.5);
            expect(metrics.memory.total).toBe(8 * 1024 * 1024 * 1024);
            expect(metrics.heap.total).toBe(512 * 1024 * 1024);
        });
    });

    describe('CPU Metrics', () => {
        test('should generate valid CPU metrics', () => {
            const metrics = new MockSystemMetrics();
            const cpu = metrics.getCPUMetrics();

            expect(cpu.usage).toBeGreaterThanOrEqual(0);
            expect(cpu.usage).toBeLessThanOrEqual(1);
            expect(cpu.load).toHaveLength(3);
            expect(cpu.count).toBeGreaterThan(0);
            expect(cpu.times.user + cpu.times.system + cpu.times.idle).toBeGreaterThan(0);
        });

        test('should apply CPU trend', () => {
            const metrics = new MockSystemMetrics({
                cpuUsage: 0.5,
                cpuTrend: 0.1
            });

            const initial = metrics.getCPUMetrics();
            
            // Simulate time passing
            jest.spyOn(Date, 'now').mockReturnValue(Date.now() + 10000);
            
            const later = metrics.getCPUMetrics();
            expect(later.usage).toBeGreaterThan(initial.usage);
        });

        test('should apply CPU noise within bounds', () => {
            const metrics = new MockSystemMetrics({
                cpuUsage: 0.5,
                cpuNoise: 0.1
            });

            const samples = Array(100).fill().map(() => metrics.getCPUMetrics().usage);
            const min = Math.min(...samples);
            const max = Math.max(...samples);

            expect(min).toBeGreaterThanOrEqual(0.4);
            expect(max).toBeLessThanOrEqual(0.6);
        });
    });

    describe('Memory Metrics', () => {
        test('should generate valid memory metrics', () => {
            const metrics = new MockSystemMetrics();
            const memory = metrics.getMemoryMetrics();

            expect(memory.total).toBeGreaterThan(0);
            expect(memory.used).toBeLessThanOrEqual(memory.total);
            expect(memory.free).toBe(memory.total - memory.used);
            expect(memory.processUsage).toBeDefined();
        });

        test('should maintain memory constraints', () => {
            const metrics = new MockSystemMetrics();
            const samples = Array(100).fill().map(() => metrics.getMemoryMetrics());

            samples.forEach(memory => {
                expect(memory.used).toBeLessThanOrEqual(memory.total);
                expect(memory.free).toBeGreaterThanOrEqual(0);
                expect(memory.buffers + memory.cached).toBeLessThan(memory.used);
            });
        });
    });

    describe('Heap Metrics', () => {
        test('should generate valid heap metrics', () => {
            const metrics = new MockSystemMetrics();
            const heap = metrics.getHeapMetrics();

            expect(heap.used).toBeLessThanOrEqual(heap.limit);
            expect(heap.spaces).toHaveLength(5);
            expect(heap.spaces.every(space => 
                space.used <= space.size &&
                space.available >= 0
            )).toBe(true);
        });

        test('should maintain heap space proportions', () => {
            const metrics = new MockSystemMetrics();
            const heap = metrics.getHeapMetrics();

            const totalSpace = heap.spaces.reduce((sum, space) => sum + space.size, 0);
            expect(totalSpace).toBe(heap.total);
        });
    });

    describe('Event Loop Metrics', () => {
        test('should generate valid event loop metrics', () => {
            const metrics = new MockSystemMetrics();
            const eventLoop = metrics.getEventLoopMetrics();

            expect(eventLoop.lag).toBeGreaterThanOrEqual(0);
            expect(eventLoop.activeTasks).toBeGreaterThanOrEqual(0);
            expect(eventLoop.activeHandles).toBeGreaterThanOrEqual(0);
        });

        test('should apply event loop noise', () => {
            const metrics = new MockSystemMetrics({
                eventLoopLag: 5,
                eventLoopNoise: 2
            });

            const samples = Array(100).fill().map(() => metrics.getEventLoopMetrics().lag);
            const min = Math.min(...samples);
            const max = Math.max(...samples);

            expect(min).toBeGreaterThanOrEqual(3);
            expect(max).toBeLessThanOrEqual(7);
        });
    });

    describe('Load Simulation', () => {
        test('should increase load correctly', () => {
            const metrics = new MockSystemMetrics({ cpuUsage: 0.4 });
            const initial = metrics.getCPUMetrics();
            
            metrics.increaseLoad(1.5);
            const after = metrics.getCPUMetrics();

            expect(after.usage).toBeGreaterThan(initial.usage);
        });

        test('should decrease load correctly', () => {
            const metrics = new MockSystemMetrics({ cpuUsage: 0.6 });
            const initial = metrics.getCPUMetrics();
            
            metrics.decreaseLoad(0.5);
            const after = metrics.getCPUMetrics();

            expect(after.usage).toBeLessThan(initial.usage);
        });

        test('should respect system limits', () => {
            const metrics = new MockSystemMetrics({ cpuUsage: 0.8 });
            metrics.increaseLoad(2);
            
            const cpu = metrics.getCPUMetrics();
            const memory = metrics.getMemoryMetrics();
            const heap = metrics.getHeapMetrics();

            expect(cpu.usage).toBeLessThanOrEqual(1);
            expect(memory.used).toBeLessThanOrEqual(memory.total);
            expect(heap.used).toBeLessThanOrEqual(heap.limit);
        });
    });

    describe('Predefined Scenarios', () => {
        test('should create normal scenario', () => {
            const metrics = createMockMetrics('normal');
            const cpu = metrics.getCPUMetrics();
            const memory = metrics.getMemoryMetrics();
            
            expect(cpu.usage).toBeCloseTo(0.3, 1);
            expect(memory.used).toBeLessThan(memory.total);
        });

        test('should create high load scenario', () => {
            const metrics = createMockMetrics('high');
            const cpu = metrics.getCPUMetrics();
            const eventLoop = metrics.getEventLoopMetrics();
            
            expect(cpu.usage).toBeGreaterThan(0.7);
            expect(eventLoop.lag).toBeGreaterThan(5);
        });

        test('should create degrading scenario', () => {
            const metrics = createMockMetrics('degrading');
            
            const initial = metrics.getCPUMetrics();
            jest.spyOn(Date, 'now').mockReturnValue(Date.now() + 3600000); // 1 hour later
            const later = metrics.getCPUMetrics();
            
            expect(later.usage).toBeGreaterThan(initial.usage);
        });

        test('should create unstable scenario', () => {
            const metrics = createMockMetrics('unstable');
            const samples = Array(100).fill().map(() => metrics.getCPUMetrics().usage);
            
            const stdDev = Math.sqrt(
                samples.reduce((acc, val) => acc + Math.pow(val - 0.5, 2), 0) / samples.length
            );
            
            expect(stdDev).toBeGreaterThan(0.1);
        });

        test('should handle invalid scenario gracefully', () => {
            const metrics = createMockMetrics('nonexistent');
            expect(metrics).toBeInstanceOf(MockSystemMetrics);
            expect(metrics.getCPUMetrics().usage).toBeDefined();
        });
    });

    describe('System Info', () => {
        test('should provide consistent system info', () => {
            const metrics = new MockSystemMetrics();
            const info = metrics.getSystemInfo();

            expect(info.platform).toBe('linux');
            expect(info.hostname).toBe('test-host');
            expect(info.uptime).toBeGreaterThanOrEqual(0);
            expect(Array.isArray(info.loadavg)).toBe(true);
            expect(info.loadavg).toHaveLength(3);
        });

        test('should track uptime correctly', () => {
            const metrics = new MockSystemMetrics();
            const initial = metrics.getSystemInfo();
            
            jest.spyOn(Date, 'now').mockReturnValue(Date.now() + 1000);
            const later = metrics.getSystemInfo();
            
            expect(later.uptime).toBeGreaterThan(initial.uptime);
        });
    });
});
