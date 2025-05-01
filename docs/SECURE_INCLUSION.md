# Sikker inkludering for ID Lock 202 Multi

Dette dokumentet forklarer viktigheten av sikker inkludering (S0/S2) for ID Lock 202 Multi med Z-Wave-teknologi og hvordan det påvirker funksjonaliteten i Homey.

## Bakgrunn

ID Lock 202 Multi er en elektronisk dørlås som bruker Z-Wave-teknologi for å kommunisere med smarthus-kontrollere som Homey. Som en sikkerhetsenhet, krever ID Lock 202 Multi **sikker inkludering** for å aktivere kritiske kommandoklasser som `COMMAND_CLASS_DOOR_LOCK`. Når en dørlås ikke er sikkert inkludert, vil låsekommandoer ikke fungere korrekt.

## Hvordan identifisere problemet

En ID Lock som ikke er sikkert inkludert vil vise følgende symptomer:

1. I Homey-enhetens innstillinger vil `zw_secure` være satt til `"⨯"` i stedet for `"✓"`, `"S0"`, eller `"S2"`
2. Låse/opplåse-kommandoer fra Homey-appen vil mislykkes eller bare oppdatere brukergrensesnittet uten å påvirke låsen
3. I loggen vil du se meldinger som:
   ```
   COMMAND_CLASS_DOOR_LOCK not available, using alternative method
   Door locked state updated in UI (direct command not available)
   ```

## Hvordan sikker inkludering fungerer

Z-Wave sikker kommunikasjon kan bruke enten:
- **S0** (Security 0): Eldre, men fortsatt sikker krypteringsstandard
- **S2** (Security 2): Nyere, mer sikker og effektiv krypteringsstandard

For ID Lock 202 Multi, vil begge fungere, men S2 er å foretrekke dersom din Homey-kontroller støtter det.

## Prosess for sikker inkludering

For en detaljert steg-for-steg guide, kjør følgende kommando i utviklerkonsollen:
```
node tools/idlock-secure-reset.js
```

Dette vil gi deg en interaktiv veiledning for sikker ekskludering og inkludering.

### Kort oppsummering

1. **Ekskluder enheten** fra Homey
2. **Nullstill Z-Wave-nettverket** på låsen med PIN-kode
3. **Sjekk Homey-innstillingene** for å sikre at "Sikker inkludering" er aktivert
4. **Inkluder enheten** med følgende steg:
   - Åpne døren
   - Ta ut alle batteriene
   - Kontroller at Z-Wave-modulen er i REMOTE-sporet (ikke LOCAL)
   - Sett inn batteriene igjen
   - Bruk Master PIN + [*], så [9] + [*], deretter [1]
5. **Godta sikkerhetsforespørselen** når Homey spør om sikker inkludering

## Diagnostikk

For å kontrollere om låsen er sikkert inkludert:

1. Gå til Homey-appen > Enheter > ID Lock 202 > Innstillinger
2. Bla ned til Z-Wave-innstillinger
3. Se på `zw_secure`-verdien:
   - `"✓"`, `"S0"`, eller `"S2"` betyr at sikker inkludering er aktivert
   - `"⨯"` betyr at enheten ikke er sikkert inkludert

## Kode-diagnoser

Vår app inkluderer nå utvidet diagnostikk som vil:
1. Identifisere når en lås ikke er sikkert inkludert
2. Sende en varsling til Homey om problemet
3. Loggføre detaljerte diagnosemeldinger

## Vanlige problemer og løsninger

### 1. Homey tilbyr ikke sikker inkludering
- Sjekk Z-Wave-innstillingene i Homey for å sikre at "Sikker inkludering" er aktivert
- I nyere versjoner av Homey er dette ofte slått på som standard, og alternativet vises ikke

### 2. Tidsvindu for inkludering
- ID Lock 202 har et begrenset tidsvindu for inkludering
- Start inkluderingsprosessen i Homey FØR du trykker på låseknappene

### 3. Avstand og signalstyrke
- Hold låsen svært nær Homey under inkluderingsprosessen
- Sikker inkludering krever en sterkere og mer stabil forbindelse enn vanlig inkludering

### 4. Z-Wave-modulplassering
- Sørg for at Z-Wave-modulen er riktig plassert i REMOTE-sporet, ikke LOCAL-sporet
- Feil plassering kan forhindre riktig kommunikasjon

## Ressurser

- [ID Lock 202 brukermanual](../docs/User-Manual-Z-Wave-202-EN.pdf)
- [ID Lock 202 Z-Wave spesifikasjoner](../docs/ID-Lock-202-Multi-EN-v1.2.pdf)
- [Homey Z-Wave dokumentasjon](https://homey.app/no-no/app/com.homey.zwave/)