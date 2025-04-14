﻿const Homey = require('homey');

class CodeManager {
    constructor(device) {
        this.device = device;
        this.codes = {
            temporary: new Map(),  // For tidsbegrensede koder
            oneTime: new Map(),    // For engangskoder
            recurring: new Map()    // For periodiske koder (ny for 202 Multi)
        };

        // Last inn lagrede koder
        this._loadCodes();
    }

    // Lagrer en midlertidig kode
    async addTemporaryCode(code, name, expiryDate) {
        this.codes.temporary.set(code, {
            name,
            expiryDate: new Date(expiryDate),
            created: new Date()
        });
        await this._saveCodes();
    }

    // Lagrer en engangskode
    async addOneTimeCode(code, name) {
        this.codes.oneTime.set(code, {
            name,
            created: new Date()
        });
        await this._saveCodes();
    }

    // Ny funksjon for 202 Multi: Legg til periodisk kode
    async addRecurringCode(code, name, schedule) {
        this.codes.recurring.set(code, {
            name,
            schedule, // Format: { daysOfWeek: [0-6], timeStart: "HH:MM", timeEnd: "HH:MM" }
            created: new Date()
        });
        await this._saveCodes();
    }

    // Ny funksjon for 202 Multi: Sjekk om en periodisk kode er gyldig på gitt tidspunkt
    isRecurringCodeValid(code, timestamp = new Date()) {
        if (!this.codes.recurring.has(code)) return false;

        const codeData = this.codes.recurring.get(code);
        const day = timestamp.getDay(); // 0-6, hvor 0 er søndag
        const time = timestamp.getHours() * 60 + timestamp.getMinutes();

        // Sjekk om dagen er tillatt
        if (!codeData.schedule.daysOfWeek.includes(day)) return false;

        // Konverter tidsstrenger til minutter siden midnatt
        const [startHour, startMin] = codeData.schedule.timeStart.split(':').map(Number);
        const [endHour, endMin] = codeData.schedule.timeEnd.split(':').map(Number);
        const startTime = startHour * 60 + startMin;
        const endTime = endHour * 60 + endMin;

        // Sjekk om nåværende tid er innenfor tillatt tidsrom
        return time >= startTime && time <= endTime;
    }

    // Oppdatert validateCode for å håndtere alle kodetyper
    async validateCode(code, timestamp = new Date()) {
        // Sjekk midlertidige koder
        if (this.codes.temporary.has(code)) {
            const codeData = this.codes.temporary.get(code);
            if (timestamp > codeData.expiryDate) {
                // Koden har utløpt
                await this.removeCode(code);
                return false;
            }
            return true;
        }

        // Sjekk engangskoder
        if (this.codes.oneTime.has(code)) {
            // Slett koden etter bruk
            await this.removeCode(code);
            return true;
        }

        // Sjekk periodiske koder (ny for 202 Multi)
        if (this.codes.recurring.has(code)) {
            return this.isRecurringCodeValid(code, timestamp);
        }

        return false; // Koden finnes ikke
    }

    // Fjerner en kode
    async removeCode(code) {
        this.codes.temporary.delete(code);
        this.codes.oneTime.delete(code);
        this.codes.recurring.delete(code);
        await this._saveCodes();
    }

    // Lagrer kodene til Homey's innstillinger
    async _saveCodes() {
        await this.device.setStoreValue('codes', {
            temporary: Array.from(this.codes.temporary.entries()),
            oneTime: Array.from(this.codes.oneTime.entries()),
            recurring: Array.from(this.codes.recurring.entries())
        });
    }

    // Laster inn koder fra Homey's innstillinger
    async _loadCodes() {
        const savedCodes = await this.device.getStoreValue('codes') || { 
            temporary: [], 
            oneTime: [], 
            recurring: [] 
        };
        this.codes.temporary = new Map(savedCodes.temporary);
        this.codes.oneTime = new Map(savedCodes.oneTime);
        this.codes.recurring = new Map(savedCodes.recurring);
    }
}

module.exports = CodeManager;