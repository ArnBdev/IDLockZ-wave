# ID Lock App Setup Checklist

## Required Files
- [ ] app.json - App configuration
- [ ] app.js - Main app logic
- [ ] package.json - Dependencies
- [ ] .npmrc - Package configuration

## Driver Files
- [ ] drivers/IDLock150/driver.js
- [ ] drivers/IDLock150/settings/index.html
- [ ] drivers/IDLock150/settings/idlockApp.js

## Required Directories
- [ ] assets/images/
- [ ] drivers/IDLock150/assets/images/
- [ ] locales/

## Required Images
- [ ] assets/images/large.png (500x500px)
- [ ] assets/images/small.png (250x250px)
- [ ] drivers/IDLock150/assets/images/large.png
- [ ] drivers/IDLock150/assets/images/small.png

## Configuration
- [ ] Z-Wave manufacturer ID correct (865)
- [ ] Product type and ID set
- [ ] Proper capabilities registered
- [ ] Flow cards defined

## Localization
- [ ] English translations (locales/en.json)
- [ ] Norwegian translations (locales/no.json)
- [ ] UI strings translated

## Setup Instructions
1. Run `node setup.js` to create directories
2. Add required images in assets and driver folders
3. Run `npm install` to install dependencies
4. Run `homey app validate` to check configuration
5. Run `homey app run` to start the app

## Common Issues
If app shows as unavailable:
1. Check all required images are present
2. Validate app.json formatting
3. Ensure Z-Wave parameters are correct
4. Check all required files are present
5. Verify dependencies are installed
6. Check Homey logs for specific errors
