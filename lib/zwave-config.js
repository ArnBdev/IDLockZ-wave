﻿const ZWaveConfig = {
    // Støtter både ID Lock 150 og 202 Multi
    devices: {
        'idlock150': {
            manufacturerId: 883,
            productTypeId: 3,
            productId: 1
        },
        'idlock202': {
            manufacturerId: 883,
            productTypeId: 3,     // Samme Z-Wave chip som 150
            productId: 2,         // Endret til unik ID for 202 Multi
            deviceId: 'ID Lock 202'
        }
    },
    
    wakeUpInterval: 3600,      // 1 time (optimalisert for batterilevetid)
    
    // Kommandoklasser som støttes av begge modeller
    commandClasses: {
        COMMAND_CLASS_BASIC: true,
        COMMAND_CLASS_DOOR_LOCK: true,
        COMMAND_CLASS_USER_CODE: true,
        COMMAND_CLASS_BATTERY: true,
        COMMAND_CLASS_NOTIFICATION: true,
        COMMAND_CLASS_CONFIGURATION: true  // Lagt til for konfigurasjon
    },
    
    // Systeminnstillinger (tilpasset for begge modeller)
    settings: {
        autoLock: {
            index: 1,
            size: 1,
            defaultValue: 1, // Automatisk låsing på som standard
        },
        awayMode: {
            index: 2,
            size: 1,
            defaultValue: 0, // Away mode av som standard
        },
        // Nye innstillinger spesifikt for 202 Multi
        soundLevel: {
            index: 3,
            size: 1,
            defaultValue: 2, // Medium lydnivå som standard (0=Off, 1=Low, 2=Medium, 3=High)
        },
        ledLevel: {
            index: 4,
            size: 1,
            defaultValue: 2, // Medium LED-styrke som standard
        }
    }
};

module.exports = ZWaveConfig;