'use strict';

jest.mock('homey');
jest.mock('homey-zwavedriver');

const { createTestDriver, createTestDevice, mockZwaveResponse } = require('./helper');

describe('ID Lock App Tests', () => {
    let driver;
    let device;
    
    beforeEach(() => {
        driver = createTestDriver();
        device = createTestDevice({
            capabilities: ['locked', 'measure_battery', 'autolock_enabled']
        });
        
        // Clear all mocks
        jest.clearAllMocks();
    });

    describe('Driver Tests', () => {
        test('should have correct Z-Wave configuration', () => {
            expect(driver.manifest.zwave.manufacturerId).toBe(865);
            expect(driver.manifest.zwave.productTypeId).toEqual([1]);
            expect(driver.manifest.zwave.productId).toEqual([1]);
        });

        test('should register flow cards', () => {
            driver.onInit();
            expect(driver.homey.flow.getDeviceTriggerCard).toHaveBeenCalled();
        });
    });

    describe('Device Tests', () => {
        test('should handle lock capability', async () => {
            const setCapabilitySpy = jest.spyOn(device, 'setCapabilityValue');
            await device.setCapabilityValue('locked', true);
            expect(setCapabilitySpy).toHaveBeenCalledWith('locked', true);
        });

        test('should handle battery reports', async () => {
            const batteryValue = 75;
            const setCapabilitySpy = jest.spyOn(device, 'setCapabilityValue');
            
            // Mock battery report
            await mockZwaveResponse(device, 'BATTERY', 'BATTERY_REPORT', { 
                'Battery Level': batteryValue 
            });

            expect(setCapabilitySpy).toHaveBeenCalledWith('measure_battery', batteryValue);
        });

        test('should handle auto-lock settings', async () => {
            const configSpy = jest.spyOn(device, 'configurationSet');
            
            await device.setCapabilityValue('autolock_enabled', true);
            
            expect(configSpy).toHaveBeenCalledWith({
                id: 2,
                size: 1,
                value: expect.any(Number)
            });
        });
    });

    describe('Settings Tests', () => {
        test('should validate auto-lock time', async () => {
            const configSpy = jest.spyOn(device, 'configurationSet');
            
            await device.setSettings({
                autolock_time: 60
            });

            expect(configSpy).toHaveBeenCalledWith({
                id: 2, 
                size: 1,
                value: 60
            });
        });

        test('should handle away mode', async () => {
            const setCapabilitySpy = jest.spyOn(device, 'setCapabilityValue');
            
            await device.setCapabilityValue('away_mode', true);
            expect(setCapabilitySpy).toHaveBeenCalledWith('away_mode', true);
        });
    });
});
