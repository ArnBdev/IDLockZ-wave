'use strict';

const Homey = require('homey');
const HomeyMonitor = require('../lib/homey-monitor');

class MonitoredDevice extends Homey.Device {
    async onInit() {
        // Initialize monitoring
        this.monitor = new HomeyMonitor({
            storageRotation: 100,            // Keep last 100 samples
            sampleInterval: 300000,          // Sample every 5 minutes
            batteryWarningThreshold: 15,     // Alert at 15% battery
            memoryWarningThreshold: 0.85     // Alert at 85% memory usage
        });

        // Start monitoring this device
        await this.monitor.initDevice(this);

        // Listen for monitoring errors
        this.monitor.on('error', ({ deviceId, error }) => {
            this.log(`Monitoring error for device ${deviceId}: ${error}`);
        });

        // Register maintenance action for performance report
        this.registerCapabilityListener('button.performance_report', async () => {
            const report = await this.monitor.getDeviceReport(this);
            if (report) {
                return this.generateReportSummary(report);
            }
            return 'No performance data available';
        });
    }

    async onSettings({ oldSettings, newSettings, changedKeys }) {
        // Update monitoring settings if changed
        if (changedKeys.includes('monitoringInterval')) {
            await this.monitor.stopDevice(this);
            this.monitor.options.sampleInterval = newSettings.monitoringInterval;
            await this.monitor.initDevice(this);
        }
    }

    /**
     * Generate human-readable report summary
     */
    generateReportSummary(report) {
        const summary = [];
        
        // Add general info
        summary.push(`Last updated: ${new Date(report.lastUpdate).toLocaleString()}`);
        summary.push(`Samples collected: ${report.samples.length}`);

        // Add alerts if any
        if (report.alerts && report.alerts.length > 0) {
            summary.push('\nActive Alerts:');
            report.alerts.forEach(alert => {
                summary.push(`- ${alert.message} (${alert.level})`);
            });
        }

        // Add performance summary
        if (report.summary) {
            summary.push('\nPerformance Summary:');
            summary.push(`Memory growth: ${formatBytes(report.summary.memoryGrowth)}/sample`);
            summary.push(`Average CPU load: ${(report.summary.averageCpuLoad / 1000000).toFixed(2)}ms`);
        }

        return summary.join('\n');
    }
}

module.exports = MonitoredDevice;

/**
 * Format bytes to human readable string
 */
function formatBytes(bytes) {
    if (Math.abs(bytes) < 1024) {
        return bytes + ' B';
    }
    const units = ['KB', 'MB', 'GB'];
    let u = -1;
    let b = Math.abs(bytes);
    do {
        b /= 1024;
        u++;
    } while (b >= 1024 && u < units.length - 1);
    return (bytes < 0 ? '-' : '') + b.toFixed(2) + ' ' + units[u];
}
