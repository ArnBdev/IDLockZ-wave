# ID Lock 202 Z-Wave & Homey – Teknisk Dokumentasjon og Innsikt

## Z-Wave-modul og ID Lock 202
- **Produsent-ID:** 0x027B (635)
- **Produkt-type:** 0x0001 (1)
- **Produkt-ID:** 0x0302 (770)
- **S2 Security er påkrevd** for Homey og de fleste gateways.
- **Støttede kommando-klasser:**  
  - COMMAND_CLASS_ZWAVEPLUS_INFO  
  - COMMAND_CLASS_SECURITY  
  - COMMAND_CLASS_SECURITY_2  
  - COMMAND_CLASS_DOOR_LOCK  
  - COMMAND_CLASS_BATTERY  
  - COMMAND_CLASS_NOTIFICATION  
  - COMMAND_CLASS_ASSOCIATION  
  - COMMAND_CLASS_VERSION  
  - COMMAND_CLASS_MANUFACTURER_SPECIFIC  
  - COMMAND_CLASS_CONFIGURATION

## Inkludering (paringsmodus)
- **Riktig sekvens for inkludering:**  
  1. Åpne døren  
  2. Fjern batteriene  
  3. Sett inn Z-Wave-modulen  
  4. Sett inn batteriene  
  5. Start inkludering i Homey  
  6. Hold nøkkelknappen (3 sek)  
  7. Tast [Master PIN] + [*]  
  8. Tast [9] + [*]  
  9. Tast [1] (NB: Ikke [0] – [1] er riktig for inkludering)
- **Ekskludering:**  
  Samme prosedyre, men avslutt med [2] i stedet for [1].
- **Reset:**  
  [Master PIN] + [*], [9] + [*], [3]

## Viktige krav og tips
- **Homey må være nær låsen (<2 meter) under inkludering.**
- **Låsen må inkluderes med S2 Security** – hvis ikke, må den ekskluderes og inkluderes på nytt.
- **Standard Master PIN er 123456** hvis ikke endret.
- **Døren skal være åpen under inkludering.**
- **Z-Wave-modulen må være riktig plassert i “Remote Control”-sporet.**
- **Inkludering kan feile hvis modulen er brukt i annet system tidligere – ekskluder først.**

## Feilsøking
- **Rødt trekant-ikon i Homey:**  
  - Sjekk at driver.js arver fra riktig klasse (`Homey.Driver` for driver, `ZwaveDevice` for device).
  - Sjekk at alle capabilities og commandClasses er riktig definert.
  - Sjekk at device.js og driver.js er riktig eksportert.
- **Låsen vises ikke:**  
  - Sjekk at Z-Wave-IDene stemmer.
  - Sjekk at S2 Security brukes.
  - Prøv ekskludering før ny inkludering.

## Ressurser og lenker
- [ID Lock 202 Z-Wave User Manual (2023)](https://idlock.no/wp-content/uploads/2023/07/User-Manual-Z-Wave-202-EN.pdf)
- [ID Lock 150 Z-Wave Manual](https://idlock.no/wp-content/uploads/2019/08/IDLock150_ZWave_UserManual_v3.02.pdf)
- [Z-Wave Alliance produktinfo](https://products.z-wavealliance.org/products/2780)
- [Homey Community-tråd](https://community.homey.app/t/app-pro-id-lock-app-v2-0-0/161/349?page=16)
- [ID Lock FAQ Z-Wave](https://idlock.no/kundesenter/z-wave-sporsmal-og-svar/)
- [Eva Smarthus veiledning 202](https://hjelp.evasmart.no/hc/no/articles/12958553297041-ID-Lock-202-Multi-installasjon-og-veiledning)
- [ID Lock funksjonsmatrise](https://idlock.no/matrise/)

---

## Endringslogg og erfaringer
- **Inkludering feiler ofte pga. feil sekvens eller for lang avstand.**
- **S2 Security er kritisk for Homey-integrasjon.**
- **Riktig commandClasses og capabilities må være på plass i driver.compose.json.**
- **Ekskluder alltid låsen før ny inkludering hvis du er usikker på status.**

---

## TODO
- Oppdater denne filen fortløpende med nye funn, erfaringer og tekniske detaljer.