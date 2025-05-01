'use strict';

/**
 * Timing simulator for performance testing
 */
class TimingSimulator {
    constructor(options = {}) {
        this.baseLatency = options.baseLatency || 100;
        this.jitter = options.jitter || 0.1;
        this.degradation = options.degradation || 0;
        this.spikes = options.spikes || [];
        this.startTime = Date.now();
    }

    /**
     * Simulate operation timing with various conditions
     */
    async simulateOperation(operation = 'default', load = 1) {
        const baseTime = this.calculateBaseTime(operation);
        const jitterTime = this.calculateJitter(baseTime);
        const degradedTime = this.applyDegradation(baseTime + jitterTime);
        const spikeTime = this.applySpikeIfAny(degradedTime);
        const finalTime = this.applyLoad(spikeTime, load);

        await this.sleep(finalTime);
        return finalTime;
    }

    /**
     * Calculate base operation time
     */
    calculateBaseTime(operation) {
        const operationTimes = {
            versionUpdate: this.baseLatency,
            release: this.baseLatency * 3,
            rollback: this.baseLatency * 2,
            default: this.baseLatency
        };

        return operationTimes[operation] || operationTimes.default;
    }

    /**
     * Add random jitter to timing
     */
    calculateJitter(baseTime) {
        const jitterRange = baseTime * this.jitter;
        return (Math.random() * 2 - 1) * jitterRange;
    }

    /**
     * Apply cumulative degradation
     */
    applyDegradation(time) {
        const runTime = (Date.now() - this.startTime) / 1000; // seconds
        const degradationFactor = 1 + (this.degradation * runTime);
        return time * degradationFactor;
    }

    /**
     * Apply performance spikes if scheduled
     */
    applySpikeIfAny(time) {
        const currentTime = Date.now();
        const activeSpike = this.spikes.find(spike => 
            currentTime >= spike.start && currentTime <= spike.end
        );

        return activeSpike ? time * activeSpike.factor : time;
    }

    /**
     * Apply system load factor
     */
    applyLoad(time, load) {
        return time * Math.max(1, load);
    }

    /**
     * Sleep helper
     */
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

/**
 * System load simulator
 */
class SystemLoadSimulator {
    constructor(options = {}) {
        this.cpuLoad = options.cpuLoad || 0.3;
        this.memoryLoad = options.memoryLoad || 0.5;
        this.loadVariation = options.loadVariation || 0.1;
        this.spikeInterval = options.spikeInterval || 0;
        this.spikeProbability = options.spikeProbability || 0.1;
        this.startTime = Date.now();
    }

    /**
     * Get current system load
     */
    getCurrentLoad() {
        const baseLoad = this.calculateBaseLoad();
        const variationLoad = this.applyLoadVariation(baseLoad);
        const spikeLoad = this.applySpikeIfDue(variationLoad);
        return this.normalizeLoad(spikeLoad);
    }

    /**
     * Calculate base system load
     */
    calculateBaseLoad() {
        const runTime = (Date.now() - this.startTime) / 1000;
        return {
            cpu: this.cpuLoad + (Math.sin(runTime / 60) * 0.1), // Simulate natural oscillation
            memory: this.memoryLoad + (runTime / 3600) * 0.1 // Gradual memory increase
        };
    }

    /**
     * Apply random load variation
     */
    applyLoadVariation(load) {
        const variation = (Math.random() * 2 - 1) * this.loadVariation;
        return {
            cpu: load.cpu * (1 + variation),
            memory: load.memory * (1 + variation)
        };
    }

    /**
     * Apply load spikes if due
     */
    applySpikeIfDue(load) {
        if (!this.spikeInterval) return load;

        const shouldSpike = Math.random() < this.spikeProbability;
        if (!shouldSpike) return load;

        return {
            cpu: load.cpu * (1 + Math.random()),
            memory: load.memory * (1 + Math.random() * 0.5)
        };
    }

    /**
     * Normalize load values
     */
    normalizeLoad(load) {
        return {
            cpu: Math.min(1, Math.max(0, load.cpu)),
            memory: Math.min(1, Math.max(0, load.memory))
        };
    }
}

/**
 * Network latency simulator
 */
class NetworkLatencySimulator {
    constructor(options = {}) {
        this.baseLatency = options.baseLatency || 50;
        this.jitter = options.jitter || 0.2;
        this.packetLoss = options.packetLoss || 0.01;
        this.congestionProbability = options.congestionProbability || 0.05;
        this.congestionDuration = options.congestionDuration || 5000;
        this.lastCongestion = 0;
    }

    /**
     * Simulate network operation
     */
    async simulateNetworkOperation(size = 1) {
        if (Math.random() < this.packetLoss) {
            throw new Error('Simulated packet loss');
        }

        const latency = this.calculateLatency(size);
        await this.sleep(latency);
        return latency;
    }

    /**
     * Calculate operation latency
     */
    calculateLatency(size) {
        let latency = this.baseLatency * size;
        latency += this.calculateJitter(latency);
        latency = this.applyCongestion(latency);
        return Math.max(1, latency);
    }

    /**
     * Calculate network jitter
     */
    calculateJitter(baseLatency) {
        const jitterRange = baseLatency * this.jitter;
        return (Math.random() * 2 - 1) * jitterRange;
    }

    /**
     * Apply network congestion
     */
    applyCongestion(latency) {
        const now = Date.now();
        
        // Check if we should start new congestion
        if (now - this.lastCongestion > this.congestionDuration &&
            Math.random() < this.congestionProbability) {
            this.lastCongestion = now;
            return latency * (2 + Math.random());
        }
        
        // Check if we're in existing congestion period
        if (now - this.lastCongestion < this.congestionDuration) {
            return latency * (1.5 + Math.random() * 0.5);
        }

        return latency;
    }

    /**
     * Sleep helper
     */
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

module.exports = {
    TimingSimulator,
    SystemLoadSimulator,
    NetworkLatencySimulator,
    createTimingProfile: (type = 'normal') => {
        const profiles = {
            normal: { baseLatency: 100, jitter: 0.1 },
            degraded: { baseLatency: 200, jitter: 0.2, degradation: 0.01 },
            unstable: { baseLatency: 150, jitter: 0.3, spikes: [
                { start: Date.now(), end: Date.now() + 60000, factor: 2 }
            ]}
        };
        return new TimingSimulator(profiles[type]);
    }
};
