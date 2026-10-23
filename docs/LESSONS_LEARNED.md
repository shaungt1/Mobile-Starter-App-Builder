# Lessons learned

This document records every setup and build problem found while building apps with these templates,
starting with the first production app built on the Expo template. Each entry gives the symptom, the
cause, and what the builder now does about it, so a developer or an agent can recognize the problem
quickly and knows whether the scripts already handle it. Entries marked "handled" need no action.

## Machine and toolchain

| Symptom | Cause | Fix |
| --- | --- | --- |
| Lint config or Supabase client fails to load on Node 20 | The template's `.mts` lint config needs Node 20.19+/22.18+, and the 2026 Supabase client dropped Node 20 | Handled: every check requires Node 22.18+. |
| Android build cannot find Java, or Gradle fails with a newer JDK | React Native recommends JDK 17; newer JDKs can break Gradle | Handled: launchers search `JAVA_HOME`, Microsoft and Temurin JDK 17 folders. Tauri prefers Android Studio's bundled `jbr`. |
| `ANDROID_HOME` not set in a new Git Bash window | Windows user variables are not loaded into already-open terminals | Handled: scripts find `%LOCALAPPDATA%\Android\Sdk`; `android-setup --set-env` saves the variables. |
| `adb` reports a connection reset on Windows | The local ADB server gets into a bad state | Handled: launchers restart ADB once and retry. |
| Emulator never connects when started by Expo | Expo's AVD-name probe uses a console port newer emulators may not expose | Handled: the launcher boots the AVD itself and waits for `sys.boot_completed`. |
| Gradle fails during D8 with out-of-memory | The default 2 GB Gradle heap is too small for large dependency graphs | Handled: 6 GB heap by default (`APP_GRADLE_HEAP_MB`). |
| Android native build fails with "file name too long" on Windows | CMake object paths exceed 260 characters | Handled: `plugins/with-android-cmake-path-limit.js` plus a temporary short drive letter during builds (`APP_SUBST_DRIVE`). Tested against a real `expo prebuild`. |
| Slow repeat builds on emulators and phones | Gradle built every CPU architecture | Handled: the launcher builds only the target's ABI. |
| Some native packages fail on Gradle 9 / Windows | Packages such as `onnxruntime-react-native`, `react-native-audio-api`, `react-native-track-player` had broken Android implementations at the time | If an unused package breaks Android, exclude it with `expo.autolinking.android.exclude` in `package.json`. |
| `oxfmt --check` rejects every file on Windows | Git converted line endings to CRLF on clone | Handled: generated apps get `.gitattributes` with `eol=lf`; bootstrap clones with `core.autocrlf=false`. |
| `bun install` skips a package's setup | Bun blocks postinstall scripts by default | Run `bun pm untrusted`, then `bun pm trust <pkg>` only for packages that need it. |
| iOS cannot be built on Windows or Linux | Apple tools exist only on macOS; Tauri's iOS commands are macOS-only | Expo: use EAS cloud builds. Tauri: use a Mac. |
| Tools installed but "command not found" | PATH changes apply to new terminals only | Reopen Git Bash and VS Code after installing. |

## Expo template and dependencies

| Symptom | Cause | Fix |
| --- | --- | --- |
| Expo Doctor fails on a fresh upstream clone (22 packages behind) | The upstream template lagged the SDK's patch set | Handled for bootstrap: `expo install --fix`, then a clean reinstall to remove duplicate nested modules. |
| Expo Doctor: "scripts in package.json conflict with node_modules/.bin: knip" | A script named exactly like a binary | Fixed in the template: the script is now `check:unused`. |
| `format:check` fails on a clean template | One component (`select.tsx`) was not formatted | Fixed in the template. |
| Generated app still shows the template name | The generator searched for single-quoted names, the formatter writes double quotes | Fixed in the generator and in `configure`; covered by a test. |
| `format:check` fails on `PROJECT_PLAN.json` after generation | The generator wrote arrays differently from the formatter | Fixed: the plan is written in the formatter's style. |
| App crashes in Expo Go / "undefined is not a function" at startup | Native module versions newer than Expo Go ships, or a native-only import | Guard native imports (`code/environment.ts`); use a development build. |
| `expo-notifications` breaks Expo Go | Push was removed from Expo Go in SDK 53 | Guard it; test notifications in a development build. |
| Reanimated errors after `expo install --fix` | Reanimated and `react-native-worklets` drifted apart | Keep both pinned and listed in `expo.install.exclude`. |
| White screen on launch | A startup provider threw, or fonts never loaded | Guard startup services; render with a font-loading timeout. |
| Web build errors "not available on web" | A native call ran during web render | Guard via the environment module. |
| React Native Reusables `add` overwrote a file | It replaces same-named files | Diff before overwriting. |
| Deleting a template feature's files by hand breaks the build in many places | Routes, Settings and providers import the feature's modules | Handled: `start.sh expo feature remove` swaps in stubs with the same exports and removes the rest. |
| knip reports `expo-updates` as an unlisted dependency after removing it | knip's Expo plugin assumes updates are on unless `expo.updates.enabled` is `false` | Handled: removing `ota-updates` sets `updates.enabled: false` and removes `runtimeVersion`. |
| knip reports packages as unused after removing analytics (`expo-application`, `expo-file-system`) | They are peer modules of the PostHog SDK, not imported by app code | Handled: listed with the analytics feature and removed only when nothing imports them. |
| `bun install --frozen-lockfile` fails after a dependency change | The lockfile no longer matches `package.json` | Handled: feature changes made with `--no-install` leave `.mobile-builder/lock-stale`; `setup` then installs once without `--frozen-lockfile`. |
| Fresh `create-expo-app` (SDK 58, 2026-10-22) fails `tsc` | Expo's own demo files do not type-check | Handled: the clean path removes the demo with Expo's `reset-project` script. |
| `reactnativereusables.com` unreachable (proxy or offline) | The CLI downloads components from the registry | Handled: the clean path falls back to the owned template's components. |
| Expo Doctor fails with `ENOTFOUND exp.host` | No network access to the Expo API | Run with network; `APP_SKIP_DOCTOR=1` only when that is impossible, and report it. |

## Tauri 2

| Symptom | Cause | Fix |
| --- | --- | --- |
| Rust compile error "failed to open icon icons/32x32.png" | `generate_context!` embeds icons at compile time | Handled: the template ships icons; `bash start.sh icons` regenerates them. |
| Desktop preview stops compiling after adding a plugin | `tauri add` registers mobile-only plugins without `#[cfg(mobile)]` | Handled: the builder's installer limits the crate to mobile targets and guards registration. |
| Capability file rejected | Platform names are case-sensitive (`iOS`, `android`, `macOS`) | Handled in generated files. |
| Phone cannot load the dev server | The dev server listened only on localhost | Handled: Vite and Next.js configs honor `TAURI_DEV_HOST`. |
| Type error spreading `@use-gesture` handlers onto a Motion element | Both libraries define `onDrag` with different types | Handled: bind gestures to a plain element inside the Motion element. |
| Swipe action button cannot be tapped | The gesture surface covered the revealed button | Handled: the gesture element moves with the row (verified with a real pointer drag). |
| Lint fails on generated JSON | The generator's JSON layout differs from Biome's | Handled: generator-managed JSON is excluded from formatting. |
| Konsta colors override shadcn colors (or the reverse) | Both stylesheets define `--color-primary`; the last import wins | Handled: Konsta is imported after shadcn's tokens deliberately. |

## Process

Install one native capability at a time and verify after each. Build screens against mock data before
connecting services. Emulators cannot test Bluetooth, real camera input, NFC, biometrics, purchases or
on-device AI performance; use a physical device and say so in the hand-off when none was available.
