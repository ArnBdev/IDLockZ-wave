'use strict';

const { createTestDevice, mockZwaveResponse } = require('./helper');

describe('Flow Card Tests', () => {
    let device;
    
    beforeEach(() => {
        device = createTestDevice({
            capabilities: ['locked', 'measure_battery', 'autolock_enabled', 'user_code']
        });
        
        // Mock flow cards
        device.homey = {
            flow: {
                getActionCard: jest.fn().mockReturnValue({
                    registerRunListener: jest.fn().mockReturnValue(true)
                }),
                getConditionCard: jest.fn().mockReturnValue({
                    registerRunListener: jest.fn().mockReturnValue(true)
                }),
                getDeviceTriggerCard: jest.fn().mockReturnValue({
                    trigger: jest.fn().mockResolvedValue(true)
                })
            }
        };

        jest.clearAllMocks();
    });

    describe('Action Cards', () => {
        test('should handle lock action', async () => {
            const setCapabilitySpy = jest.spyOn(device, 'setCapabilityValue');
            
            await device.homey.flow.getActionCard('lock')
                .registerRunListener(async () => {
                    await device.setCapabilityValue('locked', true);
                    return true;
                });
            
            expect(setCapabilitySpy).toHaveBeenCalledWith('locked', true);
        });

        test('should handle unlock action', async () => {
            const setCapabilitySpy = jest.spyOn(device, 'setCapabilityValue');
            
            await device.homey.flow.getActionCard('unlock')
                .registerRunListener(async () => {
                    await device.setCapabilityValue('locked', false);
                    return true;
                });
            
            expect(setCapabilitySpy).toHaveBeenCalledWith('locked', false);
        });

        test('should handle auto-lock configuration', async () => {
            const configSpy = jest.spyOn(device, 'configurationSet');
            
            await device.homey.flow.getActionCard('set_autolock')
                .registerRunListener(async (args) => {
                    await device.configurationSet({
                        index: 2,
                        size: 1,
                        value: args.timeout
                    });
                    return true;
                });
            
            expect(configSpy).toHaveBeenCalledWith(expect.objectContaining({
                index: 2,
                size: 1
            }));
        });

        test('should handle user code management', async () => {
            const slot = 1;
            const code = '1234';

            await device.homey.flow.getActionCard('set_user_code')
                .registerRunListener(async (args) => {
                    return await device.setUserCode(args.code, args.slot);
                });

            const triggerSpy = device.homey.flow.getDeviceTriggerCard('user_code_set').trigger;
            expect(triggerSpy).toHaveBeenCalledWith(device, { slot });
        });
    });

    describe('Condition Cards', () => {
        test('should check lock state', async () => {
            device.setCapabilityValue('locked', true);
            
            const result = await device.homey.flow.getConditionCard('is_locked')
                .registerRunListener(async () => {
                    return device.getCapabilityValue('locked');
                });
            
            expect(result).toBe(true);
        });

        test('should check battery level', async () => {
            device.setCapabilityValue('measure_battery', 15);
            
            const result = await device.homey.flow.getConditionCard('battery_level')
                .registerRunListener(async (args) => {
                    const level = device.getCapabilityValue('measure_battery');
                    return level < args.level;
                });
            
            expect(result).toBe(true);
        });
    });

    describe('Trigger Cards', () => {
        test('should trigger on lock operation', async () => {
            await device.onLockOperationReport({
                'Door Lock Mode': 'Door Secured'
            });

            const triggerSpy = device.homey.flow.getDeviceTriggerCard('door_lock').trigger;
            expect(triggerSpy).toHaveBeenCalledWith(device, {
                method: 'operation'
            });
        });

        test('should trigger on battery low', async () => {
            await device.onBatteryReport({
                'Battery Level': 15
            });

            const triggerSpy = device.homey.flow.getDeviceTriggerCard('battery_low').trigger;
            expect(triggerSpy).toHaveBeenCalledWith(device, {
                battery: 15
            });
        });
    });
});
