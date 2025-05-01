# Release Checklist

## Pre-Release Checks

### 1. Code Quality
- [ ] All tests passing (`npm test`)
- [ ] Test coverage >80% (`npm run test:coverage`)
- [ ] No ESLint warnings (`npm run validate`)
- [ ] Code reviewed and approved
- [ ] Debug logs removed
- [ ] Error handling verified

### 2. Documentation
- [ ] README.md up to date
- [ ] Flow card documentation complete
- [ ] API documentation current
- [ ] Change log updated
- [ ] Version number updated

### 3. App Store Assets
- [ ] Screenshots generated (`npm run screenshots`)
- [ ] Images optimized (`npm run optimize-images`)
- [ ] Store listing verified
- [ ] All assets present
- [ ] Translations complete

### 4. Z-Wave Implementation
- [ ] Secure inclusion tested
- [ ] Wake-up interval verified
- [ ] Battery reporting confirmed
- [ ] Command classes validated
- [ ] Configuration parameters tested

### 5. Features & Capabilities
- [ ] Lock/unlock working
- [ ] Auto-lock functioning
- [ ] Battery monitoring active
- [ ] User codes management tested
- [ ] Away mode verified
- [ ] Flow cards operational

### 6. Settings
- [ ] Settings save correctly
- [ ] Validation working
- [ ] UI responsive
- [ ] Changes persist after reboot
- [ ] Default values appropriate

### 7. Performance
- [ ] Memory usage acceptable
- [ ] Response times reasonable
- [ ] Battery impact minimal
- [ ] Z-Wave network load appropriate
- [ ] Error recovery tested

## Release Process

### 1. Preparation
```bash
# Clean environment
npm run clean

# Install dependencies
npm install

# Run all tests
npm run verify

# Prepare store assets
npm run store-prepare
```

### 2. Version Update
```bash
# Update version and tag
npm version minor

# Verify version in
# - package.json
# - app.json
# - .homeychangelog.json
```

### 3. Build & Test
```bash
# Build app
npm run build

# Test in development
npm run start

# Deploy to test device
npm run deploy
```

### 4. Final Verification
- [ ] Test on physical device
- [ ] Verify all capabilities
- [ ] Check flow cards
- [ ] Test settings page
- [ ] Confirm Z-Wave inclusion

### 5. Publication
```bash
# Publish to store
npm run release
```

### 6. Post-Release
- [ ] Tag release in Git
- [ ] Update changelog
- [ ] Notify users
- [ ] Monitor feedback
- [ ] Update documentation

## Emergency Procedures

### If Issues Found
1. Stop release process
2. Document issues
3. Create hotfix branch
4. Fix issues
5. Restart checklist

### Rollback Process
```bash
# Revert to previous version
git checkout <previous-tag>
npm run build
npm run deploy

# Notify users
# Update store listing
```

## Version History

| Version | Date | Changes | Notes |
|---------|------|---------|-------|
| 2.0.0 | 2025-04-29 | Initial release | Complete rewrite |

## Notes
- Always test on real device
- Verify all Z-Wave functions
- Check battery impact
- Test error scenarios
- Document all changes

## Support Readiness
- [ ] Support documentation ready
- [ ] Common issues documented
- [ ] Troubleshooting guide updated
- [ ] Support team notified
- [ ] Community informed
