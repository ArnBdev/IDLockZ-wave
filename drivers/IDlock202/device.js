'use strict'

const { ZwaveDevice } = require('homey-zwavedriver')
const CodeManager = require('../../lib/code-manager')
const EmergencyManager = require('../../lib/emergency-manager')

/**
 * IDlock202 device class
 * @extends ZwaveDevice
 */
class IDlock202 extends ZwaveDevice {
  /**
   * @constructor
   */
  constructor(...args) {
    super(...args)
    
    // Initialize date and user properties
    this._lastUpdated = new Date()
    this._currentUser = 'System'
    
    // Initialize storage
    this._codeUsageLog = {}
    this._codeGroups = {}
    this._eventLog = []
  }

  /**
   * Device initialization
   */
  async onNodeInit() {
    // Initialize managers
    this.codeManager = new CodeManager(this)
    this.emergencyManager = new EmergencyManager(this)

    // Device capabilities
    this._supportsPeriodicalCodes = true
    this._supportsAutoLock = true
    this._supportsRFID = true

    // Register basic capabilities
    await this._registerCapabilities()
    
    // Setup emergency functions
    await this._setupEmergencyFunctions()
  }

  /**
   * Register device capabilities
   * @private
   */
  async _registerCapabilities() {
    this.registerCapability('locked', 'DOOR_LOCK', {
      getOpts: {
        getOnStart: true,
        getOnOnline: false
      },
      report: 'DOOR_LOCK_OPERATION_REPORT',
      reportParserV2: report => {
        if (report && Object.prototype.hasOwnProperty.call(report, 'Door Lock Mode')) {
          return report['Door Lock Mode'] === 'Door Secured'
        }
        return null
      }
    })

    // Register other capabilities...
  }

  /**
   * Get current date and time
   * @returns {Date}
   */
  get currentDateTime() {
    return this._lastUpdated
  }

  /**
   * Get current user
   * @returns {string}
   */
  get currentUser() {
    return this._currentUser
  }

  /**
   * Set current user
   * @param {string} user
   */
  set currentUser(user) {
    this._currentUser = user
  }

  /**
   * Setup emergency functions
   * @private
   */
  async _setupEmergencyFunctions() {
    try {
      const fireAlarms = await this.homey.devices.getDevices()
      for (const alarm of fireAlarms) {
        if (alarm.hasCapability('alarm_fire')) {
          alarm.on('alarm_fire', async (value) => {
            if (value) {
              await this.emergencyManager.handleFireAlarm(true)
              this.log('Emergency unlock triggered by fire alarm')
            }
          })
        }
      }
    } catch (error) {
      this.error('Failed to setup emergency functions:', error)
    }
  }

  /**
   * Add a recurring code
   * @param {string} code
   * @param {string} name
   * @param {object} [schedule]
   * @returns {Promise<boolean>}
   */
  async setupRecurringCode(code, name, schedule) {
    try {
      if (!schedule) {
        const settings = this.getSettings()
        schedule = {
          daysOfWeek: settings.workdays_only ? [1, 2, 3, 4, 5] : [0, 1, 2, 3, 4, 5, 6],
          timeStart: settings.start_time || "08:00",
          timeEnd: settings.end_time || "17:00"
        }
      }
      return await this.codeManager.addRecurringCode(code, name, schedule)
    } catch (error) {
      this.error('Failed to setup recurring code:', error)
      throw error
    }
  }

  /**
   * Get code usage statistics
   * @param {string} code
   * @returns {Promise<object>}
   */
  async getCodeUsageStats(code) {
    return this._codeUsageLog[code] || {
      lastUsed: null,
      totalUses: 0,
      failedAttempts: 0
    }
  }

  /**
   * Log code usage
   * @param {string} code
   * @param {boolean} success
   * @param {Date} [timestamp]
   * @returns {Promise<object>}
   */
  async logCodeUsage(code, success, timestamp = this.currentDateTime) {
    if (!this._codeUsageLog[code]) {
      this._codeUsageLog[code] = {
        lastUsed: null,
        totalUses: 0,
        failedAttempts: 0
      }
    }

    if (success) {
      this._codeUsageLog[code].totalUses++
    } else {
      this._codeUsageLog[code].failedAttempts++
    }
    this._codeUsageLog[code].lastUsed = timestamp

    return this._codeUsageLog[code]
  }

  /**
   * Create a code group
   * @param {string} groupName
   * @param {object} schedule
   * @returns {Promise<object>}
   */
  async createCodeGroup(groupName, schedule) {
    this._codeGroups[groupName] = {
      schedule,
      codes: [],
      created: this.currentDateTime,
      createdBy: this.currentUser
    }
    return this._codeGroups[groupName]
  }

  /**
   * Add code to group
   * @param {string} code
   * @param {string} groupName
   * @returns {Promise<void>}
   */
  async addCodeToGroup(code, groupName) {
    if (!this._codeGroups[groupName]) {
      throw new Error(`Group ${groupName} does not exist`)
    }
    
    if (!this._codeGroups[groupName].codes.includes(code)) {
      this._codeGroups[groupName].codes.push(code)
    }
  }

  /**
   * Log event
   * @param {string} eventType
   * @param {object} details
   * @returns {Promise<object>}
   */
  async logEvent(eventType, details) {
    const event = {
      type: eventType,
      timestamp: this.currentDateTime,
      user: this.currentUser,
      details: details
    }
    
    this._eventLog.unshift(event)
    
    // Keep only last 1000 events
    if (this._eventLog.length > 1000) {
      this._eventLog.pop()
    }
    
    return event
  }

  /**
   * Get code history
   * @param {string} code
   * @param {number} [limit=50]
   * @returns {Promise<Array>}
   */
  async getCodeHistory(code, limit = 50) {
    return this._eventLog
      .filter(event => event.details.code === code)
      .slice(0, limit)
  }
}

module.exports = IDlock202