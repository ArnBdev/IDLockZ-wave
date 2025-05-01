'use strict';

const { ZwaveDevice } = require('homey-zwavedriver');

class IDLock150Device extends ZwaveDevice {
    
    async onNodeInit() {
        this.log('ID Lock 202 initializing...');
        this.enableDebug();
        this.printNode();

        // Check for S0 security using node information
        const secureValue = this.getStoreValue('zw_secure');
        const hasSecurityCC = this.node && this.node.CommandClass && this.node.CommandClass.COMMAND_CLASS_SECURITY;
        
        this.log('Security status:', {
            secureValue,
            hasSecurityCC: !!hasSecurityCC,
            isSecure: this.node.isSecure
        });

        // Accept either S0 or SecurityCC presence
        if (!hasSecurityCC && secureValue !== 'S0') {
            this.error('Device is not securely included! Please remove and include the device again using secure inclusion.');
            throw new Error('Device must be securely included');
        }

        try {
            // Initialize settings
            this.autoLockEnabled = this.getSetting('auto_lock_enabled') || false;
            this.autoLockTime = parseInt(this.getSetting('auto_lock_time')) || 10;
            
            // Register capabilities
            await this.registerCapability('locked', 'DOOR_LOCK', {
                get: 'DOOR_LOCK_OPERATION_GET',
                set: 'DOOR_LOCK_OPERATION_SET',
                setParserV2: (value) => {
                    this.log('Setting lock state to:', value);
                    return {
                        'Door Lock Mode': value ? 'Door Secured' : 'Door Unsecured'
                    };
                },
                report: 'DOOR_LOCK_OPERATION_REPORT',
                reportParserV2: report => {
                    if (!report) return null;
                    const locked = report['Door Lock Mode'] === 'Door Secured';
                    this.log('Lock state changed:', locked);
                    
                    // Update door state based on Door Condition
                    const doorCondition = report['Door Condition'];
                    if (typeof doorCondition === 'number') {
                        const isOpen = doorCondition === 0x00 || doorCondition === 0x02;
                        this.log('Door condition:', doorCondition, 'isOpen:', isOpen);
                        this.setCapabilityValue('contact_alarm', isOpen).catch(this.error);

                        // Handle auto-lock when door closes using local timer
                        if (!isOpen && this.getCapabilityValue('onoff') && !locked) {
                            this.log('Door closed, starting auto-lock timer...');
                            if (this.autoLockTimeout) clearTimeout(this.autoLockTimeout);
                            this.autoLockTimeout = setTimeout(() => {
                                this.log('Auto-locking door...');
                                this.setCapabilityValue('locked', true).catch(this.error);
                            }, this.autoLockTime * 1000);
                        }
                    }
                    
                    return locked;
                }
            });

            // Battery monitoring
            await this.registerCapability('measure_battery', 'BATTERY');

            // Door state monitoring
            await this.registerCapability('contact_alarm', 'NOTIFICATION', {
                get: 'NOTIFICATION_GET',
                getParser: () => ({
                    'V1 Alarm Type': 0,
                    'Notification Type': 'Access Control',
                    'Event': 0
                }),
                report: 'NOTIFICATION_REPORT',
                reportParser: report => {
                    if (!report || report['Notification Type'] !== 'Access Control') return null;
                    
                    const event = report['Event'];
                    this.log('Access Control notification:', event);
                    
                    switch (event) {
                        case 0x01: // Manual lock
                        case 0x03: // RF lock
                        case 0x09: // Auto lock
                            return false;
                        case 0x02: // Manual unlock
                        case 0x04: // RF unlock
                            return true;
                        case 0x0B: // Lock jammed
                            this.driver.triggerLockJammedFlow(this);
                            return null;
                        default:
                            return null;
                    }
                }
            });

            // Register auto-lock capability listeners
            this.registerCapabilityListener('onoff', async (value) => {
                this.log('Auto-lock enabled changed:', value);
                await this.setSettings({ auto_lock_enabled: value });
                return value;
            });

            this.registerCapabilityListener('dim', async (value) => {
                this.log('Auto-lock time changed:', value);
                const timeValue = Math.round(value);
                this.autoLockTime = timeValue;
                await this.setSettings({ auto_lock_time: timeValue.toString() });
                return timeValue;
            });

            // Set initial values
            await this.setCapabilityValue('onoff', this.autoLockEnabled);
            await this.setCapabilityValue('dim', this.autoLockTime);

            this.log('ID Lock 202 initialized successfully');
        } catch (err) {
            this.error('Failed to initialize device:', err);
            throw err;
        }
    }

    // Cleanup on unload
    async onUninit() {
        if (this.autoLockTimeout) {
            clearTimeout(this.autoLockTimeout);
        }
        this.log('ID Lock 202 unloading');
    }
}

module.exports = IDLock150Device;
