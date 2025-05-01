# Homey Technical Context

## Latest SDK Changes
- Node.js version should match Homey's current version (check via Homey App Settings)
- All new apps should use Homey Compose structure
- Apps should not include node_modules in Git
- Code completion through homey npm package

## Homey Compose Structure
- Lives in `.homeycompose` folder
- Splits app.json into smaller files
- Driver-specific files go in driver folders
- Migration: `homey app compose`

## CLI Development Flow
1. Installation:
```bash
npm install -g homey
homey login
```

2. Commands:
- `homey app run` - Development testing
- `homey app install` - Local installation
- `homey app publish` - Release with Git tag
- `homey app validate` - Check configuration

## Best Practices
1. Project Setup:
   - Use .homeycompose for configuration
   - Keep node_modules out of Git
   - Use proper localization

2. Development:
   - Test on actual device
   - Use SDK code completion
   - Follow certification guidelines

3. Testing:
   - `homey app run --clean` for fresh start
   - Test all capabilities
   - Verify Z-Wave inclusion

## Important Links
- [App Development Guidelines](https://apps.developer.homey.app/guidelines)
- [Homey Compose Tutorial](https://apps.developer.athom.com/tutorial-Homey%20Compose.html)
- [Issue Tracker](https://github.com/athombv/homey-apps-sdk/issues)

## Z-Wave Notes
- Use secure inclusion
- Test wake-up intervals
- Verify command classes
- Check battery reporting

## CLI Installation
- Requires Node.js matching Homey's version
- Uses app login authentication
- Supports development and production modes

## Project Requirements
1. Files:
   ```
   .homeycompose/
   drivers/[driver]/driver.compose.json
   app.json (compiled)
   package.json
   ```

2. Settings:
   - Use array format
   - Include validation
   - Support translations

3. Development:
   - Test changes locally
   - Use clean install
   - Verify on real device
