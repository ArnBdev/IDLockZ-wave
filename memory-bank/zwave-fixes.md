# Z-Wave Implementation Fixes

## Current Issues

### 1. Command Classes
Current implementation is missing:
- Proper battery report handling
- Door lock operation confirmation
- User code management
- Notification handling

### 2. Device Class
```javascript
class IDLock150Device extends ZwaveDevice {
   // Missing proper initialization
   // Missing report handlers
   // Missing capability mappings
}
```

## Required Fixes

### 1. Core Z-Wave Setup
```javascript
async onNodeInit() {
    // Enable debugging
    this.enableDebug();
    this.printNode();

    // Register capabilities
    await this.registerCapability('locked', 'DOOR_LOCK');
    await this.registerCapability('measure_battery', 'BATTERY');
    
    // Register report listeners
    this.registerReportListener('DOOR_LOCK', 'DOOR_LOCK_OPERATION_REPORT', this.onLockOperationReport);
    this.registerReportListener('BATTERY', 'BATTERY_REPORT', this.onBatteryReport);
    this.registerReportListener('NOTIFICATION', 'NOTIFICATION_REPORT', this.onNotificationReport);
}
```

### 2. Command Handlers
```javascript
async onLockOperationReport(report) {
    const locked = report['Door Lock Mode'] === 'Door Secured';
    await this.setCapabilityValue('locked', locked);
    
    // Trigger appropriate flow
    await this.triggerFlow({
        id: locked ? 'door_lock' : 'door_unlock',
        tokens: { method: 'Z-Wave' }
    });
}

async onBatteryReport(report) {
    const batteryLevel = report['Battery Level'];
    await this.setCapabilityValue('measure_battery', batteryLevel);
    
    if (batteryLevel < 20) {
        await this.triggerFlow({
            id: 'battery_low',
            tokens: { battery: batteryLevel }
        });
    }
}
```

### 3. Configuration Management
```javascript
async setConfiguration() {
    // Auto-lock time
    await this.configurationSet({
        index: 2,
        size: 1,
        value: this.getSetting('autolock_time') || 30
    });

    // Away mode
    await this.configurationSet({
        index: 3,
        size: 1,
        value: this.getSetting('away_mode') ? 1 : 0
    });
}
```

### 4. User Code Management
```javascript
async setUserCode(code, slot) {
    await this.node.CommandClass.COMMAND_CLASS_USER_CODE.USER_CODE_SET({
        'User Identifier': slot,
        'User ID Status': 'Occupied',
        'User Code': code
    });
}

async getUserCodes() {
    const codes = [];
    for (let i = 1; i <= 10; i++) {
        const result = await this.node.CommandClass.COMMAND_CLASS_USER_CODE.USER_CODE_GET({
            'User Identifier': i
        });
        codes.push(result);
    }
    return codes;
}
```

## Implementation Plan

1. Base Implementation
   - Add proper command class registration
   - Implement report handlers
   - Add capability mappings

2. Advanced Features
   - User code management
   - Auto-lock configuration
   - Away mode handling

3. Testing & Validation
   - Test all Z-Wave commands
   - Verify secure inclusion
   - Check battery handling

## Next Steps
1. Update device.js with new implementation
2. Add proper error handling
3. Test with real device
4. Add unit tests

Would you like me to start implementing these fixes by updating the device.js file first?
