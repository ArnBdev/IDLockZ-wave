# Flow Card Examples

## Triggers

### Door Lock Events
```plain
When Door was locked
└── Method: 'Manual', 'PIN code', 'RFID', 'Auto-lock', 'Z-Wave'

When Door was unlocked
└── Method: 'Manual', 'PIN code', 'RFID', 'Z-Wave'
```

### Battery Events
```plain
When Battery level dropped below
└── Level: Current battery percentage
```

### User Code Events
```plain
When User code was set
└── Slot: User code slot number (1-10)

When User code was deleted
└── Slot: User code slot number (1-10)
```

## Conditions

### Lock Status
```plain
Door is locked
└── True: Door is currently locked
└── False: Door is currently unlocked

Auto-lock is enabled
└── True: Auto-lock is active
└── False: Auto-lock is disabled

Battery level is below [X]%
└── X: Battery percentage threshold
```

## Actions

### Basic Control
```plain
Lock the door
└── Immediately locks the door

Unlock the door
└── Immediately unlocks the door
```

### Auto-Lock Management
```plain
Set auto-lock on/off
└── Timeout: Number of seconds before auto-lock (0-240)
```

### User Code Management
```plain
Set user code
├── Code: PIN code (4-10 digits)
└── Slot: User slot number (1-10)

Delete user code
└── Slot: User slot number (1-10)
```

## Example Flows

### Auto-Lock After Time
```plain
When Door was unlocked
└── AND Battery level is not below 20%
    └── Wait 30 seconds
        └── IF Door is not locked
            └── Lock the door
```

### Low Battery Alert
```plain
When Battery level dropped below 20%
└── Send notification
    AND Set auto-lock on
        └── Timeout: 10 seconds
```

### Guest Access Management
```plain
When Time is 8:00
└── Set user code
    ├── Code: "1234"
    └── Slot: 2
    AND Set auto-lock on
        └── Timeout: 30

When Time is 18:00
└── Delete user code
    └── Slot: 2
    AND Set auto-lock on
        └── Timeout: 10
```

### Away Mode Setup
```plain
When 'Away' mode enabled
└── Lock the door
    AND Set auto-lock on
        └── Timeout: 10
        AND Set user code
            ├── Code: "9999"
            └── Slot: 1
```

## Testing Flow Cards

1. Trigger Cards
   - Use the mobile app to lock/unlock
   - Monitor battery level changes
   - Test user code operations

2. Condition Cards
   - Verify lock state detection
   - Check auto-lock status
   - Test battery thresholds

3. Action Cards
   - Test basic lock control
   - Verify auto-lock timing
   - Check user code management

## Best Practices

1. Always Include Safety Checks
   ```plain
   Action: Unlock door
   └── Only if Battery level is not below 10%
       AND Time is between 06:00 and 23:00
   ```

2. Use Delays Wisely
   ```plain
   Trigger: Door unlocked
   └── Wait 5 seconds
       └── Check if still unlocked
           └── Then auto-lock
   ```

3. Manage User Codes Safely
   ```plain
   Delete old code first
   └── Wait 2 seconds
       └── Set new code
           └── Verify with condition
   ```

## Troubleshooting

1. Flow Not Triggering
   - Check battery level
   - Verify Z-Wave connection
   - Test manual operation

2. Actions Failing
   - Check lock status
   - Verify user code format
   - Test network connection

3. Conditions Incorrect
   - Refresh device status
   - Check timing settings
   - Verify battery level
