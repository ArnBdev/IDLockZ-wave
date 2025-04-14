# IDLock Z-Wave Prosjekt Samtalelogg
Sist oppdatert: 2025-04-14 12:17:43
Utvikler: ArnBdev

## Utviklerkontekst
### Bakgrunn og Forutsetninger
- Ny til koding, trenger grunnleggende steg-for-steg forklaringer
- Ønsker å lære mens vi utvikler
- Tidligere erfaring med Zigbee-prosjekt (ikke fullført)

### Utviklermiljø
- Windows PC
- Visual Studio Code
- Node.js og npm installert
- GitHub Copilot
- Homey CLI

### Maskinvare
- Homey Pro 2023
- ID Lock 202 Multi (støtter både Z-Wave og Zigbee)

### Tidligere Prosjekt (Zigbee)
- GitHub: https://github.com/ArnBdev/idlock-zigbee
- Støtte på utfordring med Zigbee-implementasjon
- Problem: ZigBeeDevice fails to initialize (onNodeInit constructor)
- Diskusjonstråd: [Homey Community Forum](https://community.homey.app/t/sdkv3-zigbee-device-zigbeedevice-fails-to-initialize-onnodeinit-constructor-not-called-after-successful-driver-match-via-cli-run-remote-id-lock-datek/134590)

## Pedagogisk Tilnærming
### Kommunikasjonsstil
- Bruk grunnleggende forklaringer
- Steg-for-steg instruksjoner
- Forklar hvorfor, ikke bare hvordan
- Unngå antakelser om forkunnskaper

### Kodeopplæring
1. Start med basisforklaringer
2. Vis eksempler med kommentarer
3. Bruk norske forklaringer
4. Del opp komplekse oppgaver

### Prosjekttilnærming
1. Begynn med enkle funksjoner
2. Bygg gradvis kompleksitet
3. Test hver endring
4. Dokumenter læringspunkter

[Tidligere innhold fortsetter...]

## Grunnleggende Kommandoer og Operasjoner
### Terminal
```plaintext
# Navigere til prosjektmappen
cd C:\HomeyDev\IDLockZ-wave

# Installere avhengigheter
npm install

# Kjøre tester
npm test

# Bygge appen
homey app build

# Deploye til Homey
homey app deploy