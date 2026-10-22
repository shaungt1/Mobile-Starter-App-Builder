---
name: mobile-capability
description: Add one optional capability (auth, payments, analytics, SQLite, notifications, BLE, camera, haptics, barcode scanner, biometrics, location, NFC, HTTP, Consta UIKit, and others) to a generated app. Use when the user asks for a feature that needs a package, plugin or permission.
---

# Add a capability

## Steps
1. List and inspect: `bash start.sh expo capabilities list|show <id>` or `bash start.sh tauri capability list|show <id>`.
2. Expo: `bash start.sh expo capabilities install <id> <app> --apply`, then complete the listed follow-up steps (config plugins, permissions, dashboard work, environment values).
3. Tauri: `bash start.sh tauri capability install <id> <app>`. It edits Cargo.toml, package.json, lib.rs (mobile-only plugins under `#[cfg(mobile)]`), capability permissions and `Info.ios.plist`. Edit the iOS usage text for the app.
4. In the app: `bash start.sh verify`.
5. Test on a target that supports the feature (hardware features need a physical device; Expo native modules need a development build).
6. Add the next capability only after this one is verified.

## Done when
`verify` passes and the feature was exercised on a suitable target, or the missing device/account is reported.
