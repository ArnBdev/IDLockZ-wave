# ID Lock Homey App

A comprehensive integration for ID Lock 150 and 202 models, providing full access control and monitoring capabilities through Homey.

## Features

- PIN code management (up to 25 codes)
- RFID tag support (up to 25 tags)
- Temporary access codes with automatic expiration
- Access logging and monitoring
- Real-time notifications
- Battery level monitoring
- Full Norwegian localization

## Quick Start

See QUICKSTART.md for detailed setup instructions. Basic setup:

```bash
npm install    # Sets up directories and installs dependencies
npm start     # Validates and runs the app
```

## Documentation

- QUICKSTART.md - Setup and installation guide
- CHECKLIST.md - Verification checklist for all components
- locales/*.json - Customizable string translations

## Structure

```
├── app.js              # Main app initialization
├── app.json           # App configuration
├── drivers/
│   └── IDLock150/     # Lock driver implementation
├── locales/           # Translations
└── assets/           # App images
```

## Development

1. Check CHECKLIST.md to ensure all components are in place
2. Use `npm run validate` to verify configuration
3. Replace placeholder images before publishing

## Requirements

- Homey Pro
- ID Lock 150 or 202
- Node.js >=12.0.0

## Support

- Github: https://github.com/yourusername/com.idlock
- Support: support@idlock.no
