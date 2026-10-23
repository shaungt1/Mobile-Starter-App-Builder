#!/usr/bin/env node
import fs from "node:fs";

const app = JSON.parse(fs.readFileSync("app.json", "utf8")).expo;
const errors = [];
if (!app.name || !app.slug || !app.scheme) errors.push("Expo name, slug, and scheme are required.");
if (app.ios.bundleIdentifier !== app.android.package)
  errors.push("iOS and Android identifiers must match this starter convention.");
for (const [name, value] of Object.entries(process.env)) {
  if (
    name.startsWith("EXPO_PUBLIC_") &&
    /(SECRET|SERVICE_ROLE|PRIVATE_KEY)/iu.test(name) &&
    value
  ) {
    errors.push(`${name} looks like a server secret and must not be bundled in the app.`);
  }
}
if (
  process.env.EXPO_PUBLIC_ENV === "production" &&
  String(app.ios.bundleIdentifier).startsWith("com.example.")
) {
  errors.push("Replace the example bundle identifier before a production build.");
}
if (errors.length) {
  for (const error of errors) console.error(`config: ${error}`);
  process.exit(1);
}
console.log(`Config OK: ${app.name} (${app.ios.bundleIdentifier})`);
