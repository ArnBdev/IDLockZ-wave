# ID Lock App Implementation Details

## Overview
This document describes the implementation details of the ID Lock app for Homey, focusing on Z-Wave integration and device management.

## Core Components

### 1. App Structure
- `app.js` - Main application initialization
- `driver.js` - Z-Wave driver implementation
- `device.js` - Device-specific implementation
- `.homeycompose/` - Capability and flow definitions

### 2. Z-Wave Configuration
```javascript
{
    manufacturerId: 865,
    productTypeId: [1],
    productId: [1],
    capabilities: [
        "locked",
        "measure_battery",
        "autolock_enabled",
        "autolock_time",
        "away_mode"
    ]
}
```

### 3. Custom Capabilities
- `autolock_enabled` - Boolean capability for auto-lock feature
- `autolock_time` - Number capability for auto-lock timing
- `away_mode` - Boolean capability for enhanced security mode
- `user_code` - String capability for PIN management

## Implementation Details

### 1. Driver Implementation
- Extends `ZwaveDriver`
- Handles device pairing and configuration
- Manages flow card registration
- Implements Z-Wave command handling

### 2. Device Implementation
- Extends `ZwaveDevice`
- Manages device capabilities
- Handles Z-Wave reports
- Implements settings management

### 3. Flow Cards
```javascript
// Triggers
- door_lock
- door_unlock
- lock_jammed

// Conditions
- is_locked
- battery_level

// Actions
- set_awaymode
```

## Testing Infrastructure

### 1. Test Setup
- Jest configuration
- Mocked Z-Wave environment
- Coverage requirements (80%)

### 2. Test Categories
- App initialization tests
- Driver functionality tests
- Device operation tests
- Z-Wave command tests

## Validation and Setup

### 1. Setup Process
```bash
npm install    # Install dependencies and run setup
npm test      # Run tests and validation
npm start     # Start the app
```

### 2. Validation Steps
- File structure validation
- App configuration validation
- Test coverage validation
- Z-Wave parameter validation

## Troubleshooting

### 1. Common Issues
- App unavailable
  - Check file structure with `npm run validate-files`
  - Verify image assets exist
  - Validate Z-Wave configuration

- Z-Wave communication issues
  - Check manufacturer ID (865)
  - Verify product type and ID
  - Confirm command class implementation

### 2. Debug Information
```javascript
// Enable debug logging
this.enableDebug();

// Check system information
this.log('System information:');
this.log('- Homey version:', this.homey.version);
this.log('- App SDK version:', manifest.sdk);
```

## File Structure
```
.
├── app.js                 # Main app initialization
├── app.json              # App configuration
├── drivers/
│   └── IDLock150/       # Lock implementation
│       ├── driver.js
│       └── device.js
├── .homeycompose/        # Capability definitions
├── locales/             # Translations
└── test/                # Test files
```

## Development Guidelines

1. Code Style
   - Use 'strict' mode
   - Implement proper error handling
   - Add JSDoc comments
   - Follow Homey coding standards

2. Testing
   - Maintain test coverage
   - Mock external dependencies
   - Test error conditions
   - Validate Z-Wave commands

3. Documentation
   - Update implementation notes
   - Document Z-Wave parameters
   - Maintain change log
   - Update troubleshooting guides

## Support

- Issue reporting: support@idlock.no
- Documentation: https://idlock.no/en/support
- Source code: https://github.com/yourusername/com.idlock
