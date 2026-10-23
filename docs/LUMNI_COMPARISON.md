# LUMNI compared with the upstream and owned Expo templates

LUMNI is the first production app built from the Simonstorms Expo template (the "upstream"). This
document records what LUMNI kept, changed and added, and what the builder's owned Expo template
(`_expo/starter/template`) took from it, so that the next app starts where LUMNI ended. It was written
on 2026-10-23 from the LUMNI working folder (seven commits, latest "Add quick-start and configuration
readiness guide") and the upstream snapshot at commit `888b9e1`.

## 1. What LUMNI kept from upstream

- Expo SDK 57 and React Native 0.86.3, Expo Router with typed routes, React Compiler.
- The full onboarding funnel: all 25 onboarding routes are present in `src/app/`, with
  `src/features/onboarding`.
- Supabase auth (Apple, Google), RevenueCat with the paywall screen and the hosted RevenueCat paywall
  (the upstream paywall component folder was not kept), PostHog analytics,
  local notifications, TanStack Query, Zustand, the upstream UI components and motion tokens.
- The three upstream iOS config plugins and the EAS and RevenueCat set-up scripts; LUMNI added a
  fourth plugin for Android long paths.

## 2. What LUMNI added

| Area | Added in LUMNI |
| --- | --- |
| Product screens | A second navigation area `src/app/main/` (assistant, device, hardware lab, library, light, read, settings) and a `reader` route; features `hardware`, `reader`, `theme`. |
| Hardware | Bluetooth Low Energy (`react-native-ble-plx`, background central mode), MQTT, TCP and UDP sockets, Zeroconf discovery, a transport layer with a mock transport, fixtures and tests (`src/transports`), and an `IOT/` folder with firmware, a web app and an AI API. |
| Audio and speech | `expo-audio`, `expo-speech`, `expo-speech-recognition`, `react-native-audio-api`, `react-native-track-player`; services `src/services/speech` and `src/services/reading`. |
| Vision and AI | `react-native-vision-camera`, ML Kit text recognition, `onnxruntime-react-native`, `llama.rn`, the OpenAI and Anthropic SDKs, the Vercel `ai` SDK, LangChain and LangGraph, `js-tiktoken`, plus `ml-matrix`, `fft.js`, `simple-statistics`. |
| UI | NativeWind with React Native Reusables (the same approach the owned template adopted), bottom sheets, FlashList, Skia, Lottie, Rive, Moti, blur, `expo-image`, keyboard controller, toasts (`sonner-native`), native menus (`zeego` and two alternatives), pager view, draggable lists, carousels, Google Fonts (Inter, Lora, JetBrains Mono). |
| Charts | `victory-native`, `react-native-gifted-charts`, `react-native-wagmi-charts`, d3 modules. |
| Data | Expo SQLite with Drizzle and Drizzle Studio, MMKV, the TanStack Query persister, XState. |
| Platform | Biometrics, native Google Sign-In, background tasks, task manager, keep-awake, media library, print, screen-capture protection, navigation bar, quick crypto, Buffer and base64 helpers, WebRTC, markdown, QR codes, protobuf, i18next, date-fns, es-toolkit. |
| Tooling | Launch scripts for emulator, USB phone, iOS Simulator and web; device and configuration checks; the Android long-path CMake plugin; Sentry; Jest with `jest-expo`, Testing Library, MSW, Reactotron; `@expo/ngrok` for tunnels. |
| Documents | Development, Bun and tooling, dev client and Android, Drizzle, hardware set-up, testing in Expo Go, AI and system capability, code map, product and pitch documents. |

LUMNI has 166 runtime and 20 development packages; upstream has 43 and 14.

## 3. What the owned template took from LUMNI

- The launch and device scripts (`start-emulator`, `start-usb`, `start-ios-simulator`, `start-web`,
  Metro handling, device checks) and every Android fix recorded in `docs/LESSONS_LEARNED.md`.
- The `with-android-cmake-path-limit` plugin.
- NativeWind with React Native Reusables, SQLite with Drizzle, the device transport boundary and the
  camera, picker, clipboard, sharing and network modules.
- As opt-in catalog entries (`bash start.sh expo capabilities list`), not preinstalled: every other LUMNI
  package group above. The catalog gained `ui-extras`, `motion-graphics`, `charts`, `state-storage`,
  `i18n`, `fonts`, `local-auth`, `google-signin`, `background-tasks`, `media-system`, `crypto-binary`,
  `content-display`, `signal-math`, `realtime-media`, `testing-debug` and `haptics-extra`; `cloud-ai`
  gained the LangChain packages. BLE, sockets, camera vision, audio and on-device AI were already there.

## 4. What the owned template deliberately does not do like LUMNI

- It does not preinstall the onboarding funnel; the funnel is demo content for one consumer product.
  It is restorable with `bash start.sh expo feature add funnel APP` (see `_expo/docs/FEATURES.md`).
- It does not preinstall hardware, audio, AI or the large UI libraries; each adds native code, binary
  size and store-review questions, so each is added only when a screen needs it.
- It does not ship provider AI keys in the app. LUMNI's `IOT/ai-api` server pattern (provider calls on a
  server) is the pattern the `cloud-ai` capability requires.

## 5. Problems LUMNI hit and where they are handled

Every setup and build problem from LUMNI is in `docs/LESSONS_LEARNED.md` with its fix. The ones that
shaped the template most: Node 22.18+ requirement, JDK 17 discovery, Windows long paths in CMake, the
Gradle heap, per-ABI builds, ADB resets, CRLF line endings on Windows, and Android build failures from
unused native packages (excluded with `expo.autolinking.android.exclude`).
