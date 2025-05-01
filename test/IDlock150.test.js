'use strict';

jest.mock('homey');
jest.mock('homey-zwavedriver');

const { createTestDriver, createTestDevice, mockZwaveResponse } = require('./helper');
const IDLock150Driver = require('../drivers/IDLock150/driver');
const IDLock150Device = require('../drivers/IDLock150/device');

describe('ID Lock 150 Tests', () => {
    let driver;
    let device;

    beforeEach(() => {
        // Create test instances
        driver = new IDLock150Driver();
        device = new IDLock150Device();
        
        // Set up required mocks
        device.log = jest.fn();
        device.error = jest.fn();
        device.setCapabilityValue = jest.fn().mockResolvedValue(true);
        device.registerCapability = jest.fn();
        
        jest.clearAllMocks();
    });

    describe('Driver Tests', () => {
        test('should initialize with correct configuration', () => {
            expect(driver.manifest.zwave.manufacturerId).toBe(865);
            expect(driver.manifest.zwave.productTypeId).toContain(1);
            expect(driver.manifest.id).toBe('IDLock150');
        });

        test('should register flow cards on init', () => {
            const triggerSpy = jest.spyOn(driver.homey.flow, 'getDeviceTriggerCard');
            
            driver.onInit();
            
            expect(triggerSpy).toHaveBeenCalledWith('door_lock');
            expect(triggerSpy).toHaveBeenCalledWith('door_unlock');
        });
    });

    describe('Device Tests', () => {
        test('should handle NOTIFICATION reports', async () => {
            const setCapabilitySpy = jest.spyOn(device, 'setCapabilityValue');
            
            // Mock lock state notification
            await device.onNotification('NOTIFICATION', 'NOTIFICATION_REPORT', {
                'Notification Type': 'Access Control',
                'Event': 'Door is locked'
            });

            expect(setCapabilitySpy).toHaveBeenCalledWith('locked', true);
        });

        test('should handle BATTERY reports', async () => {
            const setCapabilitySpy = jest.spyOn(device, 'setCapabilityValue');
            
            await device.onReport('BATTERY', 'BATTERY_REPORT', {
                'Battery Level': 80
            });

            expect(setCapabilitySpy).toHaveBeenCalledWith('measure_battery', 80);
        });

        test('should configure auto-lock settings', async () => {
            const configSpy = jest.spyOn(device, 'configurationSet');
            
            await device.onSettings({
                autolock_enabled: true,
                autolock_time: 30
            });

            expect(configSpy).toHaveBeenCalledWith({
                id: 2,
                size: 1,
                value: 30
            });
        });
    });

    describe('Capability Tests', () => {
        test('should handle lock capability listener', async () => {
            const configSpy = jest.spyOn(device, 'configurationSet');
            
            await device.onCapabilityLocked(true);
            
            expect(configSpy).toHaveBeenCalled();
            expect(device.setCapabilityValue).toHaveBeenCalledWith('locked', true);
        });

        test('should handle auto-lock capability', async () => {
            await device.onCapabilityAutolockEnabled(true);
            
            expect(device.setCapabilityValue).toHaveBeenCalledWith('autolock_enabled', true);
            expect(device.configurationSet).toHaveBeenCalled();
        });

        test('should handle away mode capability', async () => {
            await device.onCapabilityAwayMode(true);
            
            expect(device.setCapabilityValue).toHaveBeenCalledWith('away_mode', true);
            expect(device.configurationSet).toHaveBeenCalled();
        });
    });
});
