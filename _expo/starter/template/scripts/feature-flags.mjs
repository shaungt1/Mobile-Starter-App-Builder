#!/usr/bin/env node
/**
 * Turns built-in features on or off in src/constants/features.ts (code and packages stay).
 * Usage: node scripts/feature-flags.mjs [list] | on <id> | off <id>
 * Removing a feature's code and native packages is done from the builder:
 *   bash start.sh expo feature remove <id> <app folder>     (see docs/FEATURES.md)
 */
import fs from "node:fs";

const file = "src/constants/features.ts";
const source = fs.readFileSync(file, "utf8");
const flags = Object.fromEntries(
  [...source.matchAll(/^\s{2}(\w+):\s*(true|false),$/gmu)].map((m) => [m[1], m[2] === "true"]),
);
const [command = "list", id] = process.argv.slice(2);

if (command === "list") {
  for (const [name, on] of Object.entries(flags))
    console.log(`${name.padEnd(14)} ${on ? "on" : "off"}`);
  process.exit(0);
}
if (!["on", "off"].includes(command) || !id) {
  console.error("Usage: bash start.sh feature [list] | on <id> | off <id>");
  process.exit(2);
}
if (!(id in flags)) {
  console.error(`Unknown feature '${id}'. Known: ${Object.keys(flags).join(", ")}`);
  process.exit(2);
}
fs.writeFileSync(
  file,
  source.replace(new RegExp(`^(\\s{2}${id}:\\s*)(true|false),$`, "mu"), `$1${command === "on"},`),
);
console.log(`${id} is now ${command}. Reload the app (no native rebuild needed).`);
