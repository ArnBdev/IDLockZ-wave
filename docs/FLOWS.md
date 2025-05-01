# Flow Cards for Performance Monitoring

This document describes the available flow cards for performance monitoring and provides example use cases.

## Available Cards

### Triggers

#### Performance Alert Triggered
Triggers when a device reports a performance issue.

**Tokens:**
- Alert Type (memory, battery, etc.)
- Alert Level (warning, error)
- Message (human readable description)
- Value (numeric value related to alert)

### Conditions

#### Has Performance Alerts
Check if a device has active performance alerts.

**Options:**
- Any alert
- Memory usage
- Battery level

### Actions

#### Generate Performance Report
Generate a detailed performance report for a device.

**Options:**
- Format:
  - Text summary
  - Timeline visualization
  - Summary visualization
- Time Period:
  - Last hour
  - Last 24 hours
  - Last 7 days
  - All available data

## Example Flows

### 1. Low Battery Notification
```
When: Performance alert is triggered
AND: Alert type is 'battery'
THEN: Send notification "Device [name] has low battery: [value]%"
```

### 2. Daily Performance Summary
```
When: It becomes 08:00
THEN: Generate performance report
  Format: Summary visualization
  Period: Last 24 hours
AND: Send report to mobile app
```

### 3. Memory Alert Automation
```
When: Performance alert is triggered
AND: Alert type is 'memory'
AND: Value > 90
THEN: Generate performance report
  Format: Timeline
  Period: Last hour
AND: Send notification with report
```

### 4. Weekly Maintenance Check
```
When: It becomes Monday
THEN: For each device:
  IF: Has performance alerts (any)
  THEN: Generate performance report
    Format: Text
    Period: Last 7 days
  AND: Send to maintenance team
```

### 5. Critical Status Monitor
```
When: Performance alert is triggered
AND: Alert level is 'error'
THEN: Set LED ring color to red
AND: Generate performance report
AND: Send immediate notification
```

## Best Practices

1. **Alert Handling**
   - Set up immediate notifications for critical alerts
   - Group similar alerts to prevent notification spam
   - Use timespan conditions to avoid duplicate alerts

2. **Report Generation**
   - Use text format for notifications
   - Use visualizations for dashboards
   - Consider data volume when selecting timespan

3. **Flow Design**
   - Add delay between actions to prevent overload
   - Include device name in notifications
   - Use advanced flow branching for different alert types

4. **Maintenance**
   - Schedule regular performance checks
   - Archive or clear old reports periodically
   - Monitor notification frequency

## Configuration Tips

1. **Alert Thresholds**
   - Memory: 80-85% for warning, 90-95% for critical
   - Battery: 20% for warning, 10% for critical
   - Adjust based on device characteristics

2. **Report Settings**
   - Text: Best for quick overview
   - Timeline: Good for trend analysis
   - Summary: Ideal for regular checkups

3. **Timing**
   - Critical alerts: Immediate notification
   - Warning alerts: Batch notifications
   - Regular reports: Off-peak hours

## Troubleshooting

1. **Missing Triggers**
   - Check if monitoring is enabled
   - Verify alert thresholds
   - Check device connectivity

2. **Report Generation Fails**
   - Check available storage
   - Verify timespan selection
   - Check device availability

3. **Multiple Alerts**
   - Add delays between checks
   - Implement alert debouncing
   - Group similar alerts
