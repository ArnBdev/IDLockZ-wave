'use strict'

/**
 * Flow actions for ID Lock 202
 * Created: 2025-04-14 07:25:59
 * Author: ArnBdev
 */

module.exports = {
  // Kodeadministrasjon
  async onActionAddRecurringCode(args, state) {
    const { code, name, scheduleType } = args
    let schedule

    switch (scheduleType) {
      case 'workdays':
        schedule = {
          daysOfWeek: [1, 2, 3, 4, 5],
          timeStart: '08:00',
          timeEnd: '17:00'
        }
        break
      case 'weekend':
        schedule = {
          daysOfWeek: [0, 6],
          timeStart: '10:00',
          timeEnd: '16:00'
        }
        break
      case 'custom':
        schedule = {
          daysOfWeek: args.customDays || [1, 2, 3, 4, 5],
          timeStart: args.customStart || '09:00',
          timeEnd: args.customEnd || '16:00'
        }
        break
    }

    try {
      await this.setupRecurringCode(code, name, schedule)
      return {
        success: true,
        message: `Lagt til periodisk kode: ${name}`
      }
    } catch (error) {
      this.error('Feil ved oppretting av periodisk kode:', error)
      return {
        success: false,
        error: error.message
      }
    }
  },

  // Gruppeadministrasjon
  async onActionCreateCodeGroup(args, state) {
    const { groupName, schedule } = args
    try {
      await this.createCodeGroup(groupName, schedule)
      return {
        success: true,
        message: `Opprettet kodegruppe: ${groupName}`
      }
    } catch (error) {
      this.error('Feil ved oppretting av kodegruppe:', error)
      return {
        success: false,
        error: error.message
      }
    }
  },

  async onActionAddCodeToGroup(args, state) {
    const { code, groupName } = args
    try {
      await this.addCodeToGroup(code, groupName)
      return {
        success: true,
        message: `La til kode i gruppe: ${groupName}`
      }
    } catch (error) {
      this.error('Feil ved tillegging av kode til gruppe:', error)
      return {
        success: false,
        error: error.message
      }
    }
  },

  // Statistikk og rapportering
  async onActionGetCodeStats(args, state) {
    const { code } = args
    try {
      const stats = await this.getCodeUsageStats(code)
      return {
        success: true,
        data: {
          lastUsed: stats.lastUsed ? stats.lastUsed.toISOString() : 'Aldri brukt',
          totalUses: stats.totalUses,
          failedAttempts: stats.failedAttempts
        }
      }
    } catch (error) {
      this.error('Feil ved henting av kodestatistikk:', error)
      return {
        success: false,
        error: error.message
      }
    }
  },

  // Nødssituasjoner
  async onActionEmergencyUnlock(args, state) {
    const { reason } = args
    try {
      await this.emergencyManager.unlockDoorEmergency(reason)
      return {
        success: true,
        message: `Nødopplåsing utført: ${reason}`
      }
    } catch (error) {
      this.error('Feil ved nødopplåsing:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }
}