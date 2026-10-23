# Running the app: browser, Expo Go, development builds, phones

This guide explains which way of running the app proves what, and how to move between them. It
generalises the notes of the first production app built from this template (LUMNI). Every command is
run from the app folder in Git Bash (Windows) or a Bash shell (macOS, Linux). `bash start.sh` with no
arguments shows a numbered menu of the same commands.

## Choose the surface

A **development client** is your own debug version of Expo Go: it contains the native modules listed in
`package.json` and the permissions generated from `app.json`, and it connects to the same Metro
(JavaScript bundler) server as Expo Go for hot reload. Expo Go itself contains only the standard Expo SDK
modules, so it cannot load native code that is not bundled into it.

| Goal                                                         | Command                              | What it can prove                                                        | What it cannot prove                                                      |
| ------------------------------------------------------------ | ------------------------------------ | ------------------------------------------------------------------------ | ------------------------------------------------------------------------- |
| Screens, navigation, theme, cloud API calls                  | `bash start.sh run web`              | Layout at phone sizes, logic, browser-compatible APIs                    | Any native module, haptics, push, purchases                               |
| The same on a real phone with no build                       | `bash start.sh run go`               | Standard Expo SDK modules, gestures, animation on a device               | Custom native modules (Bluetooth, vision camera, purchases, on-device AI) |
| Expo Go when Wi-Fi discovery is blocked (VPN, guest network) | `bash start.sh run go-tunnel`        | Same as above, slower                                                    | Same as above                                                             |
| Every native module on an emulator                           | `bash start.sh run android`          | The development build with all native code; boots the emulator if needed | Bluetooth, real camera input, purchases, performance                      |
| Every native module on a phone                               | `bash start.sh run usb`              | Real hardware behaviour                                                  | iOS (use a Mac or EAS)                                                    |
| Fast reload with a build already installed                   | `bash start.sh run dev-client`       | JavaScript changes without a native rebuild                              | Native changes (rebuild first)                                            |
| iOS                                                          | `bash start.sh run ios` (macOS only) | The iOS Simulator build                                                  | Physical-device features                                                  |

`bash start.sh devices` lists attached phones, emulators, simulators and serial ports, and
`bash start.sh system` reports what this machine can run.

## When a native rebuild is required

Rebuild the development client (`run android`, `run usb` or `run ios`) after changing any of: a native
dependency, `app.json`, a config plugin in `plugins/`, permissions, app icons or splash, or the Expo SDK
version. JavaScript, TypeScript, styles and assets do not need one. Removing or adding a built-in feature
that has native code (see `docs/FEATURES.md`) counts as a native change.

## Android phone over USB

1. Install Android Studio, a Java 17 JDK and the Android SDK platform tools (the builder's
   `install-prereqs` and `android-setup` scripts do this; `docs/LOCAL_SETUP.md` lists the manual steps).
2. On the phone enable Developer options and USB debugging, connect it with a data-capable cable, and
   accept the authorisation prompt.
3. Run `bash start.sh devices`. The `adb devices -l` section must list the phone as `device`, not
   `unauthorized` or `offline`.
4. Run `bash start.sh run usb` once to build and install the development client, then
   `bash start.sh run dev-client` for later JavaScript-only work.

Without a local Android toolchain, request an EAS development build instead:
`ALLOW_RELEASE=yes bash start.sh release build --profile development -p android`, then install the APK
from the link EAS prints. Release commands ask for explicit approval because they use a hosted, possibly
billable service.

## iPhone

An EAS physical-device build uses the `development-device` profile in `eas.json` and needs an Apple
Developer Program account and a registered device. On a Mac, a local build can target a device with
`bunx expo run:ios --device "<exact device name>"`. Simulator builds validate the interface and many
native integrations but not Bluetooth, camera hardware or purchases.

## Troubleshooting

- Android shows `unauthorized`: unlock the phone, accept the debugging prompt, rerun `adb devices -l`.
- No Android device appears: try another cable or port, install the phone maker's USB driver on Windows,
  and confirm the cable carries data.
- Expo Go cannot connect: use `run go-tunnel`, and check VPN and firewall rules.
- A native API is missing: you opened Expo Go instead of the development client, or you changed native
  configuration without rebuilding.
- Anything else on Windows, Android or Bun: see `docs/LESSONS_LEARNED.md` in the builder repository; the
  launch scripts already handle the problems recorded there.
