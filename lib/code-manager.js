﻿const crypto = require('crypto');
const EventEmitter = require('events');

class CodeManager extends EventEmitter {
    constructor(device) {
        super();
        this.device = device;
        this.homey = device.homey;
        this.logger = device.log || console.log;
        this.errorLogger = device.error || console.error;
        
        // Enhanced security settings
        this.securitySettings = {
            maxFailedAttempts: 5,            // Maximum failed attempts before triggering suspicious activity
            lockoutPeriodMinutes: 30,        // Period to monitor for suspicious activity
            maxHistoryItems: 100,            // Maximum history items to store
            auditLogRetentionDays: 90,       // How long to keep audit logs
            passwordHashIterations: 10000,   // PBKDF2 iterations for deriving key
            encryptionAlgorithm: 'aes-256-gcm' // Encryption algorithm to use
        };
        
        // Initialize data structures
        this.codes = {};
        this.history = [];
        this.failedAttempts = {};
        this.suspiciousIPs = new Set();
        
        // Define the code types (inspired by Better Logic)
        this.codeTypes = {
            PIN: { value: 6, display: 'PIN-kode', maxSlots: 25, icon: 'lock' },
            RFID: { value: 4, display: 'RFID-brikke', maxSlots: 25, icon: 'tag' },
            TEMP: { value: 7, display: 'Midlertidig kode', maxSlots: 5, icon: 'clock' }
        };
        
        // Set up settings change listener for code changes from UI
        this.homey.settings.on('set', this._handleSettingsChange.bind(this));

        // Set up periodic checks for expired codes
        this.expiryCheckInterval = setInterval(() => {
            this.checkExpiredCodes().catch(err => 
                this.errorLogger('Error in periodic expired code check:', err)
            );
        }, 3600000); // Check every hour
    }
    
    // Initialize CodeManager asynchronously
    async init() {
        // Get or create the encryption key
        this.encryptionKey = null;
        await this.getOrCreateEncryptionKey();

        // Load security settings from storage
        await this.loadSecuritySettings();

        // Sync codes to settings
        await this.syncCodesToSettings();
    }

    // Clean up when the device is deleted/removed
    destroy() {
        clearInterval(this.expiryCheckInterval);
        this.removeAllListeners();
        this.logger('CodeManager destroyed');
    }
    
    // Handle settings changes from UI
    async _handleSettingsChange(key) {
        if (key === 'codes') {
            this.logger('Detected codes change in settings, syncing with CodeManager...');
            try {
                // Get the codes from settings
                const codesFromSettings = await this.homey.settings.get('codes') || [];
                if (!Array.isArray(codesFromSettings)) {
                    this.logger('Invalid codes format in settings, ignoring');
                    return;
                }
                
                // Process each code from settings
                for (const code of codesFromSettings) {
                    // Only process codes with proper format
                    if (!code.index || !code.user) continue;
                    
                    const userId = String(code.index);
                    const options = {
                        name: code.user,
                        type: parseInt(code.type) === 4 ? 'tag' : 'code'
                    };
                    
                    // Check if expiry date is set
                    if (code.expiresAt) {
                        options.expiresAt = code.expiresAt;
                    }
                    
                    // For PIN codes, update in CodeManager if we have the code
                    if (parseInt(code.type) === 6 && code.pinCode) {
                        try {
                            // Check if code exists
                            if (this.codes[userId]) {
                                await this.updateCode(userId, code.pinCode, options);
                            } else {
                                await this.addCode(userId, code.pinCode, options);
                            }
                        } catch (err) {
                            this.errorLogger(`Error processing PIN code ${userId} from UI:`, err);
                        }
                    } 
                    // For tags or codes without PIN, just update/add metadata
                    else if (parseInt(code.type) === 4) {
                        try {
                            // For tags, we don't need the actual PIN, just metadata
                            // Check if code exists
                            if (this.codes[userId]) {
                                // Update metadata only
                                this.codes[userId] = {
                                    ...this.codes[userId],
                                    name: options.name,
                                    type: options.type,
                                    updatedAt: new Date().toISOString(),
                                    expiresAt: options.expiresAt || this.codes[userId].expiresAt
                                };
                            } else {
                                // Add dummy code for tags
                                await this.addCode(userId, '0000', options);
                            }
                        } catch (err) {
                            this.errorLogger(`Error processing tag ${userId} from UI:`, err);
                        }
                    }
                }
                
                // Check for codes to remove (codes in CodeManager but not in settings)
                const userIdsFromSettings = codesFromSettings.map(c => String(c.index));
                for (const userId in this.codes) {
                    if (!userIdsFromSettings.includes(userId)) {
                        try {
                            await this.removeCode(userId);
                        } catch (err) {
                            this.errorLogger(`Error removing code ${userId} that was removed from UI:`, err);
                        }
                    }
                }
                
                // Sync back to settings to ensure safe codes are updated
                await this.syncCodesToSettings();
                
            } catch (err) {
                this.errorLogger('Error handling codes change from settings:', err);
            }
        } else if (key === 'securitySettings') {
            this.logger('Detected security settings change, updating...');
            try {
                const newSettings = await this.homey.settings.get('securitySettings');
                if (newSettings && typeof newSettings === 'object') {
                    this.securitySettings = {
                        ...this.securitySettings,
                        ...newSettings
                    };
                    this.logger('Security settings updated successfully');
                    
                    // Emit security settings change event
                    this.emit('securitySettingsChanged', this.securitySettings);
                }
            } catch (err) {
                this.errorLogger('Error updating security settings:', err);
            }
        }
    }
    
    // Load security settings from storage
    async loadSecuritySettings() {
        try {
            const storedSettings = await this.homey.settings.get('securitySettings');
            if (storedSettings && typeof storedSettings === 'object') {
                this.securitySettings = {
                    ...this.securitySettings,  // Keep defaults
                    ...storedSettings          // Override with stored settings
                };
                this.logger('Loaded security settings from storage');
            } else {
                this.logger('No stored security settings found, using defaults');
            }
            return this.securitySettings;
        } catch (err) {
            this.errorLogger('Failed to load security settings:', err);
            throw err;
        }
    }

    // Get or create the encryption key from secure storage
    async getOrCreateEncryptionKey() {
        try {
            // Try to get existing key from secure storage
            this.encryptionKey = await this.homey.settings.get('encryptionKey');
            
            if (!this.encryptionKey) {
                // Generate a new random key if none exists
                this.encryptionKey = crypto.randomBytes(32).toString('hex');
                await this.homey.settings.set('encryptionKey', this.encryptionKey);
                this.logger('Created new encryption key');
            }
            
            return true;
        } catch (error) {
            this.errorLogger('Error getting/creating encryption key:', error);
            throw error;
        }
    }

    // Encrypt a value using AES-256-GCM
    encrypt(text) {
        if (!text) return null;
        
        try {
            const iv = crypto.randomBytes(16);
            const key = crypto.pbkdf2Sync(
                this.encryptionKey, 
                iv.toString('hex'), 
                this.securitySettings.passwordHashIterations, 
                32, 
                'sha512'
            );
            
            const cipher = crypto.createCipheriv(
                this.securitySettings.encryptionAlgorithm, 
                key, 
                iv
            );
            
            const encrypted = Buffer.concat([
                cipher.update(text, 'utf8'), 
                cipher.final()
            ]);
            
            const authTag = cipher.getAuthTag();
            
            return {
                iv: iv.toString('hex'),
                encrypted: encrypted.toString('hex'),
                authTag: authTag.toString('hex')
            };
        } catch (error) {
            this.errorLogger('Encryption error:', error);
            throw new Error('Encryption failed');
        }
    }

    // Decrypt a value using AES-256-GCM
    decrypt(encryptedData) {
        if (!encryptedData) return null;
        
        try {
            const iv = Buffer.from(encryptedData.iv, 'hex');
            const key = crypto.pbkdf2Sync(
                this.encryptionKey, 
                encryptedData.iv, 
                this.securitySettings.passwordHashIterations, 
                32, 
                'sha512'
            );
            
            const decipher = crypto.createDecipheriv(
                this.securitySettings.encryptionAlgorithm, 
                key, 
                iv
            );
            
            decipher.setAuthTag(Buffer.from(encryptedData.authTag, 'hex'));
            
            const decrypted = Buffer.concat([
                decipher.update(Buffer.from(encryptedData.encrypted, 'hex')),
                decipher.final()
            ]);
            
            return decrypted.toString('utf8');
        } catch (error) {
            this.errorLogger('Decryption error:', error);
            throw new Error('Decryption failed');
        }
    }

    // Add a code with full security measures
    async addCode(userId, code, options = {}) {
        // Validate the code first
        const validation = this.validateCode(code);
        if (!validation.valid) {
            throw new Error(`Invalid code: ${validation.message}`);
        }
        
        if (this.codes[userId]) {
            throw new Error(`Code for user ${userId} already exists`);
        }
        
        // Encrypt the code before storing
        const encrypted = this.encrypt(code);
        
        this.codes[userId] = {
            encrypted,
            name: options.name || `User ${userId}`,
            addedAt: new Date().toISOString(),
            expiresAt: options.expiresAt || null,
            type: options.type || 'code', // 'code' or 'tag'
            lastUsed: null,
            usageCount: 0
        };
        
        // Add to audit history
        this.addToHistory({
            action: 'add',
            userId,
            timestamp: new Date().toISOString(),
            name: this.codes[userId].name
        });
        
        // Save changes to device
        await this.saveCodesToDevice();
        
        // Emit code added event
        this.emit('codeAdded', {
            userId,
            name: this.codes[userId].name,
            type: options.type || 'code'
        });
        
        return true;
    }

    // Update an existing code
    async updateCode(userId, newCode, options = {}) {
        if (!this.codes[userId]) {
            throw new Error(`No code found for user ${userId}`);
        }
        
        // Validate the new code
        const validation = this.validateCode(newCode);
        if (!validation.valid) {
            throw new Error(`Invalid code: ${validation.message}`);
        }
        
        // Encrypt the new code
        const encrypted = this.encrypt(newCode);
        
        const oldCode = this.codes[userId];
        
        this.codes[userId] = {
            ...oldCode,
            encrypted,
            name: options.name || oldCode.name,
            expiresAt: options.expiresAt || oldCode.expiresAt,
            updatedAt: new Date().toISOString()
        };
        
        // Add to audit history
        this.addToHistory({
            action: 'update',
            userId,
            timestamp: new Date().toISOString(),
            name: this.codes[userId].name
        });
        
        // Save changes to device
        await this.saveCodesToDevice();
        
        // Emit code updated event
        this.emit('codeUpdated', {
            userId,
            name: this.codes[userId].name
        });
        
        return true;
    }

    // Remove a code
    async removeCode(userId) {
        if (!this.codes[userId]) {
            throw new Error(`No code found for user ${userId}`);
        }
        
        const userName = this.codes[userId].name;
        
        // Add to audit history before deletion
        this.addToHistory({
            action: 'remove',
            userId,
            timestamp: new Date().toISOString(),
            name: userName
        });
        
        // Delete the code
        delete this.codes[userId];
        
        // Save changes to device
        await this.saveCodesToDevice();
        
        // Emit code removed event
        this.emit('codeRemoved', {
            userId,
            name: userName
        });
        
        return true;
    }

    // Validate a code against security rules
    validateCode(code) {
        const rules = {
            minLength: 4,
            maxLength: 10,
            pattern: /^\d+$/,
            noSequential: true,
            noRepeating: true
        };
        
        if (!code || typeof code !== 'string') {
            return { valid: false, message: 'Code must be a string of digits' };
        }
        
        if (code.length < rules.minLength || code.length > rules.maxLength) {
            return { valid: false, message: `Code must be between ${rules.minLength} and ${rules.maxLength} digits` };
        }
        
        if (!rules.pattern.test(code)) {
            return { valid: false, message: 'Code must contain only digits' };
        }
        
        if (rules.noSequential) {
            for (let i = 0; i < code.length - 2; i++) {
                if (parseInt(code[i]) + 1 === parseInt(code[i + 1]) && 
                    parseInt(code[i + 1]) + 1 === parseInt(code[i + 2])) {
                    return { valid: false, message: 'Code cannot contain sequential numbers' };
                }
            }
        }
        
        if (rules.noRepeating) {
            for (let i = 0; i < code.length - 2; i++) {
                if (code[i] === code[i + 1] && code[i + 1] === code[i + 2]) {
                    return { valid: false, message: 'Code cannot contain three or more repeated digits' };
                }
            }
        }
        
        return { valid: true };
    }

    // Log a code access attempt
    async logCodeAttempt(userId, success, method = 'code', metadata = {}) {
        // Create an entry for this user if it doesn't exist
        if (!this.failedAttempts[userId]) {
            this.failedAttempts[userId] = {
                count: 0,
                firstAttempt: new Date(),
                recentAttempts: []
            };
        }
        
        const now = new Date();
        
        // Add to recent attempts
        this.failedAttempts[userId].recentAttempts.push({
            timestamp: now,
            success,
            method,
            ip: metadata.ip || null,
            location: metadata.location || null
        });
        
        // Keep only last 10 attempts
        if (this.failedAttempts[userId].recentAttempts.length > 10) {
            this.failedAttempts[userId].recentAttempts.shift();
        }
        
        if (!success) {
            // Increment failed attempts counter
            this.failedAttempts[userId].count++;
            
            // Check for suspicious activity
            const maxAttempts = this.securitySettings.maxFailedAttempts;
            const lockoutPeriod = this.securitySettings.lockoutPeriodMinutes * 60 * 1000; // convert to ms
            const firstAttempt = this.failedAttempts[userId].firstAttempt;
            
            if (this.failedAttempts[userId].count >= maxAttempts && 
                (now - firstAttempt) <= lockoutPeriod) {
                
                // Emit suspicious activity event with relevant data
                this.emit('suspiciousActivity', {
                    userId,
                    attemptCount: this.failedAttempts[userId].count,
                    timeWindow: Math.round((now - firstAttempt) / 1000),
                    recentAttempts: this.failedAttempts[userId].recentAttempts,
                    metadata
                });
                
                // If IP is available, add to suspicious IPs list
                if (metadata.ip) {
                    this.suspiciousIPs.add(metadata.ip);
                }
                
                // Add to audit history
                this.addToHistory({
                    action: 'suspicious',
                    userId,
                    timestamp: now.toISOString(),
                    name: this.codes[userId]?.name || `Unknown (${userId})`,
                    details: `${this.failedAttempts[userId].count} failed attempts`
                });
            }
        } else {
            // Reset failed attempts on success
            this.failedAttempts[userId].count = 0;
            this.failedAttempts[userId].firstAttempt = now;
            
            // Update the code record if it exists
            if (this.codes[userId]) {
                this.codes[userId].lastUsed = now.toISOString();
                this.codes[userId].usageCount = (this.codes[userId].usageCount || 0) + 1;
                await this.saveCodesToDevice();
                
                // Add usage to history
                this.addToHistory({
                    action: 'used',
                    userId,
                    timestamp: now.toISOString(),
                    name: this.codes[userId].name,
                    method
                });
            }
        }
        
        return true;
    }

    // Record an access attempt (alias for logCodeAttempt)
    recordAccessAttempt(userId, success, method, metadata) {
        return this.logCodeAttempt(userId, success, method, metadata);
    }

    // Check for expired codes and remove them
    async checkExpiredCodes() {
        const now = new Date();
        let expiredFound = false;
        
        for (const [userId, codeData] of Object.entries(this.codes)) {
            if (codeData.expiresAt && new Date(codeData.expiresAt) <= now) {
                // Add to audit history
                this.addToHistory({
                    action: 'expire',
                    userId,
                    timestamp: now.toISOString(),
                    name: codeData.name
                });
                
                // Emit event for code expiration
                this.emit('codeExpired', {
                    userId,
                    name: codeData.name,
                    expiredAt: codeData.expiresAt
                });
                
                // Delete the expired code
                delete this.codes[userId];
                expiredFound = true;
            }
        }
        
        // Save changes if any codes were expired
        if (expiredFound) {
            await this.saveCodesToDevice();
        }
        
        return expiredFound;
    }

    // Alias for checkExpiredCodes
    cleanup() {
        return this.checkExpiredCodes();
    }

    // Add an entry to the audit history
    addToHistory(entry) {
        this.history.push(entry);
        
        // Keep history within size limits
        if (this.history.length > this.securitySettings.maxHistoryItems) {
            this.history = this.history.slice(-this.securitySettings.maxHistoryItems);
        }
        
        // Save history to device
        this.saveHistoryToDevice().catch(err => 
            this.errorLogger('Failed to save history:', err)
        );
        
        // Also send to global settings for UI display
        this.syncHistoryToSettings().catch(err =>
            this.errorLogger('Failed to sync history to settings:', err)
        );
        
        return true;
    }

    // Load codes from device storage
    async loadCodesFromDevice() {
        try {
            const storedCodes = await this.homey.settings.get('encryptedCodes') || {};
            this.codes = storedCodes;
            
            // Also load history
            this.history = await this.homey.settings.get('codeHistory') || [];
            
            return true;
        } catch (error) {
            this.errorLogger('Failed to load codes from device:', error);
            throw error;
        }
    }

    // Save codes to device storage
    async saveCodesToDevice() {
        try {
            await this.homey.settings.set('encryptedCodes', this.codes);
            return true;
        } catch (error) {
            this.errorLogger('Failed to save codes to device:', error);
            throw error;
        }
    }

    // Save history to device storage
    async saveHistoryToDevice() {
        try {
            await this.homey.settings.set('codeHistory', this.history);
            return true;
        } catch (error) {
            this.errorLogger('Failed to save history to device:', error);
            return false;
        }
    }
    
    // Sync history to global settings for UI
    async syncHistoryToSettings() {
        try {
            // Store the history in global settings for UI access
            await this.homey.settings.set('codeHistory', this.history);
            return true;
        } catch (error) {
            this.errorLogger('Failed to sync history to settings:', error);
            return false;
        }
    }

}

module.exports = CodeManager;
