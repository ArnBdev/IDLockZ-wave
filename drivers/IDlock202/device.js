'use strict';
const { ZwaveDevice } = require('homey-zwavedriver');

class IDlock202Device extends ZwaveDevice {
  async onNodeInit() {
    this.log('IDLock 202 device initialized');
    this.printNode();

    if (!this.node.isSecure) {
      this.error('Node is not secure! Please remove and include with security');
      return;
    }

    this.registerCapability('locked', 'DOOR_LOCK');
    this.registerCapability('measure_battery', 'BATTERY');
    this.registerCapability('alarm_battery', 'BATTERY');
    this.registerCapability('autolock_enabled', 'CONFIGURATION', { index: 1, size: 1 });
    this.registerCapability('autolock_time', 'CONFIGURATION', { index: 2, size: 1 });

    this.registerCapabilityListener('locked', async (value, opts) => {
      this.log('User requested lock state:', value);
      await this.node.CommandClass['DOOR_LOCK'].DOOR_LOCK_OPERATION_SET({
        'Door Lock Mode': value ? 'Door Secured' : 'Door Unsecured'
      });
      return true;
    });
  }
}

module.exports = IDlock202Device;