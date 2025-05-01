# Product Context

**Why this project exists:**
The project exists to provide seamless integration and control of the ID Lock 202 Multi smart lock within the Homey smart home platform using the Z-Wave protocol.

**Problems it solves:**
- Allows users to remotely lock/unlock their ID Lock 202 Multi via Homey.
- Provides a centralized interface for managing user PIN codes and RFID tags within Homey.
- Enables automation scenarios through Homey Flows based on lock events and specific users.
- Offers enhanced security features like auto-lock and away mode controllable via Homey.

**How it should work (User Experience Goals):**
- Users should be able to easily add the ID Lock 202 Multi as a device in Homey using the specified inclusion procedure.
- Basic lock/unlock functionality should be intuitive from the device card.
- Managing user codes (PINs and RFID tags) should be straightforward through a dedicated settings interface, following the procedures outlined in the manual for adding/deleting codes directly on the lock.
- Auto-lock and away mode should be easily configurable in device settings, corresponding to the Lock Mode configuration parameter.
- Flow triggers should be reliable and provide useful information (e.g., which user unlocked the door), based on the Z-Wave Notification events.
- The app should handle Z-Wave communication reliably, even with potential timeouts.
- Sensitive data like PIN codes should be stored securely and not be visible in the UI.
- The app should guide the user through the inclusion and exclusion process as described in the Z-Wave module manual.

**Daily Use (from Manual):**
- **Automatic locking mode:** Lock automatically 3 seconds after the door is closed (when activated).
- **Manual locking mode:** Manually lock by turning the inside knob, pressing the inside key button, or touching the outside panel (when automatic locking is deactivated).
- **Unlocking from outside:** Activate the panel, enter PIN + #, or present RFID tag.
- **Unlocking from inside:** Turn the knob or press the key button.
- Lock indicates locking with 2 red flashes and a melody (5 beeps).
- Lock indicates unlocking with 2 blue waves and a melody (5 beeps).

**Setup and PIN Codes (from Manual):**
- **Set Master PIN:** Activate outside unit, press [ New Master PIN ] [ * ] [ Repeat Master PIN ] [ # ].
- **User PIN (up to 25):** Open/unlocked door, activate panel, press [ * ] [ Master PIN ] [ * ] [ 3 ] [ * ] [ Position 1 - 25 ] [ * ] [ desired PIN ] [ # ].
- **Add RFID (up to 25):** Open/unlocked door, activate panel, press [ * ] [ Master PIN ] [ * ] [ 5 ] [ * ] [ Position 1 - 25 ] [ * ], display RFID tag in front of CARD symbol.

**Menu Activation (from Manual):**
- **Door open/unlocked:** Press inside key button for 3 seconds, then [ Master PIN ] [ * ].
- **Door closed/locked (from outside):** Activate panel, then press [ * ] [ Master PIN ] [ * ].

**Factory Reset (from Manual):**
- Remove top and bottom battery.
- Press and hold the inside key button while inserting top and bottom battery.
- Release key button after melody.
- Factory reset activates highest security configuration (Automatic locking, Relock, Lock when open activated; Master PIN reset). A new Master PIN must be programmed after reset.
