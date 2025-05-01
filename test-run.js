'use strict';

const simulator = require('./test/mocks/simulator-manager');

// Create test device
const device = simulator.createSimulator({
    id: 'test-lock-1',
    name: 'Test Lock 1'
});

// Print test status
setInterval(() => {
    const status = simulator.getStatus();
    console.log('\nTest Status:', JSON.stringify(status, null, 2));
}, 10000);

// Run test scenarios
async function runTests() {
    try {
        console.log('Starting performance monitoring tests...');

        // Test 1: Battery drain
        console.log('\nRunning battery drain test...');
        await simulator.startScenario(device, 'battery_drain');
        await new Promise(r => setTimeout(r, 30000));

        // Test 2: Memory leak
        console.log('\nRunning memory leak test...');
        await simulator.startScenario(device, 'memory_leak');
        await new Promise(r => setTimeout(r, 30000));

        // Test 3: High load
        console.log('\nRunning high load test...');
        await simulator.startScenario(device, 'high_load');
        await new Promise(r => setTimeout(r, 30000));

        // Test 4: Connection issues
        console.log('\nRunning connection test...');
        await simulator.startScenario(device, 'connection_issues');
        await new Promise(r => setTimeout(r, 30000));

        console.log('\nTests completed. Press Ctrl+C to exit.');
    } catch (error) {
        console.error('Test error:', error);
        process.exit(1);
    }
}

// Handle cleanup
process.on('SIGINT', async () => {
    console.log('\nStopping tests...');
    await simulator.stopAllTests();
    process.exit();
});

// Run tests
runTests();
