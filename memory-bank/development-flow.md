# Development Workflow

## Local Development
1. Setup:
```bash
npm install -g homey
homey login
homey app run --debug
```

2. Testing:
```bash
homey app validate
homey app run --clean
```

3. Installation:
```bash
homey app install
```

## Common Issues
1. Node Version Mismatch
   - Check Homey version
   - Use NVM to match
   - Verify package.json

2. Validation Errors
   - Check .homeycompose structure
   - Verify settings format
   - Update permissions

3. Testing Problems
   - Use --clean flag
   - Check logs
   - Verify Z-Wave inclusion

## Best Practices
1. Always:
   - Use clean installs
   - Track versions in Git
   - Test thoroughly
   - Document changes
   - Follow guidelines

2. Never:
   - Commit node_modules
   - Skip validation
   - Ignore errors
   - Deploy untested code

## Development Cycle
1. Prepare:
   - Match Node version
   - Clean environment
   - Update dependencies

2. Develop:
   - Use compose structure
   - Test locally
   - Validate often

3. Test:
   - Run validation
   - Check real device
   - Verify settings

4. Deploy:
   - Clean build
   - Git tag version
   - Publish app

## Tips & Tricks
1. Clean Development:
   ```bash
   homey app run --clean --debug
   ```

2. Quick Testing:
   ```bash
   homey app validate
   homey app run
   ```

3. Safe Deployment:
   ```bash
   npm run verify
   homey app publish
   ```

## Error Resolution
1. Node Issues:
   - Check version match
   - Clean npm cache
   - Reinstall deps

2. Validation Fails:
   - Review compose files
   - Check permissions
   - Validate settings

3. Runtime Errors:
   - Check debug logs
   - Verify Z-Wave
   - Test capabilities

## Deployment Checklist
1. Preparation:
   - All tests pass
   - Clean environment
   - Valid configuration

2. Validation:
   - App validates
   - Device works
   - Settings save

3. Publishing:
   - Version tagged
   - Changes documented
   - Dependencies clean
