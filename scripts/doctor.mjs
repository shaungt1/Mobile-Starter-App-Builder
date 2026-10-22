#!/usr/bin/env node
/**
 * Read-only machine report for one or both platforms. It runs the same check
 * script that every generated app carries, so the builder and the apps agree.
 *
 * Usage: node scripts/doctor.mjs [--platform expo|tauri|all]
 */
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const index = process.argv.indexOf("--platform");
const platform = index >= 0 ? process.argv[index + 1] : "all";
if (!["expo", "tauri", "all"].includes(platform)) {
  console.error("--platform must be expo, tauri or all");
  process.exit(2);
}
const checks = {
  expo: path.join(root, "_expo", "starter", "template", "scripts", "check-system.mjs"),
  tauri: path.join(root, "_tauri2", "template", "scripts", "check-system.mjs"),
};
let status = 0;
for (const name of platform === "all" ? ["expo", "tauri"] : [platform]) {
  const result = spawnSync(process.execPath, [checks[name]], { stdio: "inherit" });
  status ||= result.status ?? 1;
  console.log("");
}
console.log("Install anything marked MISSING with: bash start.sh install-prereqs   (Android SDK packages: bash start.sh android-setup)");
process.exit(status);
