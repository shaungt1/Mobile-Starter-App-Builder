# Quick start

> **Location.** This is the Expo section of Mobile Starter App Builder. Commands below run from this
> `_expo/` folder (`cd _expo`), or from the repository root as `bash start.sh expo <command>`. The
> quickest path is the guided root command `bash start.sh new --platform expo`.

Use Git Bash or WSL on Windows, or a normal Bash shell on macOS/Linux. Commands are run from this
playbook repository unless a step says otherwise.

## 1. Check the host

```bash
bash start.sh system
```

Git, Node.js 22.18+, and Bun are the core requirements. Android Studio/JDK are needed only for local
Android native builds; Xcode requires macOS; EAS can build in the cloud.

## 2A. Create a new independent application from the owned template

```bash
cp starter/project-plan.example.json ../my-app-plan.json
# Edit name, identifiers, theme, and intended capabilities.
bash start.sh create ../my-app --plan ../my-app-plan.json --install
```

This is the recommended path. It uses the generic, locally owned template under `starter/template`,
not a live upstream clone. The plan is copied into the generated app as its reproducible product contract.

## 2B. Bootstrap the preserved upstream template directly

```bash
bash start.sh bootstrap ../my-app \
  --name "My App" \
  --slug my-app \
  --bundle-id com.example.myapp
```

Optional flags:

```text
--scheme myapp                 URL/OAuth scheme; defaults to the slug
--template-url URL             Alternate template source
--template-ref REF             Branch, tag, or commit to clone
--skip-install                 Clone/configure only
--skip-verify                  Install without the verification gate
--skip-expo-fix                Do not align packages with Expo's current SDK patch set
--yes                          Confirm the target Git-history detachment non-interactively
```

The script accepts only a new or empty target directory. It records the template commit, preserves the
MIT license, removes only the newly cloned target's `.git`, initializes `main`, and does not add a
remote or commit on your behalf. It also preserves LF source endings on Windows so the template's
formatter produces the same result on every platform.

## 2C. Prepare an existing application

```bash
bash start.sh setup ../existing-app
bash start.sh configure ../existing-app \
  --name "My App" \
  --slug my-app \
  --scheme myapp \
  --bundle-id com.example.myapp
bash start.sh verify ../existing-app
```

Setup preserves an existing `.env`. If it is missing, setup copies `.env.example` to `.env`. Existing
apps are not dependency-mutated beyond their lockfile unless you pass `--fix-expo`.

## 3. Choose capabilities

```bash
bash start.sh capabilities list
bash start.sh capabilities show sqlite-drizzle
bash start.sh capabilities install sqlite-drizzle ../my-app --apply
```

`install` is a dry run unless `--apply` is present. Install one capability at a time, finish its config,
then run `bash start.sh verify ../my-app`. Native capabilities require a rebuilt development client.

Common choices:

- `ui-foundation`: NativeWind, gestures, animation, SVG, haptics, and safe areas.
- `supabase-auth`: Supabase client, secure session storage, and browser OAuth support.
- `sqlite-drizzle`: offline local SQLite with typed Drizzle access.
- `electric-sync`: planning checklist for ElectricSQL sync; intentionally manual because schema,
  Postgres shape permissions, and Electric service topology are application-specific.
- `payments`, `analytics`, `notifications`, `ble`, `iot-network`, `camera-vision`, `audio-speech`,
  `cloud-ai`, and `on-device-ai`: opt-in native/service stacks.

## 4. Configure environment values

Use the target's `.env.example` as the contract. Public client configuration uses `EXPO_PUBLIC_*`.
Those values are readable by anyone inspecting the application bundle.

```dotenv
EXPO_PUBLIC_ENV=development
EXPO_PUBLIC_SUPABASE_URL=
EXPO_PUBLIC_SUPABASE_ANON_KEY=
EXPO_PUBLIC_REVENUECAT_IOS_KEY=
EXPO_PUBLIC_REVENUECAT_ANDROID_KEY=
EXPO_PUBLIC_REVENUECAT_ENTITLEMENT=pro
EXPO_PUBLIC_POSTHOG_KEY=
EXPO_PUBLIC_POSTHOG_HOST=https://us.i.posthog.com
```

Keep OpenAI/Anthropic provider secrets and Supabase service-role keys on a server or edge function, not
in `.env` variables bundled into the app.

## 5. Run the app

```bash
bash start.sh run ../my-app web
bash start.sh run ../my-app go
bash start.sh run ../my-app go-tunnel
bash start.sh run ../my-app dev-client
```

- **Web:** fastest UI and browser-compatible API loop.
- **Expo Go:** standard Expo SDK modules only.
- **Development client:** custom native modules such as BLE, RevenueCat, Vision Camera, MMKV, or local
  AI. After adding/changing a native module, rebuild the client before testing.
- **Physical device:** required for realistic Bluetooth, camera, push, purchase, and on-device AI tests.

## 6. Verify and release

```bash
bash start.sh verify ../my-app
bash start.sh release ../my-app build preview android
bash start.sh release ../my-app build production all
bash start.sh release ../my-app update preview "Describe the compatible JS change"
bash start.sh release ../my-app submit ios
```

Release actions run available checks and ask for confirmation. OTA updates are only for JavaScript and
assets compatible with already-installed native runtimes; native dependency/config changes need a new
binary build.

## Manual setup (no automation)

```bash
git clone https://github.com/Simonstorms/expo-app-template.git ../my-app
cd ../my-app
git rev-parse HEAD                    # record this in NOTICE
rm -rf .git                           # only inside the new clone
git init
git branch -M main
cp .env.example .env
bun install --frozen-lockfile
bunx expo-doctor
bunx expo install --fix               # only when Doctor reports SDK version mismatches
bun run typecheck
bun run lint
bun run test:ci                       # if provided by package.json
```

Then edit `app.json`/`app.config.*`, `src/constants/brand.ts`, Supabase redirect settings, icons, legal
URLs, and EAS ownership/project IDs. Keep `LICENSE`, add `NOTICE`, create your own remote, and make the
first commit only after the clean baseline passes.

## Troubleshooting

- Duplicate/mismatched native dependencies: run `bunx expo-doctor`, then use `bunx expo install --fix`.
- Phone cannot reach Metro: use `go-tunnel` and ensure `@expo/ngrok` is installed.
- Native module unavailable in Expo Go/web: guard the import and use a development client.
- OAuth returns to the wrong app: align scheme + redirect URLs in Expo config, Supabase, and providers.
- EAS says the project is unlinked: run `bunx eas-cli login` and `bunx eas-cli init` in the target.
- Never “fix” an install by committing `node_modules`, `.env`, signing keys, or access tokens.
