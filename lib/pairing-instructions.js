﻿const PairingInstructions = {
    no: {
        default: `
1. Hold inne nøkkelknappen i 3 sekunder til panelet våkner
2. Tast masterkode etterfulgt av *
3. Trykk på 9 deretter *
4. Trykk på 0

Låsen er nå i parringsmodus og klar til å kobles til Homey.
        `,
        error: 'Kunne ikke koble til låsen. Sjekk at låsen er i parringsmodus og prøv igjen.',
        success: 'Låsen er nå koblet til Homey!'
    },
    en: {
        default: `
1. Press and hold the key button for 3 seconds until the panel wakes up
2. Enter master code followed by *
3. Press 9 then *
4. Press 0

The lock is now in pairing mode and ready to connect to Homey.
        `,
        error: 'Could not connect to the lock. Verify that the lock is in pairing mode and try again.',
        success: 'Lock successfully connected to Homey!'
    }
};

module.exports = PairingInstructions;