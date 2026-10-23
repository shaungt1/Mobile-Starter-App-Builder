---
name: mobile-run-device
description: Launch a generated app on the web, Expo Go, an Android emulator, a USB Android phone, the iOS Simulator, or the Tauri desktop preview, and diagnose launch problems. Use when the user wants to see or test the app running.
---

# Run on a device

## Steps
1. `bash start.sh system` in the app; pick a target the machine supports.
2. Start with `bash start.sh run web` to confirm the UI renders.
3. Expo: `run android` boots an emulator and installs a development build; `run usb` uses a phone with USB debugging; `run ios` on macOS; `run go` only for standard Expo SDK features; `run dev-client` when a development build is already installed. Rebuild (`run android`/`run usb`) after any native dependency or `app.json` change.
4. Tauri: `run desktop` for a phone-sized window with real Rust commands, `run android`, `run ios` (macOS).
5. Only one dev server at a time; stop the previous one first.
6. `bash start.sh devices` lists attached phones, emulators and serial ports.

## Done when
The app launched on the requested target, or the reason it cannot (missing tool, no device, wrong OS) is reported.
