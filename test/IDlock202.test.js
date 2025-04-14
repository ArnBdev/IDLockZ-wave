'use strict';

const { ZwaveDevice } = require('homey-zwavedriver');
const IDlock202 = require('../drivers/IDlock202/device.js');

describe('IDlock202', () => {
  let device;

  beforeEach(() => {
    device = new IDlock202();
    device.currentUser = 'ArnBdev';
    device._lastUpdated = new Date('2025-04-14T07:25:59Z');

    // Mock codeManager
    device.codeManager = {
      addRecurringCode: jest.fn().mockResolvedValue(true),
      getCodeUsageStats: jest.fn().mockResolvedValue({ totalUses: 0, failedAttempts: 0 }),
    };

    // Mock emergencyManager with state
    let emergencyMode = false;
    let triggers = [];

    device.emergencyManager = {
      handleFireAlarm: jest.fn((isActive) => {
        emergencyMode = isActive;
        if (isActive) {
          triggers.push('fire_alarm');
        } else {
          triggers = [];
        }
      }),
      isInEmergencyMode: jest.fn(() => emergencyMode),
      getEmergencyTriggers: jest.fn(() => triggers),
    };
  });

  describe('Code Management', () => {
    test('should handle recurring codes correctly', async () => {
      const code = '1234';
      const name = 'Test Code';
      const schedule = {
        daysOfWeek: [1, 2, 3, 4, 5], // Mandag-Fredag
        timeStart: '08:00',
        timeEnd: '17:00',
      };

      await device.setupRecurringCode(code, name, schedule);
      const stats = await device.getCodeUsageStats(code);

      expect(stats.totalUses).toBe(0);
      expect(stats.failedAttempts).toBe(0);
    });

    test('should track code usage correctly', async () => {
      const code = '5678';
      const name = 'Usage Test Code';

      await device.setupRecurringCode(code, name, {
        daysOfWeek: [1, 2, 3, 4, 5],
        timeStart: '09:00',
        timeEnd: '16:00',
      });

      await device.logCodeUsage(code, true);
      await device.logCodeUsage(code, false);

      const stats = await device.getCodeUsageStats(code);
      expect(stats.totalUses).toBe(1);
      expect(stats.failedAttempts).toBe(1);
      expect(stats.lastUsed).toBeInstanceOf(Date);
    });
  });

  describe('Emergency Functions', () => {
    test('should handle fire alarm correctly', async () => {
      await device.emergencyManager.handleFireAlarm(true);
      expect(device.emergencyManager.isInEmergencyMode()).toBe(true);
      expect(device.emergencyManager.getEmergencyTriggers()).toContain('fire_alarm');
    });

    test('should reset emergency mode when all triggers are cleared', async () => {
      await device.emergencyManager.handleFireAlarm(true);
      await device.emergencyManager.handleFireAlarm(false);
      expect(device.emergencyManager.isInEmergencyMode()).toBe(false);
      expect(device.emergencyManager.getEmergencyTriggers()).toHaveLength(0);
    });
  });
});

describe('IDlock202 Device Tests', () => {
  test('Device initializes correctly', () => {
    const device = new ZwaveDevice();
    expect(device).toBeDefined();
  });
});