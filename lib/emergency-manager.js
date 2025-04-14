const Homey = require('homey');

class EmergencyManager {
    constructor(device) {
        this.device = device;
        this.currentDateTime = new Date('2025-04-13T20:21:51Z');
        this.currentUser = 'ArnBdev';
        
        // Initialiser nødåpningssystem
        this._initializeEmergencySystem();
    }

    async _initializeEmergencySystem() {
        // Opprett Flow-kort
        this.emergencyTrigger = this.device.homey.flow.getDeviceTriggerCard('emergency_unlock');
        this.fireAlarmTrigger = this.device.homey.flow.getDeviceTriggerCard('fire_alarm_unlock');

        // Standard nødåpningsinnstillinger
        await this._setupEmergencyDefaults();
    }

    async _setupEmergencyDefaults() {
        // Hent eksisterende innstillinger eller opprett nye
        const settings = await this.device.getStoreValue('emergencySettings') || {
            autoUnlockOnFire: true,
            notifyOnEmergency: true,
            emergencyContacts: []
        };

        await this.device.setStoreValue('emergencySettings', settings);
    }

    async handleFireAlarm(triggered) {
        if (triggered && await this.device.getStoreValue('emergencySettings').autoUnlockOnFire) {
            try {
                // Lås opp døren
                await this.device.setCapabilityValue('locked', false);

                // Log hendelsen
                await this._logEmergencyEvent({
                    type: 'fire_alarm_unlock',
                    timestamp: this.currentDateTime,
                    success: true
                });

                // Trigger flow
                await this.fireAlarmTrigger.trigger(this.device, {
                    time: this.currentDateTime,
                    action: 'emergency_unlock'
                });

                return true;
            } catch (error) {
                console.error('Feil ved nødopplåsing:', error);
                return false;
            }
        }
        return false;
    }

    async _logEmergencyEvent(event) {
        const logEntry = {
            ...event,
            device: this.device.getName(),
            user: this.currentUser
        };

        const emergencyLog = await this.device.getStoreValue('emergencyLog') || [];
        emergencyLog.unshift(logEntry);
        
        // Behold kun de siste 100 hendelsene
        if (emergencyLog.length > 100) {
            emergencyLog.pop();
        }

        await this.device.setStoreValue('emergencyLog', emergencyLog);
    }
}

module.exports = EmergencyManager;