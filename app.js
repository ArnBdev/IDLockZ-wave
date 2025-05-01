'use strict';

const Homey = require('homey');

class IDLockApp extends Homey.App {
    /**
     * onInit is called when the app is initialized
     */
    async onInit() {
        try {
            this.log('ID Lock app is initializing...');

            // Register flow cards
            await this.registerFlowCards();

            // Register app-level event handlers
            await this.registerEventListeners();

            // Initialize any app-level settings
            await this.initializeSettings();

            this.log('ID Lock app has been initialized');
        } catch (error) {
            this.error('Failed to initialize app:', error);
            throw error;
        }
    }

    /**
     * Register app-level event listeners
     */
    async registerEventListeners() {
        // Listen for app-level events
        this.homey.on('unload', () => {
            this.log('App is unloading...');
            // Clean up any monitoring
            this.cleanupMonitoring();
        });

        this.homey.on('ready', () => {
            this.log('App is ready');
        });
    }

    /**
     * Initialize app settings
     */
    async initializeSettings() {
        // Get app manifest for version info
        const manifest = this.homey.manifest;
        this.log(`App version: ${manifest.version}`);

        // Log some diagnostic information
        this.log('System information:');
        this.log('- Homey version:', this.homey.version);
        this.log('- App SDK version:', manifest.sdk);
        this.log('- Node.js version:', process.version);

        // Initialize default monitoring settings if needed
        if (!this.homey.settings.get('monitoringDefaults')) {
            this.homey.settings.set('monitoringDefaults', {
                enabled: true,
                interval: 300000,      // 5 minutes
                storageLimit: 1000,    // 1000 samples
                batteryWarning: 15,    // 15%
                memoryWarning: 0.85    // 85%
            });
        }
    }

    /**
     * Register flow cards
     */
    async registerFlowCards() {
        // Register trigger card
        this.homey.flow.getTriggerCard('performance_alert_triggered')
            .registerRunListener(async (args, state) => {
                // This card is triggered from the device class
                return true;
            });

        // Register condition card
        this.homey.flow.getConditionCard('performance_alert')
            .registerRunListener(async (args, state) => {
                // This is handled in the device class
                return false;
            });

        // Register action card
        this.homey.flow.getActionCard('generate_performance_report')
            .registerRunListener(async (args, state) => {
                // This is handled in the device class
                return true;
            });
    }

    /**
     * Clean up monitoring when app unloads
     */
    cleanupMonitoring() {
        try {
            // Get all devices
            const devices = this.homey.drivers.getDriver('IDLock150').getDevices();
            
            // Stop monitoring for each device
            devices.forEach(device => {
                if (device.monitor) {
                    device.monitor.stopDevice(device);
                }
            });
        } catch (error) {
            this.error('Error during cleanup:', error);
        }
    }

    /**
     * Log helper for consistent format
     */
    log(...args) {
        this.homey.log('[ID Lock]', ...args);
    }

    /**
     * Error log helper for consistent format
     */
    error(...args) {
        this.homey.error('[ID Lock][ERROR]', ...args);
    }
}

module.exports = IDLockApp;
