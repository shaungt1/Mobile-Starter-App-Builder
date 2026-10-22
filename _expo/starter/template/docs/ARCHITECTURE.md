# Architecture

The app uses feature-oriented functional TypeScript with replaceable boundaries:

```text
route -> screen -> hook/controller -> repository/service interface -> adapter
                                      |-> SQLite + Drizzle (default)
                                      |-> Supabase / Electric / REST (optional)
                                      |-> BLE / camera / network adapter (optional)
```

Routes handle navigation only. Screens render state and dispatch intent. Hooks/controllers coordinate
queries and mutations. Repositories own persistence semantics. Provider SDKs stay in adapters so a
feature can be tested with an in-memory implementation and changed without rewriting UI.

SQLite is the offline source of truth by default. `app_records` is only a generic optional cloud sample;
replace it with domain tables early. If sync is added, document ownership, conflict rules, tombstones,
schema rollout order, offline writes, retry/backoff, and account deletion before choosing a vendor.

The `DeviceTransport` interface is the seam for BLE, sockets, MQTT, USB-like accessories, and mocks.
Do not expose raw SDK objects to screens.
