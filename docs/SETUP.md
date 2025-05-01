# ID Lock Z-Wave App Setup Guide

This document provides detailed setup instructions for developing and testing the ID Lock Z-Wave app for Homey.

## Development Environment Setup

### Prerequisites
- Node.js 18.x (required by Homey SDK 3)
- Homey CLI tools
- Git
- VS Code (recommended)

### Node.js Setup with NVM
1. Install [nvm-windows](https://github.com/coreybutler/nvm-windows)
2. Open a terminal and run:
   ```bash
   nvm install 18
   nvm use 18
   ```
3. Verify your Node.js version:
   ```bash
   node --version
   # Should output v18.x.x
   ```

### Homey CLI Tools
1. Install the Homey CLI:
   ```bash
   npm install -g homey
   ```
2. Verify the installation:
   ```bash
   homey --version
   ```

## Project Setup

### Cloning the Repository
```bash
git clone https://github.com/ArnBdev/IDLockZ-wave.git
cd IDLockZ-wave
```

### Installing Dependencies
```bash
npm install
```

## Running and Testing

### Running the App Locally
```bash
homey app run
```

### Common Testing Scenarios

#### 1. Testing Lock/Unlock Functionality
The app should allow you to lock and unlock the ID Lock through the Homey app.
- Ensure the lock responds to commands within a reasonable time
- Check that the lock state is correctly reported back to Homey

#### 2. Testing Auto-lock Feature
1. Enable auto-lock through the device capabilities
2. Set a short timeout (10-30 seconds)
3. Unlock the door and verify it locks automatically after the timeout

#### 3. Testing Away Mode
1. Enable away mode through the device capabilities
2. Verify enhanced security features activate on the lock

#### 4. Testing User Code Management
1. Open the device settings
2. Navigate to the Code Management section
3. Test adding, editing, and deleting PIN codes and RFID tags

## Troubleshooting Common Issues

### Z-Wave Communication Issues
If the lock is not responding to commands:
1. Check if the lock is properly included in your Z-Wave network
2. Verify the device is within Z-Wave range
3. Try excluding and re-including the device

### Code Management UI Issues
If the code management UI is not displaying properly:
1. Check browser console for JavaScript errors
2. Verify the `settings` folder contains all required files:
   - `IDLock150.html`
   - `idlockApp.js`
   - `idlockApp.css`
   - `xeditable.min.js` and `xeditable.min.css`

### Timeout Errors
If you see "timeout after X ms" errors:
1. This is expected behavior as Z-Wave commands may take longer than the timeout
2. The UI should still update correctly despite these errors
3. Check that the command was actually executed on the lock

## Debugging Tools

### Console Logging
- Use `this.log()` for normal logging
- Use `this.error()` for error logging
- Monitor the logs in the terminal when running `homey app run`

### Homey Developer Tools
1. Open the Homey Developer Tools in your browser
2. Navigate to the Devices section
3. Find your ID Lock device
4. Check its current state and capabilities

### Inspecting Settings Storage
You can inspect the settings data stored by the app:
```javascript
this.homey.settings.get('safeCodes'); // Inspect saved codes
this.homey.settings.get('encryptedCodes'); // Inspect encrypted code data
```

## Known Issues and Limitations

1. **Code Management UI Load Issue**: The code management UI currently shows "Loading codes..." and doesn't proceed. This is being fixed.

2. **Z-Wave Command Timeouts**: Z-Wave commands may occasionally time out, especially in networks with many devices or interference. The app is designed to handle these timeouts gracefully.

3. **Maximum User Codes**: The ID Lock 150 supports a maximum of 25 PIN codes and 25 RFID tags.

## Project Structure

### Key Files and Directories
- `app.js`: Main app file defining flow triggers and conditions
- `drivers/IDLock150/device.js`: Device driver implementation
- `lib/code-manager.js`: Code management and security implementation
- `settings/`: Global app settings UI
- `drivers/IDLock150/settings/`: Device-specific settings

### Architecture Diagram
```
IDLock Z-Wave App
│
├── app.js                  # Main app entry point
│
├── drivers/
│   └── IDLock150/          # ID Lock 150 driver
│       ├── device.js       # Device implementation
│       └── settings/       # Device settings UI
│
├── lib/
│   ├── code-manager.js     # Code management
│   └── zwave-config.js     # Z-Wave configuration
│
└── settings/               # Global app settings
    ├── IDLock150.html      # Device-specific settings UI
    └── index.html          # Main settings entry point
```

## Release Process

1. Update the version in `app.json`
2. Update the changelog in `README.md`
3. Test thoroughly on a real Homey device
4. Create a GitHub release
5. Submit to the Homey App Store

## Z-Wave-ID og Driver-konflikt

- **ID Lock 202 bruker samme Z-Wave-ID som ID Lock 150:**
  - manufacturerId: 635
  - productTypeId: 1
  - productId: 770
- **Kun én driver i Homey-appen kan ha denne ID-en!**
  - Hvis både 150 og 202 har samme ID i hver sin driver, vil Homey kun bruke den første den finner.
  - For å unngå feil: Fjern eller deaktiver driveren for 150 hvis du kun skal bruke 202.
- Dette er årsaken til at mange får problemer med å styre 202 hvis begge drivere er i appen.

## driver.compose.json (IDlock202)

- `"zwave"`-seksjonen skal inneholde:
  - `"manufacturerId": 635`
  - `"productTypeId": 1`
  - `"productId": 770`
  - `"zwaveSecure": true`
  - `"associationGroups": [1]`
  - `"commandClasses"` må inkludere:
    - `"COMMAND_CLASS_ZWAVEPLUS_INFO"`
    - `"COMMAND_CLASS_SECURITY"`
    - `"COMMAND_CLASS_SECURITY_2"`
    - `"COMMAND_CLASS_DOOR_LOCK"`
    - `"COMMAND_CLASS_BATTERY"`
    - `"COMMAND_CLASS_NOTIFICATION"`
    - `"COMMAND_CLASS_USER_CODE"`
  - `"learnmode"` og `"excludemode"` for brukervennlighet

## PIN-kodehåndtering (brukerkoder)

- Appen støtter nå PIN-kodehåndtering via Z-Wave (COMMAND_CLASS_USER_CODE).
- Du kan lese, sette og endre brukerkoder (PIN) fra Homey hvis låsen og Z-Wave-modulen støtter det.
- Krever secure (S2) inkludering.

## Inkludering og Ekskludering

- **Inkludering (legg til i Homey):**
  1. Åpne døren og ta ut øverste og nederste batteri.
  2. Sett inn Z-Wave-modulen i REMOTE-rommet.
  3. Sett inn batteriene og batterilokket.
  4. Start inkludering i Homey-appen (legg til enhet → ID Lock 202).
  5. På låsen:
     - Tast [Master PIN] + [*]
     - Tast [9] + [*]
     - Tast [1]
- **Ekskludering (fjern fra Homey):**
  1. Start ekskludering i Homey-appen.
  2. På låsen:
     - Tast [Master PIN] + [*]
     - Tast [9] + [*]
     - Tast [2]

## Feilsøking og Vanlige Problemer

- **Missing Capability Listener: locked**
  - Oppstår hvis låsen ble lagt til før capability listener var på plass, eller hvis capabilities i Homey og i driver.compose.json/device.js ikke er identiske.
  - Løsning: Slett låsen fra Homey, bygg og kjør appen på nytt, og legg til låsen igjen.
- **Låsen vises som ID Lock 150**
  - Dette er normalt, fordi Z-Wave-modulen rapporterer 150-ID. Homey bruker likevel funksjonaliteten og navnet fra 202-driveren hvis du har satt opp prosjektet riktig.
- **Kun én driver synlig i appen**
  - Hvis du kun har én driver registrert (f.eks. 202), vil kun denne vises når du legger til enhet.
  - Hvis du har flere drivere (101, 150, 202), vises alle – men kun én kan ha samme Z-Wave-ID.

## Viktige Funksjoner i driver.compose.json

- `"learnmode"` og `"excludemode"` gir riktige instruksjoner i Homey-appen for inkludering og ekskludering.
- `"commandClasses"` må matche det låsen faktisk støtter.
- `"capabilities"` må være identiske i både driver.compose.json og device.js.

## Kilder og Forumfunn

- [ID Lock 202 Z-Wave FAQ](https://idlock.no/kundesenter/z-wave-sporsmal-og-svar/)
- [ID Lock 202 brukermanual Z-Wave](https://idlock.no/wp-content/uploads/2023/07/User-Manual-Z-Wave-202-EN.pdf)
- [Homey Community: Ted Tolboom ID Lock-app](https://community.homey.app/t/app-pro-id-lock-app-v2-0-0/161/79)
- Mange brukere rapporterer at 202 fungerer med 150-driveren fordi de har samme Z-Wave-ID.
- Homey kan kun matche én driver per Z-Wave-ID.

## Oppsummering

- **Ha kun én driver med ID Lock 202 sin Z-Wave-ID i appen.**
- Slett låsen fra Homey og legg til på nytt etter endringer i capabilities eller kode.
- Dokumenter alle endringer og funn fortløpende i denne filen.