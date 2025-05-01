/**
 * ID Lock Sikker Ekskludering og Inkluderingsguide
 * 
 * Dette verktøyet gir instruksjoner for å gjøre en ren ekskludering og sikker 
 * inkludering av ID Lock 202 Multi med Homey
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const RESET_GUIDE = `
===============================================
ID LOCK 202 MULTI - SIKKER INKLUDERING GUIDE
===============================================

DETTE ER ET STEG-FOR-STEG VERKTØY FOR Å SIKRE KORREKT INKLUDERING
AV DIN ID LOCK 202 MED SIKKER KOMMUNIKASJON

For at en digital dørlås skal fungere riktig med Homey, 
MÅ den være sikkert inkludert (S0 eller S2). 
Uten dette vil kommandoer som låsing/opplåsing ikke fungere.

Vi vil nå guide deg gjennom prosessen:

`;

const STEP1 = `
STEG 1: FORBEREDELSE
==================
1. Ha Homey-appen åpen og tilgjengelig
2. Sørg for at døren er åpen
3. Ha verktøy klart til å ta ut batteriene
4. Kontroller at din master PIN-kode er tilgjengelig
`;

const STEP2 = `
STEG 2: EKSKLUDERING (NULLSTILLING)
==============================
1. Gå til Enheter i Homey-appen
2. Finn din ID Lock og velg "Fjern"
3. Når Homey ber om det, gjør følgende på låsen:
   - Tast [Master PIN] + [*]
   - Deretter [9] + [*]
   - Til slutt trykk [2]
4. Vent til Homey bekrefter at enheten er fjernet
`;

const STEP3 = `
STEG 3: FORBERED SIKKER INKLUDERING
==============================
1. I Homey-appen, gå til Z-Wave-innstillinger
2. I Z-Wave-seksjonen, sørg for at "Sikker inkludering" er aktivert
   (Hvis du ikke finner dette alternativet, er det sannsynligvis
    aktivert som standard i din Homey-versjon)
3. Gå til Enheter > "+" tegnet > Z-Wave for å starte inkludering
`;

const STEP4 = `
STEG 4: INKLUDERING MED SIKKER KOMMUNIKASJON
======================================
1. Med døren åpen, ta ut ALLE batterier fra låsen
2. Kontroller at Z-Wave-modulen er i REMOTE-sporet (ikke LOCAL)
3. Sett inn batteriene igjen
4. På låsen, tast:
   - [Master PIN] + [*]
   - Deretter [9] + [*] 
   - Til slutt trykk [1]
5. VIKTIG: Når Homey spør om sikker inkludering, velg JA
`;

const STEP5 = `
STEG 5: VERIFISER SIKKER INKLUDERING
==============================
1. Gå til enhetens innstillinger i Homey
2. Kontroller at "zw_secure" viser "✓", "S0" eller "S2"
3. Hvis den viser "⨯", må prosessen gjentas med mer oppmerksomhet
   på sikker inkludering-steget

EKSTRA TIPS:
- Hold låsen svært nær Homey under inkludering
- Gjør inkludering i samme rom som Homey 
- Sjekk at andre enheter ikke forstyrrer signalet
- Kontroller at batteriene er nye og fulle
`;

const TROUBLESHOOTING = `
FEILSØKING
==========
Hvis sikker inkludering fortsatt ikke fungerer:

1. SJEKK HOMEY-VERSJON:
   - Eldre versjoner av Homey kan ha begrensninger med S2-støtte
   - Kontroller at Homey er oppdatert til siste versjon

2. PRØV MED S0 ISTEDENFOR S2:
   - Noen Z-Wave-enheter fungerer bedre med S0
   - Kontroller om det er et alternativ under inkludering

3. TIMING ER VIKTIG:
   - ID Lock 202 har et begrenset tidsvindu for sikker inkludering
   - Gjør Homey klar til inkludering FØR du trykker inn koden på låsen

4. PROBLEMER MED Z-WAVE MODULEN:
   - Kontroller at modulen sitter skikkelig i REMOTE-sporet
   - Se om det er synlige skader på kontaktpunkter
`;

async function showStepsWithConfirmation() {
  console.clear();
  console.log(RESET_GUIDE);
  
  await new Promise(resolve => setTimeout(resolve, 1000));
  console.log(STEP1);
  await confirmStep('Er du klar til å starte? (j/n): ');
  
  console.clear();
  console.log(STEP2);
  await confirmStep('Har du ekskludert låsen fra Homey? (j/n): ');
  
  console.clear();
  console.log(STEP3);
  await confirmStep('Har du kontrollert innstillinger for sikker inkludering? (j/n): ');
  
  console.clear();
  console.log(STEP4);
  await confirmStep('Har du forberedt låsen og er klar for inkludering? (j/n): ');
  
  console.clear();
  console.log(STEP5);
  
  console.log(`\nVil du se feilsøkingsinformasjon? (j/n): `);
  const showTroubleshooting = await getInput();
  
  if (showTroubleshooting.toLowerCase() === 'j') {
    console.clear();
    console.log(TROUBLESHOOTING);
  }
  
  console.log(`\n===========================================`);
  console.log(`PROSESSEN ER FULLFØRT`);
  console.log(`Kontroller at zw_secure er satt til "✓", "S0" eller "S2" i enhetsinnstillingene`);
  console.log(`===========================================\n`);
  
  // Lagre guiden til en fil
  const guidePath = path.join(__dirname, '..', 'docs', 'SECURE_INCLUSION_GUIDE.md');
  const guideContent = `# ID Lock 202 Multi Sikker Inkluderingsguide\n\n${RESET_GUIDE}\n${STEP1}\n${STEP2}\n${STEP3}\n${STEP4}\n${STEP5}\n\n## Feilsøking\n${TROUBLESHOOTING}`;
  
  fs.writeFileSync(guidePath, guideContent, 'utf8');
  console.log(`Guiden er også lagret til: ${guidePath}`);
}

function confirmStep(question) {
  return new Promise(resolve => {
    function askConfirmation() {
      rl.question(question, answer => {
        if (answer.toLowerCase() === 'j') {
          resolve();
        } else {
          console.log('\nPrøv igjen når du er klar.');
          askConfirmation();
        }
      });
    }
    askConfirmation();
  });
}

function getInput() {
  return new Promise(resolve => {
    rl.question('', answer => {
      resolve(answer);
    });
  });
}

// Start prosessen
(async function() {
  try {
    await showStepsWithConfirmation();
  } catch (err) {
    console.error('En feil oppstod:', err.message);
  } finally {
    rl.close();
  }
})();