# ID Lock App Store Content

## Short Description
Control your ID Lock with Homey - Manage PIN codes, RFID tags, and monitor access through automation.

## Long Description

### Take Control of Your Smart Lock
The ID Lock app for Homey gives you complete control over your ID Lock 150 and 202 models. With extensive automation support and secure Z-Wave communication, you can manage access, monitor status, and create powerful automation flows.

### Key Features

#### 🔒 Smart Lock Control
- Remote lock/unlock
- Status monitoring
- Auto-lock functionality
- Battery level alerts

#### 👥 Access Management
- PIN code administration
- Temporary access codes
- User slot management
- Access logging

#### ⚡ Automation Support
- Extensive flow cards
- Condition checking
- Custom triggers
- State monitoring

#### 🏠 Home Integration
- Away mode
- Guest access
- Battery monitoring
- Security features

### Flow Card Examples

1. **Automatic Locking**
```plain
When Door was unlocked
AND Battery level is good
└── Wait 30 seconds
    └── Lock the door
```

2. **Guest Access**
```plain
When Time is 8:00
└── Set temporary code
    AND Enable auto-lock
    └── Delete code at 18:00
```

3. **Battery Management**
```plain
When Battery below 20%
└── Send notification
    AND Enable fast auto-lock
```

### Technical Details

- Z-Wave Plus certified
- Secure inclusion required
- Advanced encryption
- Battery operated
- Wake-up interval optimization
- Regular status updates

### Requirements

- Homey Pro
- Z-Wave network
- ID Lock 150 or 202 model
- Fresh batteries recommended

### Installation Guide

1. **Preparation**
   - Install fresh batteries
   - Have lock within 1 meter of Homey
   - Enable inclusion mode

2. **Inclusion**
   - Follow Z-Wave inclusion in Homey
   - Wait for secure pairing
   - Verify connection

3. **Configuration**
   - Set auto-lock preferences
   - Configure wake-up interval
   - Add initial PIN codes

### Support Resources

- Complete documentation
- Flow card examples
- Troubleshooting guide
- Community support
- Direct manufacturer assistance

### Screenshot Descriptions

1. **Main Interface** (app-screen-1.png)
- Lock status indicator
- Battery level monitoring
- Quick action buttons
- Status updates

2. **Settings Panel** (app-screen-2.png)
- Auto-lock configuration
- PIN code management
- Wake-up settings
- System preferences

3. **Flow Management** (app-screen-3.png)
- Available triggers
- Condition cards
- Action options
- Example flows

4. **User Management** (app-screen-4.png)
- PIN code overview
- Access history
- User slots
- Temporary codes

### Privacy & Security

- Local processing
- Encrypted communication
- Secure Z-Wave protocol
- Regular security updates
- Privacy-focused design

### Support Channels

1. Documentation
   - Online manuals
   - Flow examples
   - Installation guides
   - FAQ section

2. Community
   - Homey Community forums
   - User guides
   - Shared flows

3. Direct Support
   - Email: support@idlock.no
   - Response within 24 hours
   - Expert assistance

### Updates & Maintenance

- Regular app updates
- Security patches
- Feature additions
- Performance improvements
- Community feedback integration

### Tags
#security #smartlock #zwave #automation #smarthome #idlock #homey #doorlock #access #control
