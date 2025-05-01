# ID Lock 202 Multi Sikker Inkluderingsguide


===============================================
ID LOCK 202 MULTI - SIKKER INKLUDERING GUIDE
===============================================

DETTE ER ET STEG-FOR-STEG VERKTØY FOR Å SIKRE KORREKT INKLUDERING
AV DIN ID LOCK 202 MED SIKKER KOMMUNIKASJON

For at en digital dørlås skal fungere riktig med Homey, 
MÅ den være sikkert inkludert (S0 eller S2). 
Uten dette vil kommandoer som låsing/opplåsing ikke fungere.

Vi vil nå guide deg gjennom prosessen:



STEG 1: FORBEREDELSE
==================
1. Ha Homey-appen åpen og tilgjengelig
2. Sørg for at døren er åpen
3. Ha verktøy klart til å ta ut batteriene
4. Kontroller at din master PIN-kode er tilgjengelig


STEG 2: EKSKLUDERING (NULLSTILLING)
==============================
1. Gå til Enheter i Homey-appen
2. Finn din ID Lock og velg "Fjern"
3. Når Homey ber om det, gjør følgende på låsen:
   - Tast [Master PIN] + [*]
   - Deretter [9] + [*]
   - Til slutt trykk [2]
4. Vent til Homey bekrefter at enheten er fjernet


STEG 3: FORBERED SIKKER INKLUDERING
==============================
1. I Homey-appen, gå til Z-Wave-innstillinger
2. I Z-Wave-seksjonen, sørg for at "Sikker inkludering" er aktivert
   (Hvis du ikke finner dette alternativet, er det sannsynligvis
    aktivert som standard i din Homey-versjon)
3. Gå til Enheter > "+" tegnet > Z-Wave for å starte inkludering


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


## Feilsøking

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
