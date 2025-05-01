# Project Brief

This project is a Homey app that provides support for the ID Lock 202 Multi smart lock using the Z-Wave protocol.

**Core Requirements and Goals:**
- Allow users to lock and unlock the ID Lock 202 Multi from the Homey app and via flows.
- Enable management of user PIN codes and RFID tags.
- Implement features like auto-lock and away mode.
- Provide robust flow support based on lock events and users.
- Ensure secure storage of sensitive data like PIN codes.
- Address the conflict where ID Lock 202 uses the same Z-Wave ID as ID Lock 150 by using only the IDLock150 driver internally.

**Source of Truth for Project Scope:**
- README.md
- app.json
- driver.compose.json (for IDLock150)
