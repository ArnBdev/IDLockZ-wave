#!/usr/bin/env node

/**
 * memory-cli.js
 * 
 * Kommandolinjegrensesnitt for minnehåndtereren.
 * Bruk: node memory-cli.js <kommando> [argumenter...]
 */

const memoryManager = require('./memory-manager');

const commands = {
    // Note-kommandoer
    'add-note': (args) => {
        const [note, category = 'general'] = args;
        if (!note) {
            console.error('Mangler notat-tekst');
            process.exit(1);
        }
        memoryManager.addNote(note, category);
        console.log(`Notat lagt til i kategorien "${category}"`);
    },
    'get-notes': (args) => {
        const [category] = args;
        const notes = memoryManager.getNotes(category);
        console.log(`Notater${category ? ' i kategorien ' + category : ''}:\n`);
        notes.forEach((note, idx) => {
            const date = new Date(note.timestamp).toLocaleString();
            console.log(`${idx + 1}. [${date}] [${note.category}]: ${note.text}`);
        });
    },

    // Flow cards kommandoer
    'update-flow': (args) => {
        const [type, id, ...dataArgs] = args;
        if (!type || !id || dataArgs.length === 0 || dataArgs.length % 2 !== 0) {
            console.error('Feil format: update-flow <type> <id> <key1> <value1> [<key2> <value2> ...]');
            process.exit(1);
        }

        const data = {};
        for (let i = 0; i < dataArgs.length; i += 2) {
            data[dataArgs[i]] = dataArgs[i+1];
        }

        const result = memoryManager.updateFlowCard(type, id, data);
        console.log(`Flow card "${id}" i kategorien "${type}" oppdatert:`, result);
    },
    'get-flow': (args) => {
        const [type, id] = args;
        if (!type || !id) {
            console.error('Feil format: get-flow <type> <id>');
            process.exit(1);
        }

        const result = memoryManager.getFlowCard(type, id);
        if (result) {
            console.log(`Flow card "${id}" i kategorien "${type}":`);
            console.log(JSON.stringify(result, null, 2));
        } else {
            console.log(`Ingen informasjon funnet for flow card "${id}" i kategorien "${type}"`);
        }
    },

    // Valideringsfeil
    'log-issue': (args) => {
        const [message, ...contextArgs] = args;
        if (!message) {
            console.error('Mangler feilmelding');
            process.exit(1);
        }

        const context = {};
        if (contextArgs.length >= 2 && contextArgs.length % 2 === 0) {
            for (let i = 0; i < contextArgs.length; i += 2) {
                context[contextArgs[i]] = contextArgs[i+1];
            }
        }

        memoryManager.logValidationIssue(message, context);
        console.log('Valideringsfeil logget');
    },
    'get-issues': () => {
        const issues = memoryManager.getValidationIssues();
        console.log('Valideringsfeil:');
        issues.forEach((issue, idx) => {
            const date = new Date(issue.timestamp).toLocaleString();
            console.log(`${idx + 1}. [${date}] ${issue.message}`);
            if (Object.keys(issue.context).length > 0) {
                console.log('   Kontekst:', JSON.stringify(issue.context, null, 2));
            }
        });
    },

    // Historie
    'log-history': (args) => {
        const [action, ...detailsArgs] = args;
        if (!action) {
            console.error('Mangler handlingsbeskrivelse');
            process.exit(1);
        }

        const details = {};
        if (detailsArgs.length >= 2 && detailsArgs.length % 2 === 0) {
            for (let i = 0; i < detailsArgs.length; i += 2) {
                details[detailsArgs[i]] = detailsArgs[i+1];
            }
        }

        memoryManager.logHistory(action, details);
        console.log('Handling logget i historien');
    },
    'get-history': (args) => {
        const [limitStr] = args;
        const limit = limitStr ? parseInt(limitStr) : null;
        const history = memoryManager.getHistory(limit);
        console.log(`Siste ${limit || 'alle'} handlinger:`);
        history.forEach((entry, idx) => {
            const date = new Date(entry.timestamp).toLocaleString();
            console.log(`${idx + 1}. [${date}] ${entry.action}`);
            if (Object.keys(entry.details).length > 0) {
                console.log('   Detaljer:', JSON.stringify(entry.details, null, 2));
            }
        });
    },

    // Hjelp
    'help': () => {
        console.log(`
IDLockZ-wave Memory Manager CLI

Bruk: node memory-cli.js <kommando> [argumenter]

Tilgjengelige kommandoer:
  Notater:
    add-note <tekst> [kategori]            - Legg til et notat
    get-notes [kategori]                   - Hent notater, valgfritt filtrert på kategori

  Flow cards:
    update-flow <type> <id> <key> <verdi>  - Oppdater info om et flow card
    get-flow <type> <id>                   - Hent info om et flow card

  Valideringsfeil:
    log-issue <melding> [key verdi ...]    - Logg en valideringsfeil
    get-issues                             - Hent alle valideringsfeil

  Historie:
    log-history <handling> [key verdi ...] - Logg en handling i historien
    get-history [antall]                   - Hent siste handlinger
        `);
    }
};

// Hovedfunksjon
function run() {
    const [command, ...args] = process.argv.slice(2);
    
    if (!command || !commands[command]) {
        console.log('Ukjent kommando. Prøv "help" for å se tilgjengelige kommandoer.');
        commands.help();
        process.exit(1);
    }

    commands[command](args);
}

// Kjør scriptet
run();