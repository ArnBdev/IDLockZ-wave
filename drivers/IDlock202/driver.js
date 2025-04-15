'use strict';
const Homey = require('homey');

class IDlock202Driver extends Homey.Driver {
  async onInit() {
    this.log('IDLock 202 driver initialized');
  }
}

module.exports = IDlock202Driver;