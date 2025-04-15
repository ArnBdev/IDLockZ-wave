# IDLock Z-Wave Setup
Dato: 2025-04-14 12:07:10  
Utvikler: ArnBdev

---

## Viktige Z-Wave og ID Lock 202 Notater

- **ID Lock 202 bruker samme Z-Wave-ID som ID Lock 150:**
  - manufacturerId: 635
  - productTypeId: 1
  - productId: 770
- **Kun én driver i Homey-appen kan ha denne ID-en!**
  - Hvis både 150 og 202 har samme ID i hver sin driver, vil Homey kun bruke den første den finner.
  - For å unngå feil: Fjern eller deaktiver driveren for 150 hvis du kun skal bruke 202.
- Ekskludering fra Z-Wave: `[Master PIN] + [*]`, deretter `[9] + [*]`, deretter `[2]`
- Inkludering til Z-Wave: `[Master PIN] + [*]`, deretter `[9] + [*]`, deretter `[1]`
- **Missing Capability Listener: locked**: Slett låsen fra Homey, bygg og kjør appen på nytt, og legg til låsen igjen.
- Homey kan kun matche én driver per Z-Wave-ID.
- Kilder: idlock.no, brukermanual, Homey-forum, Ted Tolboom-app.

---

## Implementerte Filer
- package.json: Grunnleggende prosjektoppsett
- test/IDlock202.test.js: Testsuite for låsefunksjoner
- lib/flows/actions.js: Flow-handlinger for Homey

## Neste Steg
1. Implementere flere tester for nødssituasjoner
2. Legge til flere flow-handlinger
3. Utvide kodeadministrasjon
4. Implementere logging

## Notater
- Alle feilmeldinger er på norsk
- Bruker Jest for testing
- ESLint versjon 7.32.0 for kompatibilitet
- Alle tester kjører nå som forventet.
- Homey CLI må installeres globalt for å bygge og kjøre appen:
  ```bash
  npm install -g homey
  ```