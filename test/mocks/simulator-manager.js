'use strict';

const DeviceSimulator = require('./device-simulator');

/**
 * Manages device simulators for testing
 */
class SimulatorManager {
    constructor() {
        this.simulators = new Map();
        this.activeTests = new Set();
    }

    /**
     * Create and register a simulator
     */
    createSimulator(options = {}) {
        const simulator = new DeviceSimulator(options);
        this.simulators.set(simulator.id, simulator);
        return simulator;
    }

    /**
     * Start a test scenario
     */
    async startScenario(simulator, scenario) {
        const testId = `${simulator.id}_${scenario}`;
        
        if (this.activeTests.has(testId)) {
            return;
        }

        this.activeTests.add(testId);

        switch (scenario) {
            case 'battery_drain':
                await this.runBatteryDrainTest(simulator);
                break;
            case 'memory_leak':
                await this.runMemoryLeakTest(simulator);
                break;
            case 'high_load':
                await this.runHighLoadTest(simulator);
                break;
            case 'connection_issues':
                await this.runConnectionTest(simulator);
                break;
            default:
                throw new Error(`Unknown scenario: ${scenario}`);
        }

        this.activeTests.delete(testId);
    }

    /**
     * Run battery drain test
     */
    async runBatteryDrainTest(simulator) {
        const interval = setInterval(() => {
            simulator.simulateBatteryDrain(5);
            if (simulator.state.battery <= 0) {
                clearInterval(interval);
            }
        }, 60000); // Drain every minute

        return () => clearInterval(interval);
    }

    /**
     * Run memory leak test
     */
    async runMemoryLeakTest(simulator) {
        const interval = setInterval(() => {
            simulator.simulateMemoryLeak(500000); // 0.5MB leak
        }, 30000); // Leak every 30 seconds

        return () => clearInterval(interval);
    }

    /**
     * Run high load test
     */
    async runHighLoadTest(simulator) {
        const interval = setInterval(() => {
            simulator.simulateHighLoad(2000); // 2 second load spike
        }, 10000); // Spike every 10 seconds

        return () => clearInterval(interval);
    }

    /**
     * Run connection test
     */
    async runConnectionTest(simulator) {
        const interval = setInterval(async () => {
            if (simulator.getAvailable()) {
                await simulator.setUnavailable('Connection lost');
                setTimeout(() => {
                    simulator.setAvailable();
                }, 5000);
            }
        }, 30000); // Connection issues every 30 seconds

        return () => clearInterval(interval);
    }

    /**
     * Stop all running tests
     */
    async stopAllTests() {
        this.activeTests.clear();
        this.simulators.forEach(simulator => {
            simulator.setAvailable();
        });
    }

    /**
     * Get test status
     */
    getStatus() {
        return {
            activeSimulators: this.simulators.size,
            runningTests: this.activeTests.size,
            simulators: Array.from(this.simulators.values()).map(sim => ({
                id: sim.id,
                available: sim.getAvailable(),
                battery: sim.state.battery
            }))
        };
    }
}

module.exports = new SimulatorManager();
