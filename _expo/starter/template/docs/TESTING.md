# Testing and release gates

1. `bash start.sh verify` must pass on a clean install.
2. Launch web for UI/API compatibility, then Expo Go only for supported modules.
3. Build a development client after any native dependency or config-plugin change.
4. Test auth redirects, sign-out, account deletion, purchase/restore, notifications, denied permissions,
   offline/reconnect, and deep links on physical devices where enabled.
5. Run `bunx supabase test db` with the local Supabase stack when cloud schema changes.
6. Validate production environment variables and privacy/store declarations before an EAS build.
7. Run a release build on representative hardware; development mode is not performance evidence.

Android local builds require a JDK and Android SDK. iOS local builds require macOS/Xcode. EAS can cover
unavailable build hosts, but store submission and public OTA updates remain explicit external actions.
