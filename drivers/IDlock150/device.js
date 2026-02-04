'use strict'

const { ZwaveDevice } = require('homey-zwavedriver')

// Documentation: https://Products.Z-WaveAlliance.org/ProductManual/File?folder=&filename=Manuals/2293/IDL Operational Manual EN v1.3.pdf

class IDlock150 extends ZwaveDevice {
  async onSettings({ oldSettings, newSettings, changedKeys }) {
    if (changedKeys.includes('Service_PIN_code')) {
      this.setUserCode(newSettings['Service_PIN_code'], this.isPre1_6() ? 2 : 108);
    }

    // Safety logic: Prevent conflict between internal Auto Lock and Homey-managed Auto Lock

    // Case A: User enables Homey Auto Lock Delay (> 0)
    // -> We must disable internal Auto Lock (set Doorlock_mode to Manual)
    if (changedKeys.includes('auto_lock_delay') && newSettings.auto_lock_delay > 0) {
      const currentMode = parseInt(newSettings.Doorlock_mode);
      // Modes: 0=Manual, 1=Auto, 2=Away+Manual, 3=Away+Auto
      // If Auto (1 or 3), switch to Manual (0 or 2)
      if (currentMode === 1 || currentMode === 3) {
        let newMode = 0; // Default to Manual
        if (currentMode === 3) newMode = 2; // Keep Away mode if active

        this.log(`Auto Lock Delay enabled (${newSettings.auto_lock_delay}s). Forcing Doorlock_mode from ${currentMode} to ${newMode} (Manual)`);

        // Update the Z-Wave parameter
        await this.configurationSet({ index: 1, size: 1 }, newMode);

        // Update the local settings object so the UI reflects the change (if possible via return)
        newSettings.Doorlock_mode = newMode.toString();
      }
    }

    // Case B: User enables internal Auto Lock (Doorlock_mode = 1 or 3)
    // -> We must disable Homey Auto Lock Delay (set to 0)
    if (changedKeys.includes('Doorlock_mode')) {
      const newMode = parseInt(newSettings.Doorlock_mode);
      if ((newMode === 1 || newMode === 3) && newSettings.auto_lock_delay > 0) {
        this.log(`Doorlock_mode set to Auto (${newMode}). Disabling Homey Auto Lock Delay.`);
        newSettings.auto_lock_delay = 0;
      }
    }

    await super.onSettings({oldSettings, newSettings, changedKeys});

    // After settings are applied, re-evaluate the auto lock timer
    this.checkAutoLock();
  }

  async onNodeInit () {
    // enable debugging
    // this.enableDebug();

    // print the node's info to the console
    // this.printNode();

    this.autoLockTimer = null;

    try {
      if (this.hasCapability('button.sync_pincodes') === false) {
        this.log("Adding capability button.sync_pincodes");
        await this.addCapability('button.sync_pincodes');
      }
    } catch (err) {
      this.error('Failed to add capability', err);
    }

    try {
      if (this.hasCapability('button.fetch_zw_fw_version') === false) {
        await this.addCapability('button.fetch_zw_fw_version');
      }
    } catch (err) {
      this.error('Failed to add capability', err);
    }

    try {
      if (this.hasCapability('zw_fw_version') === false) {
        await this.fetch_zw_fw_version();
      }
    } catch (err) {
      this.error('Failed to set Z-Wave fw version', err);
    }

    this.registerCapabilityListener('button.fetch_zw_fw_version', async () => this.fetch_zw_fw_version());

    this.registerCapabilityListener('button.sync_pincodes', async () => {
      let codes = JSON.parse(this.homey.settings.get('codes'));
      for (let i = 0; i < codes.length; i++) {
        const code = codes[i]
        if (code.type === 6 && code.pin) {
          if (code.index > 25) {
            throw new Error(`Index of pin code for ${code.user} is too high. Can not be above 25`)
          }
          if (code.pin.length > 10) {
              throw new Error(`Length of pin code for ${code.user} is too long. Max length is 10`)
          }
          if (code.pin.length < 4) {
              throw new Error(`Length of pin code for ${code.user} is too short. Min length is 4`)
          }
          this.log(`Synchronizing code: ${code.user} - ${code.index} - *******`)
          let userId = code.index
          if (this.isPre1_6())
            userId += 59
          this.setUserCode(code.pin, userId)
        }
      }
    });

    this.registerCapability('locked', 'DOOR_LOCK', {
      getOpts: {
        getOnStart: true,
        getOnOnline: false,
      },
      report: 'DOOR_LOCK_OPERATION_REPORT',
      reportParserV2: (report) => {
        this.log('Door Lock Mode report:', report)
        if (report && Object.prototype.hasOwnProperty.call(report, 'Door Lock Mode')) {
          // reset alarm_tamper or alarm_heat based on Unlock report
          if (report['Door Lock Mode'] === 'Door Unsecured') {
            if (this.getCapabilityValue('alarm_tamper')) {
              this.setCapabilityValue('alarm_tamper', false).catch(err => this.error('DOOR LOCK: Setting \'alarm_tamper\' capability value failed:', err))
            }
            if (this.getCapabilityValue('alarm_heat')) {
              this.setCapabilityValue('alarm_heat', false).catch(err => this.error('DOOR LOCK: Setting \'alarm_heat\' capability value failed:', err))
            }
            this.log('DOOR_LOCK: reset tamper and heat alarm')
          };

          const isLocked = report['Door Lock Mode'] === 'Door Secured';
          // Check auto lock directly with the new state
          this.checkAutoLock(isLocked, undefined);

          return isLocked;
        }
        return null
      }
    })

    this.registerCapability('locked', 'NOTIFICATION', {
      getOpts: {
        getOnStart: true,
        getOnOnline: false
      },
      reportParser: report => {
        this.log('---- Notification ----')
        if (report && report['Notification Type'] === 'Access Control' && Object.prototype.hasOwnProperty.call(report, 'Event')) {
          const triggerSettings = this.homey.settings.get('triggerSettings') || { homey: true, code: true, tag: true, button: false, auto: false }
          let token = { who: 'Uknown', type: 'None' }
          let state = { who: 'Uknown', type: 'none' }

          // Lock jammed
          if (report.Event === 11) {
            this.homey.flow.getDeviceTriggerCard('lock_jammed').trigger(this, null, null).catch(this.error)
            this.log('Triggered lock jammed')
          }

          // Button/manual lock/unlock Operation
          else if (report.Event === 1 || report.Event === 2) {
            token = { who: 'Button', type: 'Manual' }
            state = { who: 'Button', type: 'manual' }
            if (report.Event === 1) {
              this.triggerDoorLock(token, state, triggerSettings.button)
            } else {
              this.triggerDoorUnlock(token, state, triggerSettings.button)
            }
          }

          // Auto lock locked Operation
          else if (report.Event === 9) {
            token = { who: 'Automatic', type: 'Automatic' }
            state = { who: 'Automatic', type: 'automatic' }
            this.triggerDoorLock(token, state, triggerSettings.auto)
          }

          // Other operations, index based
          else if (Object.prototype.hasOwnProperty.call(report, 'Event Parameter')) {
            let triggerSetting
            const keyType = parseInt(report['Event Parameter'][0])
            const codes = JSON.parse(this.homey.settings.get('codes'))
            let masterIndex = 1
            let serviceIndex = 2
            let keyOffset = -59
            let tagOffset = -9
            // Override vith new indexing from v1.6
            if (!this.isPre1_6()) {
              masterIndex = 109
              serviceIndex = 108
              keyOffset = 0
              tagOffset = -25
            }
            // Keypad Unlock Operation
            if (report.Event === 5 || report.Event === 6) {
              triggerSetting = triggerSettings.code
              if (keyType === masterIndex) {
                token = { who: 'Master', type: 'Code' }
                state = { who: 'Master', type: 'code' }
              } else if (keyType === serviceIndex) {
                token = { who: 'Service', type: 'Code' }
                state = { who: 'Service', type: 'code' }
              } else {
                const keyId = keyType + keyOffset
                const type = parseInt(report['Event (Raw)'][0])
                let user = 'Unknown [key:' + keyId + ']'
                for (const i in codes) {
                  if (codes[i].index === keyId && codes[i].type === type) {
                    user = codes[i].user
                  }
                }
                token = { who: user, type: 'Code' }
                state = { who: user, type: 'code' }
              }
            }
            // RF Lock/Unlock Operation
            else if (report.Event === 3 || report.Event === 4) {
              if (keyType === 0) {
                triggerSetting = triggerSettings.homey
                token = { who: 'Homey', type: 'Automatic' }
                state = { who: 'Homey', type: 'automatic' }
              } else {
                const tagId = keyType + tagOffset
                const type = parseInt(report['Event (Raw)'][0])
                let user = 'Unknown [tag:' + tagId + ']'
                for (const i in codes) {
                  if (codes[i].index === tagId && codes[i].type === type) {
                    user = codes[i].user
                  }
                }
                triggerSetting = triggerSettings.tag
                token = { who: user, type: 'Tag' }
                state = { who: user, type: 'tag' }
              }
            }
            if (report.Event === 3 || report.Event === 5) {
              this.triggerDoorLock(token, state, triggerSetting)
            } else {
              this.triggerDoorUnlock(token, state, triggerSetting)
            }
          }
        }
        return null
      }
    })

    this.registerCapability('alarm_contact', 'DOOR_LOCK', {
      get: 'DOOR_LOCK_OPERATION_GET',
      getOpts: {
        getOnStart: true,
        getOnOnline: false,
      },
      report: 'DOOR_LOCK_OPERATION_REPORT',
      reportParserV2: (report) => {
        this.log('Door condition report:', report)
        if (report && Object.prototype.hasOwnProperty.call(report, 'Door Condition')) {
          this.log('Door Condition has changed:', report['Door Condition'])
          // check if Bit 0 is 1 (door closed) and return the inverse (alarm when door open)
          const isOpen = !(report['Door Condition'] & 0b001);

          this.checkAutoLock(undefined, isOpen);

          return isOpen;
        };
        return null
      }
    })

    this.registerCapability('measure_battery', 'BATTERY', {
      getOpts: {
        getOnStart: false,
        getOnOnline: false
      }
    })

    this.registerCapability('alarm_battery', 'BATTERY', {
      getOpts: {
        getOnStart: false,
        getOnOnline: false
      }
    })

    this.registerCapability('alarm_tamper', 'NOTIFICATION', {
      getOpts: {
        getOnStart: false,
        getOnOnline: false
      }
    })

    this.registerCapability('alarm_heat', 'NOTIFICATION', {
      get: 'NOTIFICATION_GET',
      getOpts: {
        getOnStart: false,
        getOnOnline: false
      },
      getParser: () => ({
        'V1 Alarm Type': 0,
        'Notification Type': 'Emergency',
        Event: 2
      }),
      report: 'NOTIFICATION_REPORT',
      reportParser: report => {
        if (report && report['Notification Type'] === 'Emergency' && Object.prototype.hasOwnProperty.call(report, 'Event (Parsed)')) {
          if (report['Event (Parsed)'] === 'Contact Fire Service') return true
          if (report['Event (Parsed)'] === 'Event inactive' && Object.prototype.hasOwnProperty.call(report, 'Event Parameter') && (report['Event Parameter'][0] === 2 || report['Event Parameter'][0] === 254)) {
            return false
          }
        }
        return null
      }
    })
  }

  isPre1_6() {
    if (this.hasCapability('zw_fw_version') === false) throw Error('zw_fw_version capability not found')
    const version = this.getCapabilityValue('zw_fw_version')
    const zw_version = version.split('.')[0]
    const zw_sub_version = version.split('.')[1]
    const is_pre_1_6 = zw_version < 1 || (zw_version === 1 && zw_sub_version < 6)

    this.log(`Z-Wave firmware version is ${version} - Firmware is ${is_pre_1_6?'':'not '}pre 1.6`)

    return is_pre_1_6
  }

  async fetch_zw_fw_version() {
    const commandClassConfiguration = this.getCommandClass('VERSION');
    return commandClassConfiguration.VERSION_GET()
        .then(async (result) => {
          const zw_version = result['Firmware 0 Version'];
          const zw_sub_version = result['Firmware 0 Sub Version'];
          this.log(`Z-Wave firmware version is ${zw_version}.${zw_sub_version}`);

          if (this.hasCapability('zw_fw_version') === false) {
            this.log('Adding capability zw_fw_version');
            await this.addCapability('zw_fw_version');
          }

          return this.setCapabilityValue('zw_fw_version', `${zw_version}.${zw_sub_version}`)
        })
        .catch((error) => {
          this.error("fetch_zw_fw_version() -> Failed to get lock version info");
          throw error;
        });
  }

  setUserCode(value, userId) {
    const byteLength = value.length;
    const commandClassConfiguration = this.getCommandClass('USER_CODE');
    const bufValue = Buffer.allocUnsafe(byteLength);
    value = `0x3${value.split('').join('3')}`;
    bufValue.writeUIntBE(value, 0, byteLength);
    commandClassConfiguration.USER_CODE_SET({
      'User Identifier': userId,
      'User ID Status': "Occupied",
      'USER_CODE': bufValue
    })
      .then(result => {
        this.log(
          `setUserCode() -> successfully set code for user ${userId}`,
        );
        return result;
      })
      .catch(err => {
        this.error(
          `setUserCode() -> failed to set code ${userId}: ${err}`,
        );
        return err;
      });
  }

  async triggerDoorLock (token, state, triggerSetting) {
    // this.setCapabilityValue('locked', true) // not sure if needed - but the lock icon has wrong if not added
    this.log('---- Trigger door lock ---- ')
    this.homey.flow.getDeviceTriggerCard('door_lock').trigger(this, token, state).catch(this.error)
    if (triggerSetting) {
      this.log('---- Trigger unlockstate ----')
      this.homey.flow.getDeviceTriggerCard('unlockstate').trigger(this, token, state).catch(this.error)
    }
    this.log('Door lock tokens:', token)
    this.log('Door lock states:', state)
  }

  async triggerDoorUnlock (token, state, triggerSetting) {
    // this.setCapabilityValue('locked', false)  // not sure if needed - but the lock icon has wrong if not added
    this.log('---- Trigger door unlock ---- ')
    this.homey.flow.getDeviceTriggerCard('door_unlock').trigger(this, token, state).catch(this.error)
    if (triggerSetting) {
      this.log('---- Trigger lockstate ----')
      this.homey.flow.getDeviceTriggerCard('lockstate').trigger(this, token, state).catch(this.error)
    }
    this.log('Door unlock tokens:', token)
    this.log('Door unlock states:', state)
  }

  async awaymodeActionRunListener (args, state) {
    console.log('---- Set away mode ---- ')
    return this.configurationSet({
      index: 1, // Doorlock_mode
      size: 1
    }, args.mode)
      .then(result => {
        // Also update app setting to same value
        this.setSettings({ Doorlock_mode: args.mode })

        // Safety logic: If user sets mode to Auto (1 or 3), disable auto lock delay
        const newMode = parseInt(args.mode);
        if ((newMode === 1 || newMode === 3) && this.getSetting('auto_lock_delay') > 0) {
           this.log(`Away mode action set to Auto (${newMode}). Disabling Homey Auto Lock Delay.`);
           this.setSettings({ auto_lock_delay: 0 });
        }

        return result
      })
  }

  async updateLockStatusActionRunListener (args, state) {
    console.log('---- Update lockstatus ---- ')
    const commandClassConfiguration = this.getCommandClass('DOOR_LOCK');
    return commandClassConfiguration.DOOR_LOCK_OPERATION_GET()
        .then((result) => {
          const locked = result['Door Lock Mode'] === 'Door Secured';
          const open = !(result['Door Condition'] & 0b001);

          this.log("Locked: ", locked);
          this.log("Open: ", open);

          this.setCapabilityValue('locked', locked).catch(this.error);
          this.setCapabilityValue('alarm_contact', open).catch(this.error);

          this.checkAutoLock(locked, open); // Check if we should lock
        })
        .catch((error) => {
          this.error("updateLockStatusActionRunListener() -> Failed to update lock status: ", error);
          throw error;
        });
  }

  async setAutoLockDelayAction(args) {
    this.log(`---- Set Auto Lock Delay to ${args.delay} seconds ----`);

    // Update setting
    this.setSettings({ auto_lock_delay: args.delay });

    // Safety logic: If delay > 0, ensure internal auto lock is disabled
    if (args.delay > 0) {
        const currentMode = parseInt(this.getSetting('Doorlock_mode'));
        if (currentMode === 1 || currentMode === 3) {
            let newMode = 0;
            if (currentMode === 3) newMode = 2;

            this.log(`Auto Lock Delay enabled via flow. Forcing Doorlock_mode from ${currentMode} to ${newMode} (Manual)`);
            await this.configurationSet({ index: 1, size: 1 }, newMode);
            this.setSettings({ Doorlock_mode: newMode.toString() });
        }
    }

    this.checkAutoLock();
    return true;
  }

  cancelAutoLock() {
    if (this.autoLockTimer) {
        this.log('Cancelling auto lock timer');
        clearTimeout(this.autoLockTimer);
        this.autoLockTimer = null;
    }
  }

  checkAutoLock(isLocked, isOpen) {
    const delay = this.getSetting('auto_lock_delay');

    // If undefined, fallback to capability value
    const locked = isLocked !== undefined ? isLocked : this.getCapabilityValue('locked');
    const open = isOpen !== undefined ? isOpen : this.getCapabilityValue('alarm_contact');

    // If feature disabled, or door is locked, or door is open -> cancel timer
    if (!delay || delay <= 0 || locked || open) {
        this.cancelAutoLock();
        return;
    }

    // If door is unlocked AND closed AND delay > 0
    if (!locked && !open && delay > 0) {
        if (this.autoLockTimer) {
            // Timer already running?
            this.cancelAutoLock();
        }

        this.log(`Starting auto lock timer for ${delay} seconds`);
        this.autoLockTimer = setTimeout(() => {
            this.triggerAutoLock();
        }, delay * 1000);
    }
  }

  triggerAutoLock() {
    this.log('Auto lock timer expired. Locking door...');
    this.autoLockTimer = null;

    // Check one last time conditions
    const locked = this.getCapabilityValue('locked');
    const open = this.getCapabilityValue('alarm_contact');

    if (!locked && !open) {
         // Trigger the locked capability logic, which sends the Z-Wave command
         this.triggerCapabilityListener('locked', true)
            .catch(err => this.error('Failed to trigger locked capability listener for auto lock', err));
    } else {
        this.log('Auto lock aborted: Door is already locked or open');
    }
  }
}
module.exports = IDlock150
