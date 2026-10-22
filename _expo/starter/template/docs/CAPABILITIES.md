# Capability map

Core includes navigation, UI primitives, theming, forms-ready dependencies, secure storage, files,
document/image pickers, sharing, clipboard, camera, network state, notifications, SQLite/Drizzle,
Supabase auth adapters, RevenueCat adapters, and PostHog adapters. Service adapters do nothing until
configured; camera and file permissions must be requested in context.

Add these only when required:

| Need                                 | Preferred first step                             | Runtime/test requirement                       |
| ------------------------------------ | ------------------------------------------------ | ---------------------------------------------- |
| Motion/light/pressure/steps          | `expo-sensors`                                   | real device; sampling/battery test             |
| BLE                                  | `react-native-ble-plx`                           | development build + both physical platforms    |
| MQTT/TCP/UDP/discovery               | choose only the used transport                   | development build, TLS and local-network tests |
| Advanced camera frame processing/OCR | keep Expo Camera unless justified                | development build + real camera                |
| Audio/speech                         | choose recording, speech, or playback separately | microphone disclosure + interruption tests     |
| Local AI                             | benchmark one runtime/model first                | release build, RAM/thermal/storage tests       |
| Cloud AI                             | authenticated server proxy                       | no provider secret in the app                  |

## ElectricSQL

Electric is a supported architecture path, not a pinned default. The old `electric-sql/expo` guidance
is explicitly legacy, while the current Electric system has changed its client/deployment model. Before
installation, re-check current official docs and decide: read shapes, authenticated proxy, write path,
local materialization, conflicts, deletions, Postgres permissions, and service ownership. Keep the
`ItemRepository` interface so Electric can replace or feed the local adapter without changing screens.

The parent playbook's `config/capabilities.json` contains package candidates and completion checklists.
