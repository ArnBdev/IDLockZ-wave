'use strict';

const {
    TimingSimulator,
    SystemLoadSimulator,
    NetworkLatencySimulator
} = require('../mocks/timing-simulator');

describe('Timing Simulator Stress Tests', () => {
    const STRESS_DURATION = 10000; // 10 seconds
    const HIGH_CONCURRENCY = 100;

    describe('High Concurrency', () => {
        test('should handle multiple simultaneous operations', async () => {
            const simulator = new TimingSimulator({ baseLatency: 50 });
            const startTime = Date.now();
            const operations = [];

            // Launch many concurrent operations
            for (let i = 0; i < HIGH_CONCURRENCY; i++) {
                operations.push(simulator.simulateOperation('versionUpdate'));
            }

            const results = await Promise.all(operations);
            const endTime = Date.now();

            // Verify timing
            expect(endTime - startTime).toBeLessThan(STRESS_DURATION);
            results.forEach(time => {
                expect(time).toBeGreaterThan(0);
                expect(time).toBeLessThan(1000);
            });
        }, STRESS_DURATION + 1000);

        test('should maintain accuracy under load', async () => {
            const simulator = new TimingSimulator({ baseLatency: 100 });
            const timings = [];

            // Run continuous operations
            const startTime = Date.now();
            while (Date.now() - startTime < STRESS_DURATION) {
                timings.push(await simulator.simulateOperation('default'));
            }

            // Calculate statistics
            const mean = timings.reduce((a, b) => a + b) / timings.length;
            const stdDev = Math.sqrt(
                timings.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / timings.length
            );

            // Verify consistency
            expect(mean).toBeGreaterThan(90);
            expect(mean).toBeLessThan(110);
            expect(stdDev).toBeLessThan(20);
        }, STRESS_DURATION + 1000);
    });

    describe('System Load Stress', () => {
        test('should handle rapid load changes', async () => {
            const simulator = new SystemLoadSimulator({
                cpuLoad: 0.5,
                loadVariation: 0.3,
                spikeInterval: 100,
                spikeProbability: 0.2
            });

            const loads = [];
            const startTime = Date.now();

            // Collect load samples rapidly
            while (Date.now() - startTime < STRESS_DURATION) {
                loads.push(simulator.getCurrentLoad());
            }

            // Verify load boundaries
            loads.forEach(load => {
                expect(load.cpu).toBeGreaterThanOrEqual(0);
                expect(load.cpu).toBeLessThanOrEqual(1);
                expect(load.memory).toBeGreaterThanOrEqual(0);
                expect(load.memory).toBeLessThanOrEqual(1);
            });

            // Check for spikes
            const spikes = loads.filter(load => load.cpu > 0.8);
            expect(spikes.length).toBeGreaterThan(0);
        }, STRESS_DURATION + 1000);

        test('should handle memory pressure', async () => {
            const simulator = new SystemLoadSimulator({
                memoryLoad: 0.8,
                loadVariation: 0.1
            });

            const largeArrays = [];
            const loads = [];

            try {
                const startTime = Date.now();
                while (Date.now() - startTime < STRESS_DURATION) {
                    // Create memory pressure
                    largeArrays.push(Buffer.alloc(1024 * 1024)); // 1MB
                    loads.push(simulator.getCurrentLoad());
                }

                // Verify memory load increases
                const initialLoad = loads[0].memory;
                const finalLoad = loads[loads.length - 1].memory;
                expect(finalLoad).toBeGreaterThan(initialLoad);
            } finally {
                largeArrays.length = 0;
                global.gc && global.gc();
            }
        }, STRESS_DURATION + 1000);
    });

    describe('Network Stress', () => {
        test('should handle network saturation', async () => {
            const simulator = new NetworkLatencySimulator({
                baseLatency: 50,
                congestionProbability: 0.3,
                congestionDuration: 1000
            });

            const operations = [];
            let failures = 0;

            // Saturate with concurrent operations
            for (let i = 0; i < HIGH_CONCURRENCY; i++) {
                operations.push(
                    simulator.simulateNetworkOperation(Math.random() * 5)
                        .catch(() => { failures++; })
                );
            }

            await Promise.all(operations);

            // Expect some failures due to congestion
            expect(failures).toBeGreaterThan(0);
            expect(failures).toBeLessThan(HIGH_CONCURRENCY);
        }, STRESS_DURATION + 1000);

        test('should recover from extreme congestion', async () => {
            const simulator = new NetworkLatencySimulator({
                baseLatency: 50,
                congestionProbability: 1,
                congestionDuration: 2000
            });

            // Force congestion
            const congested = await simulator.simulateNetworkOperation(5);
            expect(congested).toBeGreaterThan(200);

            // Wait for recovery
            await new Promise(resolve => setTimeout(resolve, 2500));

            // Verify recovery
            const recovered = await simulator.simulateNetworkOperation(1);
            expect(recovered).toBeLessThan(congested);
        }, STRESS_DURATION + 1000);
    });

    describe('Integration Stress', () => {
        test('should handle complex scenarios', async () => {
            const timing = new TimingSimulator({ 
                baseLatency: 100,
                degradation: 0.01,
                spikes: [
                    { 
                        start: Date.now() + 2000,
                        end: Date.now() + 3000,
                        factor: 2
                    }
                ]
            });

            const system = new SystemLoadSimulator({
                cpuLoad: 0.6,
                spikeInterval: 500
            });

            const network = new NetworkLatencySimulator({
                baseLatency: 30,
                congestionProbability: 0.2
            });

            const results = [];
            const startTime = Date.now();

            // Run mixed operations under stress
            while (Date.now() - startTime < STRESS_DURATION) {
                const load = system.getCurrentLoad();
                
                try {
                    const opTime = await timing.simulateOperation('versionUpdate', load.cpu);
                    const netTime = await network.simulateNetworkOperation(Math.random() * 2);
                    results.push(opTime + netTime);
                } catch (error) {
                    results.push(-1); // Mark failed operations
                }
            }

            // Analyze results
            const successfulOps = results.filter(r => r > 0);
            const failedOps = results.filter(r => r === -1);

            expect(successfulOps.length).toBeGreaterThan(0);
            expect(failedOps.length).toBeLessThan(results.length * 0.2); // Max 20% failure rate
        }, STRESS_DURATION + 2000);
    });
});
