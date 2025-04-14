'use strict';

class ZwaveDevice {
  constructor() {
    this.capabilities = {};
  }

  log() {}
  onInit() {}
  registerCapability(capability, commandClass) {
    this.capabilities[capability] = commandClass;
  }
}

module.exports = {
  ZwaveDevice,
};

"jest": {
  "moduleNameMapper": {
    "^homey$": "<rootDir>/__mocks__/homey.js",
    "^homey-zwavedriver$": "<rootDir>/__mocks__/homey-zwavedriver.js"
  }
}