# Performance Monitoring

This document describes the performance monitoring capabilities integrated into the IDLock Z-Wave app.

## Overview

The monitoring system tracks:
- Memory usage and growth
- CPU utilization
- Battery levels
- Device availability
- Error patterns

## Device Settings

Performance monitoring can be configured per device in the device settings:

1. **Monitoring Interval**: How often metrics are collected (60s - 1h)
2. **Battery Warning Threshold**: When to alert for low battery (5% - 50%)
3. **Memory Warning Threshold**: When to alert for high memory usage (50% - 95%)

## Performance Reports

Device performance reports can be generated from:
1. Device settings page ("Generate Report" button)
2. Device maintenance actions
3. Programmatically via the HomeyMonitor API

Reports include:
- Sample statistics (count, timespan)
- Memory usage patterns
- CPU load averages
- Active alerts
- Battery status (if applicable)

## Storage Management

The monitoring system uses Homey's Device Store for persistent storage:
- Each device maintains its own metrics history
- Automatic rotation of old samples (configurable limit)
- Efficient storage format to minimize space usage

## Best Practices

1. **Monitoring Interval**
   - Default: 5 minutes
   - Minimum: 1 minute
   - Recommended: 5-15 minutes

2. **Storage Rotation**
   - Default: 1000 samples
   - Example retention:
     - 5min interval = ~3.5 days
     - 15min interval = ~10.4 days
     - 60min interval = ~41.7 days

3. **Alert Thresholds**
   - Battery: 15-20% for timely user notification
   - Memory: 80-85% to prevent resource exhaustion

## Integration Example

```javascript
// In your device class
const HomeyMonitor = require('../../lib/homey-monitor');

class MyDevice extends Homey.Device {
    async onInit() {
        this.monitor = new HomeyMonitor({
            storageRotation: 100,            // Keep last 100 samples
            sampleInterval: 300000,          // Sample every 5 minutes
            batteryWarningThreshold: 15,     // Alert at 15% battery
            memoryWarningThreshold: 0.85     // Alert at 85% memory usage
        });

        await this.monitor.initDevice(this);
    }

    async onSettings({ oldSettings, newSettings, changedKeys }) {
        if (changedKeys.includes('monitoringInterval')) {
            await this.monitor.stopDevice(this);
            this.monitor.options.sampleInterval = newSettings.monitoringInterval;
            await this.monitor.initDevice(this);
        }
    }
}
```

## API Reference

### HomeyMonitor Class

#### Constructor Options
```javascript
{
    storageRotation: number,      // Max samples to keep
    sampleInterval: number,       // Ms between samples
    batteryWarningThreshold: number, // 0-100
    memoryWarningThreshold: number   // 0-1
}
```

#### Methods
- `initDevice(device)`: Start monitoring a device
- `stopDevice(device)`: Stop monitoring a device
- `getDeviceReport(device)`: Generate performance report
- `collectMetrics(device)`: Manually collect metrics

## Platform Considerations

### Homey Pro
- Full monitoring capabilities
- Local storage for reports
- Customizable intervals

### Homey Cloud
- Limited memory metrics
- No filesystem access
- Automatic cleanup of old data

## Troubleshooting

1. High Memory Usage
   - Increase rotation frequency
   - Reduce stored samples
   - Check for memory leaks

2. Device Unavailable
   - Check connection status
   - Verify battery level
   - Review error logs

3. Missing Data
   - Verify monitoring is enabled
   - Check storage permissions
   - Validate sampling interval
