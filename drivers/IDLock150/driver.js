'use strict';

const { Driver } = require('homey');

class IDLock150Driver extends Driver {
    
    async onInit() {
        this.log('IDLock202 driver initializing...');
        
        // Register basic flow cards
        await this.registerFlowCards();
        
        this.log('IDLock202 driver initialized');
    }

    /**
     * Called when pairing should start
     * Master key * 9 * 1 puts lock in pairing mode
     */
    async onPairListDevices() {
        this.log('Starting Z-Wave inclusion - Put lock in pairing mode using Master key * 9 * 1');
        
        // Let Z-Wave do device discovery
        const discoveryStrategy = this.homey.discovery.getStrategy('zwave');
        const discoveryResults = Object.values(await discoveryStrategy.getDiscoveryResults());

        // Filter for our device
        const devices = discoveryResults
            .filter(discoveryResult => 
                discoveryResult.zwave.manufacturerId === 865 &&
                discoveryResult.zwave.productTypeId === 1
            )
            .map(discoveryResult => {
                return {
                    name: 'ID Lock 202 Multi',
                    data: {
                        id: discoveryResult.id
                    }
                };
            });

        return devices;
    }

    /**
     * Register flow cards
     */
    async registerFlowCards() {
        // Lock state conditions
        this.homey.flow.getConditionCard('is_locked')
            .registerRunListener(async (args, state) => {
                return args.device.getCapabilityValue('locked');
            });

        // Auto-lock conditions
        this.homey.flow.getConditionCard('autolock_enabled')
            .registerRunListener(async (args, state) => {
                return args.device.getCapabilityValue('autolock_enabled');
            });
    }
}

module.exports = IDLock150Driver;
