# Technical Notes - ID Lock Z-Wave App

This document contains technical details about the implementation of the ID Lock Z-Wave app for Homey.

## Configuration Parameter 1 Handling (Auto Lock & Away Mode)

The ID Lock 202 Multi uses Z-Wave Configuration Parameter 1 to control both the Auto Lock and Away Mode features. This parameter is a single byte where different bits represent different settings:

- **Bit 0 (Value 1):** Controls Auto Lock (0 = Manual, 1 = Auto)
- **Bit 1 (Value 2):** Controls Away Mode (0 = Off, 1 = On)

The possible combined values are:
- `0` (0b000): Manual Lock / Away Mode OFF
- `1` (0b001): Auto Lock / Away Mode OFF
- `2` (0b010): Manual Lock / Away Mode ON
- `3` (0b011): Auto Lock / Away Mode ON

### Implementation Details

To provide separate toggle switches (`autolock_enabled` and `away_mode`) in the Homey UI, the following approach was taken:

1.  **Capabilities:** Defined `autolock_enabled` and `away_mode` as boolean capabilities in `app.json` with `uiComponent: "toggle"`.
2.  **`setParser` Logic:**
    - When a toggle is changed in the UI, the corresponding `setParser` function in `device.js` is triggered.
    - This function first reads the *current* value of Configuration Parameter 1 (from device store or directly via `CONFIGURATION_GET` as fallback).
    - It then uses bitwise operations (`|` for setting a bit, `& ~` for clearing a bit) to modify only the relevant bit (0 for autolock, 1 for away mode) based on the new toggle state (`true` or `false`).
    - The resulting combined value is then sent back to the lock using `CONFIGURATION_SET`.
    - This ensures that changing one setting (e.g., Auto Lock) does not unintentionally change the other setting (e.g., Away Mode).
3.  **`reportParser` Avoidance:** The `reportParser` for the `CONFIGURATION` command class related to these capabilities was initially causing "Invalid Capability" errors, likely due to timing issues or unexpected reports during startup. It was removed.
4.  **`getOnStart` Avoidance:** The `getOpts: { getOnStart: true }` option was also removed from the capability registration for `autolock_enabled` and `away_mode`. Relying on `getOnStart` for configuration parameters can sometimes lead to errors if the device isn't fully ready or if reports are missed.
5.  **Manual Initialization:** A `manualInitializeConfigCapabilities` function was added in `device.js` (called from `onNodeInit`) to explicitly fetch the value of Parameter 1 using `CONFIGURATION_GET` after the device is initialized. This function then updates the state of both `autolock_enabled` and `away_mode` capabilities based on the received value and stores the raw value for later use by `setParser`.

## UI Display Fix (Toggles vs. Dropdown)

Initially, Homey displayed a single dropdown menu in the device settings combining the four possible states of Parameter 1, instead of the desired two separate toggle switches. This happened because a `setting` was defined in `driver.compose.json` that also targeted Parameter 1.

To force Homey to display the capabilities as toggles:

1.  **Removed Setting:** The entire `settings` block defining the "Locking Mode" dropdown was removed from `drivers/IDLock150/driver.compose.json`.
2.  **Added Capabilities:** Ensured `autolock_enabled` and `away_mode` were listed in the `capabilities` array in `drivers/IDLock150/driver.compose.json`.
3.  **Explicit `uiComponent` (Redundant):** Added `uiComponent: 'toggle'` within the `registerCapability` options in `device.js` as an extra, likely redundant, measure.
4.  **Re-pairing:** If the UI still doesn't show the toggles after app restart, the device likely needs to be removed from Homey and added again. This forces Homey to re-read the app's manifest files and build the correct UI presentation.

## Secure Inclusion

The app checks for secure inclusion during initialization (`onNodeInit`). If the device is not securely included (S0 or S2), a warning is logged, and a notification is sent to the user, as essential lock functions (like `DOOR_LOCK` commands) require security.

## Code Management (Temporarily Disabled)

The `CodeManager` library and related UI/flow features for managing PIN codes and RFID tags were temporarily commented out during debugging and simplification. This functionality needs to be re-integrated and tested.
