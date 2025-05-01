# System Patterns

**System Architecture:**
The ID Lock Z-Wave app for Homey follows a typical Homey app structure with key components interacting within the Homey Z-Wave framework:
- **Device Driver:** Implemented using `homey-zwavedriver` (`ZwaveDevice`) to handle Z-Wave communication with the ID Lock 202 Multi (using the IDLock150 driver implementation). It registers capabilities and handles Z-Wave command reports.
- **CodeManager:** Manages user PIN codes and RFID tags securely, interacting with the device driver to send `COMMAND_CLASS_USER_CODE_V1` commands.
- **Settings UI:** Provides an Angular.js interface for managing codes and device settings, communicating with the backend via Homey's settings API. It configures device parameters, likely using `COMMAND_CLASS_CONFIGURATION_V1`.
- **Z-Wave Communication:** Utilizes Z-Wave command classes as defined by the Homey Z-Wave implementation and the ID Lock 202 Multi's supported classes for lock control, configuration, user code management, and receiving notifications.

**File Structure:**
- `app.js`: Main app entry point, defines flow triggers and conditions, potentially reacting to Z-Wave notifications received by the device driver.
- `drivers/IDLock150/device.js`: Device driver implementation extending `ZwaveDevice` from `homey-zwavedriver`. Contains logic for sending Z-Wave commands (`node.CommandClass...`) and handling incoming reports and notifications.
- `lib/code-manager.js`: Contains the logic for code management and security, interacting with the device driver to send user code commands.
- `settings/`: Directory for global app settings UI.
    - `settings/IDLock150.html`: Device-specific settings UI for ID Lock 202 Multi, likely using the settings API to configure Z-Wave parameters defined in `driver.settings.compose.json`.
    - `settings/index.html`: Main settings entry point required by Homey.
    - Supporting files: `idlockApp.js`, `idlockApp.css`, `xeditable.min.js`, `xeditable.min.css`.
- `drivers/IDLock150/driver.compose.json`: Defines the Z-Wave device driver, including `manufacturerId`, `productTypeId`, `productId`, `learnmode`, `requireSecure`, `defaultConfiguration`, and `associationGroups`.
- `drivers/IDLock150/driver.settings.compose.json`: Defines the device settings and their mapping to Z-Wave configuration parameters.

**Key Technical Decisions:**
- **Using IDLock150 Driver for ID Lock 202 Multi:** Leverages Homey's driver matching based on Z-Wave IDs, despite the naming difference. Configured in `driver.compose.json`.
- **Bitwise Lock Mode Management:** Maps to Z-Wave Configuration Parameter 1 (Lock Mode), configured via the settings UI and handled in the device driver.
- **Secure Code Storage:** Implemented in `CodeManager`, interacting with the lock via `COMMAND_CLASS_USER_CODE_V1`. Requires secure inclusion (`requireSecure: true` in `driver.compose.json`).
- **Angular.js for Settings UI:** Utilizes Homey's settings API for UI/backend communication, configuring Z-Wave parameters defined in `driver.settings.compose.json`.
- **Global vs Device-Specific Settings:** Adheres to Homey's convention of using named HTML files in the global settings folder for device-specific settings.
- **Graceful Z-Wave Command Timeout Handling:** Implemented in the device driver to manage potential delays in Z-Wave communication, which is a common aspect of Z-Wave networks.
- **Robust Data Handling in Code Management UI:** Addresses challenges in interacting with the lock's user code data via Z-Wave commands and reports.
- **Use of `homey-zwavedriver`:** Follows the recommended Homey practice for simplifying Z-Wave device development by extending `ZwaveDevice` and using `registerCapability`.
- **Association Group 1 (Lifeline):** Configured in `driver.compose.json` to ensure Homey receives unsolicited notifications (`COMMAND_CLASS_NOTIFICATION_V4`) from the lock.

**Design Patterns in Use:**
- **Promise.race() for Timeouts:** Applied in the device driver for handling Z-Wave command responses.
- **Bitwise Flags:** Used for managing lock modes, mapping to Z-Wave Configuration Parameter 1.
- **Layered Architecture:** Separation of concerns between driver, code manager, and UI, interacting through defined interfaces (Homey SDK, settings API, Z-Wave commands).
- **Event-Driven Programming:** The device driver listens for Z-Wave command reports and notifications to update capabilities and trigger flows.

**Component Relationships:**
- `app.js` defines flows that are triggered by capability changes or specific Z-Wave notifications reported by the device driver.
- The device driver (`drivers/IDLock150/device.js`) is the central point for Z-Wave interaction, sending commands based on capability changes or settings, and receiving/processing reports and notifications.
- The Settings UI interacts with the `CodeManager` and potentially directly with the device driver (via settings API calls that the driver handles) to configure the lock and manage codes.
- The `CodeManager` relies on the device driver to send `COMMAND_CLASS_USER_CODE_V1` commands to the lock.
- The lock communicates with the device driver using Z-Wave commands, reports, and unsolicited notifications (sent to the Lifeline association group).
