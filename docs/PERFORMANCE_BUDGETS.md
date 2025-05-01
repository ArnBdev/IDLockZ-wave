# Performance Budgets Documentation

This document describes the performance thresholds and configuration used in our performance monitoring.

## Thresholds

### Version Update Process
- Warning: 800ms - Alert if process takes longer than 800ms
- Error: 1000ms - Fail if process takes longer than 1 second
- Regression: 10% - Alert if performance degrades by more than 10%

### Release Process
- Warning: 2.5s - Alert if process takes longer than 2.5 seconds
- Error: 3s - Fail if process takes longer than 3 seconds
- Regression: 15% - Alert if performance degrades by more than 15%

### Rollback Process
- Warning: 1.2s - Alert if process takes longer than 1.2 seconds
- Error: 1.5s - Fail if process takes longer than 1.5 seconds
- Regression: 10% - Alert if performance degrades by more than 10%

### Memory Usage
#### Heap Usage
- Warning: 100MB - Alert if heap usage exceeds 100MB
- Error: 150MB - Fail if heap usage exceeds 150MB
- Regression: 5% - Alert if heap usage increases by more than 5%

#### RSS (Resident Set Size)
- Warning: 200MB - Alert if RSS exceeds 200MB
- Error: 300MB - Fail if RSS exceeds 300MB
- Regression: 10% - Alert if RSS increases by more than 10%

## CI Configuration

### Test Parameters
- Fail on Error: Yes - CI will fail if error thresholds are exceeded
- Warn on Regression: Yes - Warnings will be issued for regressions
- Allowed Regressions: 1 - One metric is allowed to regress before failing
- Required Samples: 5 - Minimum number of samples needed for reliable comparison
- Stability Threshold: 3 - Number of stable runs required

### Environment Settings
#### CI Environment
- Warmup Runs: 2
- Sample Size: 5
- Max Retries: 3

#### Local Environment
- Warmup Runs: 1
- Sample Size: 3
- Max Retries: 1

## Reporting

### Notifications
#### Slack
- Channel: #performance
- Threshold: error
- Triggered: When error thresholds are exceeded

#### Email
- Recipients: dev-team@idlock.no
- Threshold: warning
- Triggered: When warning thresholds are exceeded

#### GitHub
- Labels: performance
- Threshold: warning
- Triggered: When warning thresholds are exceeded

### Metrics Captured
- Mean
- 95th Percentile
- Maximum
- Minimum
- Standard Deviation

### Trend Analysis
- Period: 7 days
- Sample Size: 10 runs

## Ignored Patterns
The following patterns are excluded from performance monitoring:
- test/**/*.js - Test files
- scripts/debug.js - Debug utilities

## Usage

### Running Performance Checks
```bash
# Run performance checks
npm run benchmark

# Check against budgets
npm run check-budgets
```

### Interpreting Results
1. Green (✅) - Within acceptable range
2. Yellow (⚠️) - Warning threshold exceeded
3. Red (❌) - Error threshold exceeded

### Common Issues

#### Warning Threshold Exceeded
```
⚠️ Version update took 850ms (warning: 800ms)
```
Action: Monitor for pattern, optimize if persistent

#### Error Threshold Exceeded
```
❌ Release process took 3.2s (error: 3s)
```
Action: Immediate investigation required

#### Regression Detected
```
⚠️ Memory usage increased by 12% (threshold: 10%)
```
Action: Review recent changes, optimize memory usage

## Best Practices

1. Regular Monitoring
   - Run benchmarks daily
   - Review trends weekly
   - Update thresholds quarterly

2. Performance Reviews
   - Analyze regressions
   - Document optimizations
   - Update documentation

3. Maintenance
   - Keep dependencies updated
   - Clean test data regularly
   - Review ignore patterns

## Support

For questions or issues:
- GitHub Issues: Report performance-related bugs
- Slack: #performance channel for discussions
- Email: dev-team@idlock.no for urgent concerns
