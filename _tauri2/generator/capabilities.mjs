#!/usr/bin/env node
/**
 * Lists, shows and installs Tauri 2 mobile capabilities from _tauri2/config/capabilities.json.
 *
 * Usage:
 *   node _tauri2/generator/capabilities.mjs list
 *   node _tauri2/generator/capabilities.mjs show ID
 *   node _tauri2/generator/capabilities.mjs install ID APP_FOLDER [--no-install]
 *
 * Installing edits the app deterministically instead of running `tauri add`,
 * because `tauri add` registers mobile-only plugins without a #[cfg(mobile)]
 * guard, which breaks the desktop preview build. For each capability it:
 *   1. adds the Rust crate to src-tauri/Cargo.toml (mobile-only crates under the mobile target),
 *   2. adds the npm package(s) to package.json,
 *   3. registers the plugin in src-tauri/src/lib.rs at the marker comments,
 *   4. grants the listed permissions in a capability file (mobile.json for mobile-only),
 *   5. adds iOS usage descriptions to src-tauri/Info.ios.plist,
 *   6. records the id in PROJECT_PLAN.json,
 * then runs `bun install` unless --no-install is given. Running it twice is safe.
 */
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const tauriDir = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const catalog = JSON.parse(fs.readFileSync(path.join(tauriDir, "config", "capabilities.json"), "utf8")).capabilities;
const MOBILE_TARGET = `[target.'cfg(any(target_os = "android", target_os = "ios"))'.dependencies]`;
const RUST_MARKER = "# Mobile plugins added with";
const PLUGIN_MARKER = "// @capability-plugins";
const MOBILE_MARKER = "// @capability-mobile-setup";

export function findCapability(id) {
  const capability = catalog.find((entry) => entry.id === id);
  if (!capability) throw new Error(`Unknown capability '${id}'. Run: bash start.sh tauri capability list`);
  return capability;
}

const readJson = (file) => JSON.parse(fs.readFileSync(file, "utf8"));
const writeJson = (file, value) => fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`);
const splitSpec = (spec) => {
  const at = spec.lastIndexOf("@");
  return at > 0 ? [spec.slice(0, at), spec.slice(at + 1)] : [spec, "latest"];
};

function addCrate(root, capability) {
  const file = path.join(root, "src-tauri", "Cargo.toml");
  let toml = fs.readFileSync(file, "utf8");
  if (new RegExp(`^${capability.crate}\\s*=`, "mu").test(toml)) return false;
  const line = capability.crateFeatures?.length
    ? `${capability.crate} = { version = "2", features = [${capability.crateFeatures.map((f) => `"${f}"`).join(", ")}] }`
    : `${capability.crate} = "2"`;
  if (capability.scope === "mobile") {
    if (!toml.includes(MOBILE_TARGET)) {
      toml = toml.replace("\n# Smaller, faster release binaries", `\n${MOBILE_TARGET}\n\n# Smaller, faster release binaries`);
    }
    toml = toml.replace(MOBILE_TARGET, `${MOBILE_TARGET}\n${line}`);
  } else {
    const markerLine = toml.split("\n").find((entry) => entry.startsWith(RUST_MARKER));
    if (!markerLine) throw new Error(`Cargo.toml is missing the line starting with "${RUST_MARKER}".`);
    toml = toml.replace(markerLine, `${line}\n${markerLine}`);
  }
  fs.writeFileSync(file, toml);
  return true;
}

function registerPlugin(root, capability) {
  const file = path.join(root, "src-tauri", "src", "lib.rs");
  let rust = fs.readFileSync(file, "utf8");
  const crateIdent = capability.crate.replaceAll("-", "_");
  if (rust.includes(`${crateIdent}::`)) return false;
  const marker = capability.scope === "mobile" ? MOBILE_MARKER : PLUGIN_MARKER;
  const index = rust.indexOf(marker);
  if (index < 0) throw new Error(`lib.rs is missing the "${marker}" marker comment.`);
  const lineStart = rust.lastIndexOf("\n", index) + 1;
  const indent = rust.slice(lineStart, index);
  const insertion =
    capability.scope === "mobile"
      ? `${indent}#[cfg(mobile)]\n${indent}app.handle().plugin(${capability.register})?;\n`
      : `${indent}.plugin(${capability.register})\n`;
  rust = `${rust.slice(0, lineStart)}${insertion}${rust.slice(lineStart)}`;
  fs.writeFileSync(file, rust);
  return true;
}

function grantPermissions(root, capability) {
  if (!capability.permissions.length) return false;
  const mobile = capability.scope === "mobile";
  const file = path.join(root, "src-tauri", "capabilities", mobile ? "mobile.json" : "default.json");
  const document = fs.existsSync(file)
    ? readJson(file)
    : {
        $schema: "../gen/schemas/mobile-schema.json",
        identifier: "mobile",
        description: "Permissions for plugins that exist only on Android and iOS.",
        windows: ["main"],
        platforms: ["iOS", "android"],
        permissions: [],
      };
  const key = (permission) => (typeof permission === "string" ? permission : permission.identifier);
  const have = new Set(document.permissions.map(key));
  let changed = false;
  for (const permission of capability.permissions) {
    if (!have.has(key(permission))) {
      document.permissions.push(permission);
      changed = true;
    }
  }
  if (changed) writeJson(file, document);
  return changed;
}

const escapeXml = (text) => text.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");

function addPlistKeys(root, capability) {
  const entries = Object.entries(capability.iosPlist ?? {});
  if (!entries.length) return false;
  const file = path.join(root, "src-tauri", "Info.ios.plist");
  let plist = fs.existsSync(file)
    ? fs.readFileSync(file, "utf8")
    : '<?xml version="1.0" encoding="UTF-8"?>\n<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">\n<plist version="1.0">\n<dict>\n</dict>\n</plist>\n';
  let changed = false;
  for (const [key, value] of entries) {
    if (plist.includes(`<key>${key}</key>`)) continue;
    plist = plist.replace("</dict>", `  <key>${key}</key>\n  <string>${escapeXml(value)}</string>\n</dict>`);
    changed = true;
  }
  if (changed) fs.writeFileSync(file, plist);
  return changed;
}

function addNpm(root, capability) {
  const file = path.join(root, "package.json");
  const manifest = readJson(file);
  let changed = false;
  for (const spec of [capability.npm, ...(capability.npmPeers ?? [])].filter(Boolean)) {
    const [name, range] = splitSpec(spec);
    if (!manifest.dependencies[name]) {
      manifest.dependencies[name] = range;
      changed = true;
    }
  }
  if (changed) {
    manifest.dependencies = Object.fromEntries(Object.entries(manifest.dependencies).sort());
    writeJson(file, manifest);
  }
  return changed;
}

function recordInPlan(root, id) {
  const file = path.join(root, "PROJECT_PLAN.json");
  if (!fs.existsSync(file)) return;
  const plan = readJson(file);
  plan.capabilities = [...new Set([...(plan.capabilities ?? []), id])];
  writeJson(file, plan);
}

/** Installs one capability into a generated app. Returns notes describing what changed. */
export function installCapability(root, id, { quiet = false } = {}) {
  const capability = findCapability(id);
  const app = path.resolve(root);
  if (!fs.existsSync(path.join(app, "src-tauri", "tauri.conf.json"))) {
    throw new Error(`${app} is not a Tauri app generated by this builder (src-tauri/tauri.conf.json is missing).`);
  }
  const changes = [];
  if (capability.crate && addCrate(app, capability)) changes.push(`Cargo.toml: ${capability.crate}${capability.scope === "mobile" ? " (mobile target)" : ""}`);
  if (addNpm(app, capability)) changes.push(`package.json: ${capability.npm}${capability.npmPeers ? ` (+${capability.npmPeers.length} peers)` : ""}`);
  if (capability.register && registerPlugin(app, capability)) changes.push(`lib.rs: registered ${capability.register}${capability.scope === "mobile" ? " under #[cfg(mobile)]" : ""}`);
  if (grantPermissions(app, capability)) changes.push(`capabilities/${capability.scope === "mobile" ? "mobile" : "default"}.json: granted ${capability.permissions.length} permission(s)`);
  if (addPlistKeys(app, capability)) changes.push(`Info.ios.plist: ${Object.keys(capability.iosPlist).join(", ")} (edit the wording for your app)`);
  recordInPlan(app, id);
  const notes = [`${id}: ${changes.length ? changes.join("; ") : "already installed"}`, ...capability.notes.map((note) => `${id}: ${note}`)];
  if (!quiet) for (const note of notes) console.log(`  - ${note}`);
  return notes;
}

function printCapability(capability) {
  console.log(`${capability.id}: ${capability.name}`);
  console.log(`  Platforms: ${capability.scope === "mobile" ? "Android and iOS only" : capability.scope === "ui" ? "interface library (all)" : "all (desktop preview, Android, iOS)"}`);
  if (capability.crate) console.log(`  Rust crate: ${capability.crate}${capability.crateFeatures ? ` (features: ${capability.crateFeatures.join(", ")})` : ""}`);
  console.log(`  npm: ${[capability.npm, ...(capability.npmPeers ?? [])].join(", ")}`);
  if (capability.register) console.log(`  Registration: ${capability.register}`);
  if (capability.permissions.length) console.log(`  Permissions: ${capability.permissions.map((p) => (typeof p === "string" ? p : p.identifier)).join(", ")}`);
  if (Object.keys(capability.iosPlist ?? {}).length) console.log(`  iOS Info.plist: ${Object.keys(capability.iosPlist).join(", ")}`);
  for (const note of capability.notes) console.log(`  Note: ${note}`);
}

function main() {
  const [command = "list", id, target, ...flags] = process.argv.slice(2);
  if (command === "list") {
    console.log("Capability        Platforms  Name");
    console.log("----------------- ---------- ----------------------------------------------");
    for (const capability of catalog) console.log(`${capability.id.padEnd(17)} ${capability.scope.padEnd(10)} ${capability.name}`);
    return;
  }
  if (command === "show" && id) return printCapability(findCapability(id));
  if (command === "install" && id && target) {
    installCapability(target, id);
    if (!flags.includes("--no-install")) {
      const result = spawnSync("bun", ["install"], { cwd: path.resolve(target), stdio: "inherit", shell: process.platform === "win32" });
      if (result.status !== 0) process.exit(result.status ?? 1);
    }
    console.log("Next: run 'bash start.sh verify' in the app, then test the feature on a device (mobile plugins do nothing in the desktop preview).");
    return;
  }
  console.error("Usage: capabilities.mjs list | show ID | install ID APP_FOLDER [--no-install]");
  process.exit(2);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
