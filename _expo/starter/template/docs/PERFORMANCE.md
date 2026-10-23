# Performance and size playbook

How to measure bundle size and startup cost on an Expo SDK 57 / React Native 0.86 / Hermes app without
fooling yourself, and the findings that keep recurring on apps built from this template. It was written
for the upstream template and the first production app built from it (LUMNI), and was checked against
this template's files on 2026-10-23; statements about numbers come from those apps, not from this one.

This is a method, not a report. Every number you read anywhere, including here, is from some other app
on some other day. Re-measure on yours.

## Rule zero: measure the artifact you ship

Most size "wins" disappear under measurement because the tool you used reports a different number from
the one users download. Three traps, in order of how often they catch people.

### Expo Atlas reports pre-minification bytes

```bash
bun run analyze     # EXPO_ATLAS=1 expo export --platform ios
```

This writes `.expo/atlas.jsonl`. It is the right tool for **finding** which modules are in the bundle
graph and what pulled them in. It is the wrong tool for deciding how many bytes a deletion saves.

The ratio from graph bytes to shipped bytecode is not constant and is not per module. On a comparable
app the whole graph minified to roughly 45% of its Atlas size, and the Hermes bytecode came out around
1.5 times the minified bytes. But vendors that ship pre-minified `dist` files (RevenueCat, Supabase)
barely shrink at all, while hand-written TypeScript sources (Reanimated) shrink a lot. So
`atlas_kb * some_factor = bytecode_kb` is wrong for any individual module. Use Atlas to rank candidates,
then measure the bytecode change for each.

### Measure the `.hbc`, with the optimising flags on

```bash
bun run export:size
# EXPO_UNSTABLE_METRO_OPTIMIZE_GRAPH=1 EXPO_UNSTABLE_TREE_SHAKING=1 expo export --platform ios
```

Then measure the emitted Hermes bytecode:

```bash
find dist/_expo/static/js/ios -name '*.hbc' -exec ls -l {} +
du -sk dist
```

Record the number before your change, make exactly one change, export again, and compare. Anything else
is guessing. The two flags are worth having on for their own sake (they removed a couple of hundred KB
of bytecode on a comparable app with no code change), and they stack with dead-module deletions rather
than replacing them: tree shaking does not remove a module's strings from the bytecode string table, so
a module that is unreachable but still resolved still costs you.

### Never measure native size from `node_modules` or a Debug build

A pod's directory size in `node_modules`, and the size of a Debug `.xcarchive`, both overstate release
cost by a wide margin, and the Debug-to-Release ratio is not stable. If a finding says "this dependency
is 48 MB", that number came from a Debug archive and says nothing about the installable app.

To get a real number, build a Release archive (or `eas build --profile production`) and compare two
archives that differ only in the dependency you are questioning. Inspect `Assets.car` separately with
`assetutil --info`: oversized icon and splash source images are compiled once per appearance variant and
can quietly become the largest single item in the binary.

## `EXPO_USE_PRECOMPILED_MODULES`

Expo can ship precompiled React Native modules instead of compiling them from source. The trade-off:

- **On** (the default): much faster native builds, because about 40 pods are not compiled. The modules
  arrive as dynamic frameworks, which cannot be dead-stripped, and that added roughly 12 MB to a
  comparable app's install size.
- **Off** (`EXPO_USE_PRECOMPILED_MODULES=0`): a slow from-source build and a smaller binary.

`eas.json` in this template sets it to `"0"` on the `preview` and `production` profiles only. The
`development` and `development-device` profiles leave it at the default, because a full from-source
compile on every development-client build buys a development build nothing. If you change this, keep
that split: release profiles off, development profiles untouched.

## Excluding unused transitive native modules from autolinking

Native modules autolink transitively. A dependency of a dependency can pull in a pod or a framework you
never call from JavaScript. The lever is an autolinking exclude in `package.json`:

```json
"expo": {
  "autolinking": {
    "apple": { "exclude": ["@some-org/some-unused-module"] },
    "android": { "exclude": ["@some-org/some-other-module"] }
  }
}
```

This template ships no excludes for size, because nothing in it has been proven dead on a Release
archive. (The same key is also the fix when an unused package's Android code breaks the Gradle build; see
`docs/LESSONS_LEARNED.md` in the builder repository.) How to qualify a candidate honestly:

1. Confirm no module from it appears in the production sourcemap or the Atlas graph.
2. Confirm every JavaScript reference to it is platform-gated to a platform you do not ship, or sits in a
   function body that is never reached.
3. Exclude it, rebuild, and confirm the app still launches and any feature that depends on it still works.
4. Measure a Release archive before and after.

Do **not** exclude `@expo/dom-webview`. It renders the development client's error overlay through
`@expo/log-box`. Excluding it looks like a free win in an archive listing and costs you the error overlay
in development.

## `react-native-purchases-ui`: what it weighs versus what it buys

`react-native-purchases-ui` is a large native dependency, separate from `react-native-purchases`, which
processes purchases and owns entitlements. Removing the UI package does not touch purchasing. In this
template it is used by `src/lib/revenuecat-ui.ts` (and its `.web.ts` sibling), which the Settings screen
uses for the Customer Center row. If you do not need the Customer Center, the dependency can go;
replacements for that row, in order of preference:

- `Purchases.showManageSubscriptions()` from `react-native-purchases`
- `Linking.openURL('https://apps.apple.com/account/subscriptions')`

If you drop the package, replace both `src/lib/revenuecat-ui.ts` and `src/lib/revenuecat-ui.web.ts`. The
payments feature switch (`bash start.sh feature`, see `docs/FEATURES.md`) removes the whole purchasing
stack at once when the app has no paywall. Measure a Release archive before believing any MB figure you
read about this package; the widely quoted numbers come from Debug archives.

## React Compiler bails out silently

`app.json` sets `experiments.reactCompiler: true`, so components are memoized automatically. The compiler
skips any component it cannot compile **without failing the build**, and the most common cause is a
`try { ... } finally { ... }` in the component body. On a comparable app that silently left the two
hottest screens with zero memo slots while every other screen got over a hundred.

- Detection without a rebuild: run `babel-plugin-react-compiler` over `src/` and look for bailouts, or
  search for `finally` (`grep -rn finally src/`) and check whether each one sits in a component body
  rather than in an event handler or a plain function. This template currently has one, in
  `src/features/auth/screens/sign-in-screen.tsx`; confirm whether it is in a handler before assuming it
  is a problem (UNVERIFIED here).
- Prevention: `oxlint.config.mjs` in this template turns the React Compiler lint rules on
  (`react-hooks-js/*` at error level), which report these bailouts. Keep them on.
- The fix is to hoist the `try`/`catch`/`finally` out of the component body into a plain async function
  or a hook, not to delete the `finally`.
- Sequencing warning: fixing a bailout memoizes that screen for the first time, which is exactly when
  latent Rules-of-React violations surface as stale UI. Review the screen's ref mutations and async reads
  in the same change.

## Reanimated rules

Two rules cover most animation problems in practice.

**Never call an animation function inside a reactive worklet.** A `useAnimatedStyle` worklet re-evaluates
whenever any of its dependencies change, and a `withTiming` inside it restarts from the current value
each time instead of continuing. It looks correct when the dependency is a boolean that flips once per
animation, and breaks the moment the dependency changes continuously (a slider fraction, a keyboard
offset, a scroll position). Drive a shared value from a callback and read it plainly in the style:

```ts
const progress = useSharedValue(0);
const onToggle = () => {
  progress.set(withTiming(done ? 1 : 0, timing));
};
const style = useAnimatedStyle(() => ({ opacity: progress.get() }));
```

To find offenders, search for `withTiming` and `withSpring` in `src/` and check whether each call is
inside a `useAnimatedStyle` body (the files that use them today are `src/components/ui/accordion.tsx`,
`pressable-scale.tsx`, `progress.tsx` and `selection-row.tsx`; UNVERIFIED which, if any, inline it).

**Animate transforms and opacity, not layout.** Animating `width`, `height`, `margin` or `padding` runs a
full layout pass plus a mount-instruction diff every frame. Use `scaleX`/`scaleY` and `translate`
instead, and pair a progress-bar animation with a single `setTimeout` for the completion callback rather
than a once-per-second interval that re-renders text nobody is looking at. Long-running animations are
the worst offenders: a bar that animates `width` for the duration of a multi-minute timer costs orders of
magnitude more than any mount animation.

## Recurring findings worth checking on your app

Cheap, independent, and each one has bitten a real build.

- **Splash and icon source images.** iOS decodes the splash image during the native launch phase, before
  any JavaScript runs, so an oversized source is first on the time-to-interactive path. Generate it near
  the rendered size (`imageWidth` in the `expo-splash-screen` plugin options in `app.json` is 76 here).
  The app icon source is compiled once per appearance variant, so one unoptimised 1024x1024 PNG can
  become several MB of `Assets.car`.
- **Images and fonts dominate download size** on an app of this size, well ahead of JavaScript. Convert
  large PNGs to WebP and resize anything whose pixel dimensions exceed its rendered size by more than 2x.
  If you add a custom font family, import the specific weights, never the package barrel: a Google Fonts
  barrel requires every weight it ships and you probably use four. Be careful with font subsetting: a
  Latin-only subset renders missing-glyph boxes as soon as non-Latin text reaches that `Text`, and
  Apple's own fonts have licence terms that restrict modification.
- **First-run delays.** Deliberate splash dwell timers belong on the first run only. If you restore the
  onboarding funnel (`bash start.sh feature add funnel`), check that its splash delay is scoped that way
  and that the cost is a product decision rather than an accident.
- **Session and entitlement queries gate the first paint.** Everything that decides where a returning
  user lands reads `useSession` and `useEntitlement`, so a missing `gcTime` or `initialData` shows up as
  a blank frame. Both hooks (`src/features/auth/hooks/use-session.ts`,
  `src/features/paywall/hooks/use-entitlement.ts`) set `gcTime: Infinity`. Keep it that way.
- **Prefer `getSession()` over `getUser()`** anywhere you only need to know who is signed in.
  `getUser()` is a network round trip; `getSession()` is local. A background sweep that calls `getUser()`
  per item becomes a round trip per item.
- **`retry: 2` is the default** in `src/lib/query-client.ts`. Set `retry: false` on any query whose
  failure is permanent rather than transient, for example a remote lookup for a resource that does not
  exist.
- **Shadows without an opaque background** make iOS render an offscreen alpha mask, a classic UI-thread
  stutter in a scrolling list. Give shadowed surfaces an opaque `backgroundColor` and set `borderCurve`.
- **Batch your writes.** A stepper or slider that persists to storage on every tick writes dozens of
  times per editing session. Debounce, or flush once on teardown, and remember that swipe-back is an exit
  path too.
- **Analytics starts before your root layout.** `new PostHog(...)` runs at module scope in
  `src/lib/analytics.tsx`, so remote config and replay start before the first render. That is why
  `preloadFeatureFlags` is `false` there; turning it on adds two network requests and a storage write to
  every launch, and is only worth it if you read a flag.
- **Blur is not free on scroll paths.** `src/components/ui/glass.tsx` uses the platform glass effect when
  it is available. Do not stack blurred surfaces inside a scrolling list without profiling.
- **Route layouts are evaluated eagerly.** Expo Router does not eagerly evaluate route screens in
  production, but it does evaluate `_layout.tsx` modules, and `src/app/(tabs)/_layout.tsx` imports the
  session and entitlement hooks. Supabase and RevenueCat are therefore on the pre-first-paint path no
  matter how you arrange the service hooks in the root layout.
- **Things that are already right, so do not "fix" them.** `staleTime: 30_000` in the query client, the
  `AppState` gate on Supabase auth refresh in `src/lib/supabase.ts`, `<ReducedMotionConfig>` in the root
  layout, native navigation with no JavaScript navigator, and no barrel exports in `src/`.

## Things not worth doing

- **Code splitting, `React.lazy`, Re.Pack.** Counterproductive with Hermes, which already memory-maps the
  bytecode.
- **Adding an image library for local assets.** A fixed-size `require()`d asset gains nothing from one,
  and you pay megabytes of native framework. For remote images, `Image.prefetch` covers the case without
  a new dependency.
- **Removing `react-dom` and `react-native-web`.** The web target is live here and neither package
  carries a native pod.
- **Micro-optimising bounded lists.** Virtualisation earns nothing over a `.map()` across a handful of
  items. Spend the effort on animation and image work instead.

## Regression gates worth adding to CI

The template's workflow (`.github/workflows/ci.yml`) runs type checking, lint and the format check on
Bun. The template deliberately ships the **measurement** scripts (`bun run analyze`,
`bun run export:size`) and **no hard size gate**, because a byte budget that is not tuned to a specific
app is either meaningless or a daily false alarm. Add gates once you have your own baseline:

- A job that runs `bun run export:size`, records the `.hbc` byte count and total `dist` size, and
  comments the change on the pull request. Report first, fail later, once you know the normal noise.
- A budget check that fails only on a large jump (for example more than 3% bytecode growth in one pull
  request), not on every increase.
- Runtime budgets, once you have numbers from the oldest device you support: cold start to first render,
  navigation 95th percentile, and no memory drift across repeated runs of your core loop.
