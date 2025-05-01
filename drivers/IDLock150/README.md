# ID Lock 150/202 Driver for Homey

This driver provides advanced integration for ID Lock 150 and 202 models with Homey, offering comprehensive access control and monitoring capabilities.

## Features

### Access Control
- Manage up to 25 PIN codes
- Support for up to 25 RFID tags
- Temporary codes with automatic expiration
- Real-time access logging
- Automatic code validation

### User Management
- User-friendly interface for code management
- Name assignment for easy identification
- Slot management for both PINs and RFID tags
- Edit and delete existing codes

### Temporary Access
- Create time-limited access codes
- Flexible duration settings (hours/days/weeks)
- Automatic expiration handling
- Real-time validation during access attempts

### Access Logging
- Comprehensive access attempt tracking
- Success/failure logging
- User identification
- Filtering by type and status
- Access statistics

### Z-Wave Integration
- Secure Z-Wave Plus communication
- Real-time lock state monitoring
- Battery level tracking
- Automatic state updates

## Setup Instructions

1. Add the ID Lock device to your Z-Wave network
2. Access device settings in Homey
3. Use the interface to manage codes and access

## Code Management

### PIN Codes
- 4-10 digits
- No sequential numbers (e.g., 1234)
- No repeated digits (e.g., 9999)
- Slots 1-25

### RFID Tags
- Register tags directly on the lock
- Assign names and slots in Homey
- Slots 1-25

### Temporary Codes
- Set validity period
- Automatic expiration
- Shares slots with regular PIN codes

## Access Log Features

- Filter by access type (PIN/RFID/Temporary)
- Filter by status (Success/Failure)
- Time-based filtering
- Success rate statistics
- Usage pattern analysis

## Technical Details

The driver uses the following Z-Wave Command Classes:
- COMMAND_CLASS_DOOR_LOCK (0x62)
- COMMAND_CLASS_USER_CODE (0x63)
- COMMAND_CLASS_CONFIGURATION (0x70)
- COMMAND_CLASS_NOTIFICATION (0x71)
- COMMAND_CLASS_BATTERY (0x80)

## Language Support
- Full Norwegian localization
- Interface labels and messages
- Error notifications
- Status updates

## Storage

Settings are stored in the following format:
- `codes`: Array of user codes (PIN/RFID/temporary)
- `accessLog`: Array of access attempts with metadata

### Code Object Format
```javascript
{
    user: string,           // User name
    index: number,          // Slot number (1-25)
    type: number,           // 4=RFID, 6=PIN, 7=Temporary
    pinCode: string,        // For PIN codes only
    hasCode: boolean,       // Code status
    temporary: boolean,     // For temporary codes
    validFrom: Date,       // For temporary codes
    validUntil: Date,      // For temporary codes
    duration: number,      // For temporary codes
    timeUnit: string       // 'hours'|'days'|'weeks'
}
```

### Log Entry Format
```javascript
{
    timestamp: string,     // ISO date string
    type: number,         // 4=RFID, 6=PIN, 7=Temporary
    success: boolean,     // Access result
    codeId: string,      // Slot ID used
    userName: string,     // Matched user name
    message: string      // Status message
}
```

## Version History

### 2.0.0
- Added temporary code support
- Implemented access logging
- Added Norwegian translation
- Enhanced code validation
- Improved error handling
