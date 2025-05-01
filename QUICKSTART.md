# Quick Start Guide

## One-Line Installation
```bash
npm install && npm start
```

This will:
1. Create required directories and files
2. Generate placeholder images
3. Install dependencies
4. Validate app structure
5. Start the Homey app

## Step-by-Step Installation

If you prefer more control, you can run each step manually:

1. Set up directory structure:
   ```bash
   npm run setup
   ```

2. Validate file structure:
   ```bash
   npm run validate-files
   ```

3. Install dependencies:
   ```bash
   npm install --no-scripts
   ```

4. Validate app configuration:
   ```bash
   npm run validate
   ```

5. Start the app:
   ```bash
   npm start
   ```

## Troubleshooting

If you see "App Unavailable":

1. Check file structure:
   ```bash
   npm run validate-files
   ```
   - If files are missing, run `npm run setup`

2. Verify images:
   ```bash
   ls assets/images/
   ls drivers/IDLock150/assets/images/
   ```
   - If missing, run `node create-images.js`

3. Validate app configuration:
   ```bash
   homey app validate
   ```
   - Check error messages for specific issues

4. Common Issues:
   - Missing images or icons → Run `node create-images.js`
   - Invalid Z-Wave parameters → Check app.json
   - Missing capabilities → Verify .homeycompose/capabilities/*
   - Missing translations → Check locales/*.json

5. Clean Installation:
   ```bash
   rm -rf node_modules
   npm cache clean --force
   npm install
   ```

## File Structure
```
.
├── app.js                 # Main app logic
├── app.json              # App configuration
├── assets/              # App assets
│   ├── images/         # App icons
│   └── *.svg           # Capability icons
├── drivers/            # Device drivers
│   └── IDLock150/     # Lock implementation
├── locales/           # Translations
└── .homeycompose/     # Capabilities
```

## Support Files
- CHECKLIST.md - Complete verification list
- README.md - Detailed documentation
- validate.js - Structure validation

## Manual Setup

If you prefer to run steps individually:

1. Create directories:
   ```bash
   node setup.js
   ```

2. Create temporary images:
   ```bash
   node create-images.js
   ```

3. Install dependencies:
   ```bash
   npm install --no-scripts
   ```

4. Validate app:
   ```bash
   npm run validate
   ```

5. Run the app:
   ```bash
   npm start
   ```

## Troubleshooting

If the app shows as unavailable:

1. Verify all files are present:
   ```bash
   npm run validate
   ```

2. Check the placeholder images were created:
   ```bash
   ls assets/images/
   ls drivers/IDLock150/assets/images/
   ```

3. Verify Z-Wave parameters in app.json match your device:
   - Manufacturer ID: 865
   - Product Type and ID should match your lock model

4. Check Homey logs for specific error messages

## Next Steps

1. Replace placeholder images with actual product images
2. Test all functionality:
   - Adding codes and tags
   - Temporary code expiration
   - Access logging
   - Flow triggers and actions

3. Customize strings in locales/en.json and locales/no.json

## Support

If you need assistance:
1. Check the CHECKLIST.md file
2. Review error messages in Homey logs
3. Contact support@idlock.no
