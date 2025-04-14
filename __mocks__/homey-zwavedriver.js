'use strict';

class ZwaveDevice {
  constructor() {
    this.capabilities = {};
  }

  log() {}
  error(message, error) {
    console.error(message, error); // Mock logging for errors
  }
  onInit() {}
  registerCapability(capability, commandClass) {
    this.capabilities[capability] = commandClass;
  }
}

module.exports = {
  ZwaveDevice,
};