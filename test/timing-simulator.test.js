'use strict';

const {
    TimingSimulator,
    SystemLoadSimulator,
    NetworkLatencySimulator,
    createTimingProfile
} = require('./mocks/timing-simulator');

describe('Timing Simulators', () => {
    describe('Operation Timing', () => {
        let simulator;

        beforeEach(() => {
            simulator = new TimingSimulator({
                baseLatency: 100,
                jitter: 0.1,
                degradation: 0.01
            });
        });

        test('should respect base latency', async () => {
            const time = await simulator.simulateOperation('versionUpdate');
            expect(time).toBeGreaterThan(90);  // Allow for negative jitter
            expect(time).toBeLessThan(110);    // Allow for positive jitter
        });

        test('should apply different timings for operations', async () => {
            const versionTime = await simulator.simulateOperation('versionUpdate');
            const releaseTime = await simulator.simulateOperation('release');
            expect(releaseTime).toBeGreaterThan(versionTime * 2);
        });

        test('should apply performance degradation over time', async () => {
            const initialTime = await simulator.simulateOperation('default');
            
            // Simulate passage of time
            simulator.startTime = Date.now() - 3600000; // 1 hour ago
            
            const laterTime = await simulator.simulateOperation('default');
            expect(laterTime).toBeGreaterThan(initialTime);
        });

        test('should handle performance spikes', async () => {
            const spike = {
                start: Date.now(),
                end: Date.now() + 1000,
                factor: 2
            };
            
            simulator = new TimingSimulator({
                baseLatency: 100,
                spikes: [spike]
            });

            const time = await simulator.simulateOperation('default');
            expect(time).toBeGreaterThan(180);  // Should be roughly doubled
        });
    });

    describe('System Load', () => {
        let simulator;

        beforeEach(() => {
            simulator = new SystemLoadSimulator({
                cpuLoad: 0.3,
                memoryLoad: 0.5,
                loadVariation: 0.1
            });
        });

        test('should generate valid load values', () => {
            const load = simulator.getCurrentLoad();
            expect(load.cpu).toBeGreaterThan(0);
            expect(load.cpu).toBeLessThan(1);
            expect(load.memory).toBeGreaterThan(0);
            expect(load.memory).toBeLessThan(1);
        });

        test('should simulate gradual memory increase', () => {
            const initial = simulator.getCurrentLoad();
            
            // Simulate passage of time
            simulator.startTime = Date.now() - 3600000; // 1 hour ago
            
            const later = simulator.getCurrentLoad();
            expect(later.memory).toBeGreaterThan(initial.memory);
        });

        test('should generate load spikes', () => {
            simulator = new SystemLoadSimulator({
                cpuLoad: 0.3,
                spikeInterval: 100,
                spikeProbability: 1 // Force spike
            });

            const load = simulator.getCurrentLoad();
            expect(load.cpu).toBeGreaterThan(0.3);
        });

        test('should maintain load within bounds', () => {
            // Test multiple samples
            const samples = Array(100).fill().map(() => simulator.getCurrentLoad());
            
            samples.forEach(load => {
                expect(load.cpu).toBeGreaterThanOrEqual(0);
                expect(load.cpu).toBeLessThanOrEqual(1);
                expect(load.memory).toBeGreaterThanOrEqual(0);
                expect(load.memory).toBeLessThanOrEqual(1);
            });
        });
    });

    describe('Network Latency', () => {
        let simulator;

        beforeEach(() => {
            simulator = new NetworkLatencySimulator({
                baseLatency: 50,
                jitter: 0.2,
                packetLoss: 0.1
            });
        });

        test('should simulate network operations', async () => {
            const latency = await simulator.simulateNetworkOperation();
            expect(latency).toBeGreaterThan(0);
        });

        test('should scale with operation size', async () => {
            const smallOp = await simulator.simulateNetworkOperation(1);
            const largeOp = await simulator.simulateNetworkOperation(2);
            expect(largeOp).toBeGreaterThan(smallOp);
        });

        test('should simulate packet loss', async () => {
            simulator = new NetworkLatencySimulator({
                packetLoss: 1 // Force packet loss
            });

            await expect(simulator.simulateNetworkOperation())
                .rejects.toThrow('Simulated packet loss');
        });

        test('should simulate network congestion', async () => {
            simulator = new NetworkLatencySimulator({
                baseLatency: 50,
                congestionProbability: 1 // Force congestion
            });

            const latency = await simulator.simulateNetworkOperation();
            expect(latency).toBeGreaterThan(100); // Should be at least doubled
        });

        test('should maintain congestion for duration', async () => {
            simulator = new NetworkLatencySimulator({
                baseLatency: 50,
                congestionDuration: 100,
                congestionProbability: 1
            });

            // First operation triggers congestion
            await simulator.simulateNetworkOperation();
            
            // Second operation should still be under congestion
            const latency = await simulator.simulateNetworkOperation();
            expect(latency).toBeGreaterThan(75); // Should be at least 1.5x
        });
    });

    describe('Timing Profiles', () => {
        test('should create normal profile', () => {
            const simulator = createTimingProfile('normal');
            expect(simulator.baseLatency).toBe(100);
            expect(simulator.jitter).toBe(0.1);
        });

        test('should create degraded profile', () => {
            const simulator = createTimingProfile('degraded');
            expect(simulator.baseLatency).toBe(200);
            expect(simulator.degradation).toBe(0.01);
        });

        test('should create unstable profile', () => {
            const simulator = createTimingProfile('unstable');
            expect(simulator.spikes.length).toBe(1);
            expect(simulator.jitter).toBe(0.3);
        });

        test('should handle invalid profile type', () => {
            const simulator = createTimingProfile('invalid');
            expect(simulator.baseLatency).toBe(100); // Should use normal defaults
        });
    });

    describe('Integration', () => {
        test('should work together in realistic scenario', async () => {
            const timing = new TimingSimulator({ baseLatency: 100 });
            const system = new SystemLoadSimulator({ cpuLoad: 0.3 });
            const network = new NetworkLatencySimulator({ baseLatency: 50 });

            // Simulate complete operation
            const load = system.getCurrentLoad();
            const operationTime = await timing.simulateOperation('default', load.cpu);
            const totalTime = operationTime + await network.simulateNetworkOperation();

            expect(totalTime).toBeGreaterThan(100);
            expect(load.cpu).toBeGreaterThan(0);
        });
    });
});
