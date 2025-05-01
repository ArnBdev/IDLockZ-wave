/**
 * memory-manager.js
 * 
 * En enkel minnehåndtering for IDLockZ-wave-prosjektet i VS Code.
 * Fungerer som en erstatter for MCP-serverfunksjonalitet for å huske viktige detaljer.
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

class MemoryManager {
    constructor() {
        this.memoryFilePath = path.join(__dirname, '../', 'project-memory.json');
        this.memory = this.loadMemory();
    }

    /**
     * Laster inn prosjektminnet fra disk
     */
    loadMemory() {
        try {
            if (fs.existsSync(this.memoryFilePath)) {
                const data = fs.readFileSync(this.memoryFilePath, 'utf8');
                return JSON.parse(data);
            }
        } catch (error) {
            console.error('Feil ved lasting av minne:', error);
        }
        
        // Hvis filen ikke finnes eller det er en feil, returner et tomt minneobjekt
        return {
            flowCards: {
                triggers: {},
                conditions: {},
                actions: {}
            },
            issues: [],
            notes: [],
            history: [],
            lastAccessed: new Date().toISOString()
        };
    }

    /**
     * Lagrer minnet til disk
     */
    saveMemory() {
        try {
            this.memory.lastAccessed = new Date().toISOString();
            fs.writeFileSync(this.memoryFilePath, JSON.stringify(this.memory, null, 2), 'utf8');
        } catch (error) {
            console.error('Feil ved lagring av minne:', error);
        }
    }

    /**
     * Legger til eller oppdaterer informasjon om et flowkort
     * @param {string} type - 'triggers', 'conditions', eller 'actions'
     * @param {string} id - ID på flowkortet
     * @param {object} data - Data om flowkortet
     */
    updateFlowCard(type, id, data) {
        if (!this.memory.flowCards[type]) {
            this.memory.flowCards[type] = {};
        }
        
        this.memory.flowCards[type][id] = {
            ...this.memory.flowCards[type][id],
            ...data,
            lastUpdated: new Date().toISOString()
        };
        
        this.saveMemory();
        return this.memory.flowCards[type][id];
    }

    /**
     * Henter informasjon om et flowkort
     * @param {string} type - 'triggers', 'conditions', eller 'actions'
     * @param {string} id - ID på flowkortet
     */
    getFlowCard(type, id) {
        return this.memory.flowCards[type]?.[id] || null;
    }

    /**
     * Lagrer en valideringsfeil for senere referanse
     * @param {string} message - Feilmeldingen
     * @param {object} context - Kontekstinformasjon om feilen
     */
    logValidationIssue(message, context = {}) {
        this.memory.issues.push({
            message,
            context,
            timestamp: new Date().toISOString()
        });
        this.saveMemory();
    }

    /**
     * Henter alle valideringsfeil
     */
    getValidationIssues() {
        return this.memory.issues;
    }

    /**
     * Legger til en prosjektnotat
     * @param {string} note - Notat om prosjektet
     * @param {string} category - Notatkategori (valgfri)
     */
    addNote(note, category = 'general') {
        this.memory.notes.push({
            text: note,
            category,
            timestamp: new Date().toISOString()
        });
        this.saveMemory();
    }

    /**
     * Henter notater, filtrert på kategori (valgfritt)
     * @param {string} category - Kategori å filtrere på (valgfri)
     */
    getNotes(category = null) {
        if (category) {
            return this.memory.notes.filter(note => note.category === category);
        }
        return this.memory.notes;
    }

    /**
     * Loggfører en handling i prosjekthistorikken
     * @param {string} action - Handlingen som ble utført
     * @param {object} details - Detaljer om handlingen
     */
    logHistory(action, details = {}) {
        this.memory.history.push({
            action,
            details,
            timestamp: new Date().toISOString()
        });
        this.saveMemory();
    }

    /**
     * Henter prosjekthistorikken
     * @param {number} limit - Antall elementer å returnere (valgfri)
     */
    getHistory(limit = null) {
        const history = [...this.memory.history].reverse(); // Nyeste først
        if (limit && limit > 0) {
            return history.slice(0, limit);
        }
        return history;
    }
}

module.exports = new MemoryManager();