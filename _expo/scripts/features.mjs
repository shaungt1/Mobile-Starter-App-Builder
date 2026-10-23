#!/usr/bin/env node
/**
 * Switch, remove or add features of an app generated from the owned Expo template.
 *
 * Usage (from the builder root):
 *   bash start.sh expo feature list
 *   bash start.sh expo feature status APP
 *   bash start.sh expo feature off|on ID APP             flag only; code and packages stay
 *   bash start.sh expo feature remove ID APP [--force] [--no-install]
 *   bash start.sh expo feature add ID APP [--force] [--no-install]
 *
 * "remove" replaces a feature's entry files with stubs that keep the same exported names (so no
 * other file needs editing), deletes its implementation files, uninstalls its packages when no
 * remaining code imports them, removes their config plugins, its app.json keys, .env.example lines
 * and CI job, and turns its flag off. "add" reverses that from this builder's template. "add funnel"
 * restores the upstream onboarding flow and full paywall.
 *
 * Safety: a file is overwritten or deleted only when it still matches the version this tool (or the
 * template) wrote, so edits made by people are never lost; otherwise the command stops and lists
 * the files (--force overrides). Every change is recorded in APP/.mobile-builder/features.json.
 */
import { spawnSync } from "node:child_process";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const expoDir = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const templateDir = path.join(expoDir, "starter", "template");
const featuresDir = path.join(expoDir, "features");
const manifest = JSON.parse(fs.readFileSync(path.join(featuresDir, "features.json"), "utf8")).features;

const readJson = (file) => JSON.parse(fs.readFileSync(file, "utf8"));
const exists = (file) => fs.existsSync(file);
const sha = (file) => (exists(file) && fs.statSync(file).isFile() ? crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex") : null);

/** JSON in the layout the app's formatter uses: short arrays of strings on one line (100 columns). */
function writeJson(file, value) {
  const text = JSON.stringify(value, null, 2).replace(
    /^( *)("[^"\n]*": )?\[\n((?: *"[^"\n]*",?\n)+) *\]/gmu,
    (match, indent, key = "", items) => {
      const inline = `${indent}${key}[${items.trim().split(/,\n\s*/u).join(", ")}]`;
      return inline.length <= 100 ? inline : match;
    },
  );
  fs.writeFileSync(file, `${text}\n`);
}

/** Relative paths use "/" on every OS so the state file works when an app moves between Windows and macOS. */
function filesUnder(root, relative) {
  const full = path.join(root, relative);
  if (!exists(full)) return [];
  if (fs.statSync(full).isFile()) return [relative];
  return fs.readdirSync(full).flatMap((entry) => filesUnder(root, path.posix.join(relative, entry)));
}

export function findFeature(id) {
  const feature = manifest.find((entry) => entry.id === id);
  if (!feature) throw new Error(`Unknown feature '${id}'. Run: bash start.sh expo feature list`);
  return feature;
}

function statePath(app) {
  return path.join(app, ".mobile-builder", "features.json");
}
function readState(app) {
  return exists(statePath(app)) ? readJson(statePath(app)) : { removed: {}, added: {} };
}
function writeState(app, state) {
  fs.mkdirSync(path.dirname(statePath(app)), { recursive: true });
  writeJson(statePath(app), state);
}

/** Packages imported anywhere in the app's code and config files. */
function importedPackages(app) {
  const used = new Set();
  const scan = (relative) => {
    for (const file of filesUnder(app, relative)) {
      if (!/\.(ts|tsx|js|mjs|cjs|mts)$/u.test(file)) continue;
      const text = fs.readFileSync(path.join(app, file), "utf8");
      for (const match of text.matchAll(/(?:from\s+|import\s*\(?\s*|require\(\s*)["']([^"'.][^"']*)["']/gu)) {
        const parts = match[1].split("/");
        used.add(match[1].startsWith("@") ? parts.slice(0, 2).join("/") : parts[0]);
      }
    }
  };
  for (const entry of ["src", "plugins", "scripts", "tests", "babel.config.js", "metro.config.js", "tailwind.config.js", "drizzle.config.ts"]) scan(entry);
  return used;
}

function getPath(object, dotted) {
  return dotted.split(".").reduce((node, key) => node?.[key], object);
}
function setPath(object, dotted, value) {
  const keys = dotted.split(".");
  const last = keys.pop();
  const parent = keys.reduce((node, key) => (node[key] ??= {}), object);
  if (value === undefined) delete parent[last];
  else parent[last] = value;
}

const pluginName = (entry) => (Array.isArray(entry) ? entry[0] : entry);

function removePackages(app, candidates) {
  const used = importedPackages(app);
  const manifestFile = path.join(app, "package.json");
  const pkg = readJson(manifestFile);
  const removed = [];
  for (const name of candidates) {
    if (used.has(name)) continue;
    for (const section of ["dependencies", "devDependencies"]) {
      if (pkg[section]?.[name]) {
        delete pkg[section][name];
        removed.push(name);
      }
    }
  }
  if (removed.length) {
    writeJson(manifestFile, pkg);
    const appFile = path.join(app, "app.json");
    const appJson = readJson(appFile);
    appJson.expo.plugins = (appJson.expo.plugins ?? []).filter((entry) => !removed.includes(pluginName(entry)));
    writeJson(appFile, appJson);
  }
  return removed;
}

function addPackages(app, versions) {
  const manifestFile = path.join(app, "package.json");
  const pkg = readJson(manifestFile);
  const template = readJson(path.join(templateDir, "package.json"));
  const added = [];
  for (const [name, explicit] of Object.entries(versions)) {
    const dev = Boolean(template.devDependencies?.[name]);
    const version = explicit ?? template.dependencies?.[name] ?? template.devDependencies?.[name];
    if (!version) continue;
    const section = dev ? "devDependencies" : "dependencies";
    if (!pkg[section]?.[name]) {
      pkg[section] = Object.fromEntries(Object.entries({ ...pkg[section], [name]: version }).sort());
      added.push(name);
    }
  }
  writeJson(manifestFile, pkg);
  // Put back the config plugins the template declares for these packages, at the template's position.
  const appFile = path.join(app, "app.json");
  const appJson = readJson(appFile);
  const templatePlugins = readJson(path.join(templateDir, "app.json")).expo.plugins ?? [];
  const plugins = appJson.expo.plugins ?? [];
  for (const [index, entry] of templatePlugins.entries()) {
    if (!added.includes(pluginName(entry)) || plugins.some((existing) => pluginName(existing) === pluginName(entry))) continue;
    const before = templatePlugins.slice(0, index).map(pluginName);
    const anchor = plugins.findLastIndex((existing) => before.includes(pluginName(existing)));
    plugins.splice(anchor + 1, 0, entry);
  }
  appJson.expo.plugins = plugins;
  writeJson(appFile, appJson);
  return added;
}

/** Removes or restores KEY= lines in .env.example; restored lines go back to the template's position. Returns the lines removed. */
function editEnvExample(app, names, restore) {
  const file = path.join(app, ".env.example");
  if (!exists(file) || !names?.length) return [];
  const isName = (line, list) => list.some((name) => line.startsWith(`${name}=`) || line === name);
  const keyOf = (line) => line.split("=")[0];
  const current = fs.readFileSync(file, "utf8").split("\n");
  let lines;
  let removed = [];
  if (restore) {
    // names may be the recorded removed lines (KEY=value) or bare names.
    const restoreLines = new Map(names.map((entry) => [keyOf(entry), entry.includes("=") ? entry : null]));
    const present = new Map(current.filter((line) => line.includes("=")).map((line) => [keyOf(line), line]));
    const templateLines = fs.readFileSync(path.join(templateDir, ".env.example"), "utf8").split("\n");
    lines = templateLines
      .map((line) => {
        if (!line.includes("=") || line.startsWith("#")) return line;
        const key = keyOf(line);
        if (present.has(key)) return present.get(key);
        if (restoreLines.has(key)) return restoreLines.get(key) ?? line;
        return null;
      })
      .filter((line) => line !== null);
    const known = new Set(templateLines.filter((line) => line.includes("=")).map(keyOf));
    const extra = current.filter((line) => line.includes("=") && !line.startsWith("#") && !known.has(keyOf(line)));
    if (extra.length) lines.push("", ...extra);
  } else {
    removed = current.filter((line) => isName(line, names));
    lines = current.filter((line) => !isName(line, names));
  }
  const text = lines.join("\n").replace(/^\n+/u, "").replace(/\n{3,}/gu, "\n\n").replace(/\n*$/u, "");
  fs.writeFileSync(file, `${text}\n`);
  return removed;
}

function ciJobBlock(text, job) {
  const lines = text.split("\n");
  const start = lines.findIndex((line) => line === `  ${job}:`);
  if (start < 0) return null;
  let end = start + 1;
  while (end < lines.length && !/^ {2}\S/u.test(lines[end]) && !/^\S/u.test(lines[end])) end += 1;
  return { start, end, block: lines.slice(start, end) };
}

function editCi(app, jobs, restore) {
  const file = path.join(app, ".github", "workflows", "ci.yml");
  if (!exists(file) || !jobs?.length) return;
  let text = fs.readFileSync(file, "utf8");
  for (const job of jobs) {
    const current = ciJobBlock(text, job);
    if (restore && !current) {
      const template = ciJobBlock(fs.readFileSync(path.join(templateDir, ".github", "workflows", "ci.yml"), "utf8"), job);
      if (template) text = `${text.replace(/\n*$/u, "")}\n\n${template.block.join("\n").replace(/\n*$/u, "")}\n`;
    } else if (!restore && current) {
      const lines = text.split("\n");
      lines.splice(current.start, current.end - current.start);
      text = `${lines.join("\n").replace(/\n{3,}/gu, "\n\n").replace(/\n*$/u, "")}\n`;
    }
  }
  fs.writeFileSync(file, text);
}

/** Keeps knip.json consistent with the files and packages that exist. */
function syncKnip(app) {
  const file = path.join(app, "knip.json");
  if (!exists(file)) return;
  const knip = readJson(file);
  const template = readJson(path.join(templateDir, "knip.json"));
  const pkg = readJson(path.join(app, "package.json"));
  const installed = new Set([...Object.keys(pkg.dependencies ?? {}), ...Object.keys(pkg.devDependencies ?? {})]);
  const isGlob = (entry) => /[*{]/u.test(entry);
  // Template order first, so removing and adding a feature back leaves the file unchanged.
  const entries = new Set([...(template.entry ?? []), ...(knip.entry ?? [])]);
  knip.entry = [...entries].filter((entry) => isGlob(entry) || exists(path.join(app, entry)));
  const ignores = new Set([...(template.ignoreDependencies ?? []), ...(knip.ignoreDependencies ?? [])]);
  knip.ignoreDependencies = [...ignores].filter((name) => installed.has(name));
  writeJson(file, knip);
}

function setFlag(app, flag, value) {
  const file = path.join(app, "src", "constants", "features.ts");
  if (!flag || !exists(file)) return;
  const text = fs.readFileSync(file, "utf8");
  fs.writeFileSync(file, text.replace(new RegExp(`^(\\s{2}${flag}:\\s*)(true|false),$`, "mu"), `$1${value},`));
}

function applyPlanName(app) {
  const planFile = path.join(app, "PROJECT_PLAN.json");
  const brandFile = path.join(app, "src", "constants", "brand.ts");
  if (!exists(planFile) || !exists(brandFile)) return;
  const name = readJson(planFile).name;
  if (!name) return;
  const brand = fs
    .readFileSync(brandFile, "utf8")
    .replace(/appName:\s*(["'])[^"']*\1/u, `appName: ${JSON.stringify(name)}`)
    .replace(/wordmark:\s*(["'])[^"']*\1/u, `wordmark: ${JSON.stringify(name)}`)
    .replace(/proName:\s*(["'])[^"']*\1/u, `proName: ${JSON.stringify(`${name} Pro`)}`);
  fs.writeFileSync(brandFile, brand);
}

function finish(app, { install }) {
  syncKnip(app);
  if (install && exists(path.join(app, "node_modules"))) {
    const run = (command, args) => spawnSync(command, args, { cwd: app, stdio: "inherit", shell: process.platform === "win32" });
    const result = run("bun", ["install"]);
    if (result.status !== 0) throw new Error("bun install failed; fix the error above, then run bun install in the app.");
    run("bunx", ["oxfmt", "package.json", "app.json", "knip.json"]);
  } else {
    fs.mkdirSync(path.join(app, ".mobile-builder"), { recursive: true });
    fs.writeFileSync(path.join(app, ".mobile-builder", "lock-stale"), "Dependencies changed; scripts/setup.sh runs bun install once.\n");
  }
}

/** Recorded for an app.json setting that did not exist before removal (JSON cannot store undefined). */
const ABSENT = "$absent";

/** Where a removed feature's original files are kept (".bak" so no tool parses them). */
const backupPath = (app, id, file) => path.join(app, ".mobile-builder", "removed", id, `${file}.bak`);

export function removeFeature(appArg, id, { force = false, install = true } = {}) {
  const app = path.resolve(appArg);
  const feature = findFeature(id);
  const state = readState(app);
  if (feature.kind === "restorable") return removeRestorable(app, feature, state, { force, install });
  if (state.removed[id]) throw new Error(`${id} is already removed.`);
  const blockers = Object.keys(state.added).filter((added) => findFeature(added).requires?.includes(id));
  if (blockers.length) throw new Error(`${id} is needed by ${blockers.join(", ")}; remove that first.`);

  const deleted = feature.delete.flatMap((entry) => filesUnder(app, entry));
  const stubs = feature.stubs.filter((file) => exists(path.join(featuresDir, "stubs", id, file)));
  // Keep the exact current files (including any edits) so "add" can put them back unchanged.
  for (const file of [...stubs, ...deleted]) {
    if (!exists(path.join(app, file))) continue;
    fs.mkdirSync(path.dirname(backupPath(app, id, file)), { recursive: true });
    fs.copyFileSync(path.join(app, file), backupPath(app, id, file));
  }
  const appFile = path.join(app, "app.json");
  const appJson = readJson(appFile);
  const record = { stubs: {}, deleted, packages: [], appJson: {}, env: [] };
  for (const key of feature.appJsonKeys ?? []) {
    record.appJson[key] = getPath(appJson.expo, key) ?? ABSENT;
    setPath(appJson.expo, key, undefined);
  }
  for (const [key, value] of Object.entries(feature.appJsonSet ?? {})) {
    record.appJson[key] = getPath(appJson.expo, key) ?? ABSENT;
    setPath(appJson.expo, key, value);
  }
  writeJson(appFile, appJson);
  for (const file of stubs) {
    const target = path.join(app, file);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.copyFileSync(path.join(featuresDir, "stubs", id, file), target);
  }
  for (const entry of feature.delete) fs.rmSync(path.join(app, entry), { recursive: true, force: true });
  record.packages = removePackages(app, feature.packages);
  record.env = editEnvExample(app, feature.env, false);
  editCi(app, feature.ciJobs, false);
  setFlag(app, feature.flag, false);
  for (const file of stubs) record.stubs[file] = sha(path.join(app, file));
  // Record before installing, so a failed install still leaves an accurate record for "add".
  state.removed[id] = record;
  writeState(app, state);
  finish(app, { install });
  return [
    `removed ${id}: ${stubs.length} stub(s), ${deleted.length} file(s) deleted${stubs.length + deleted.length ? ` (originals kept in .mobile-builder/removed/${id})` : ""}, packages uninstalled: ${record.packages.join(", ") || "none (still used elsewhere)"}`,
  ];
}

export function addFeature(appArg, id, { force = false, install = true } = {}) {
  const app = path.resolve(appArg);
  const feature = findFeature(id);
  const state = readState(app);
  if (feature.kind === "restorable") return addRestorable(app, feature, state, { force, install });
  const record = state.removed[id];
  if (!record) throw new Error(`${id} is not removed in this app (status: bash start.sh expo feature status <app>).`);
  const conflicts = Object.entries(record.stubs).filter(([file, written]) => exists(path.join(app, file)) && sha(path.join(app, file)) !== written);
  const occupied = record.deleted.filter((file) => exists(path.join(app, file)));
  if ((conflicts.length || occupied.length) && !force) {
    throw new Error(`Changed since removal, so restoring would overwrite work:\n  ${[...conflicts.map(([f]) => f), ...occupied].join("\n  ")}\nMerge by hand, or re-run with --force.`);
  }
  for (const file of [...Object.keys(record.stubs), ...record.deleted]) {
    const target = path.join(app, file);
    const backup = backupPath(app, id, file);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.copyFileSync(exists(backup) ? backup : path.join(templateDir, file), target);
  }
  addPackages(app, Object.fromEntries(record.packages.map((name) => [name, undefined])));
  const appFile = path.join(app, "app.json");
  const appJson = readJson(appFile);
  const template = readJson(path.join(templateDir, "app.json")).expo;
  for (const [key, value] of Object.entries(record.appJson ?? {})) {
    setPath(appJson.expo, key, value === ABSENT ? undefined : value);
    // Drop a parent object that only existed for the removed setting (for example "updates").
    const parentKey = key.split(".").slice(0, -1).join(".");
    if (parentKey && Object.keys(getPath(appJson.expo, parentKey) ?? { keep: true }).length === 0) setPath(appJson.expo, parentKey, undefined);
    orderLike(appJson.expo, template, key);
  }
  writeJson(appFile, appJson);
  editEnvExample(app, record.env ?? feature.env, true);
  editCi(app, feature.ciJobs, true);
  setFlag(app, feature.flag, true);
  fs.rmSync(path.join(app, ".mobile-builder", "removed", id), { recursive: true, force: true });
  delete state.removed[id];
  writeState(app, state);
  finish(app, { install });
  return [`added ${id} back: ${Object.keys(record.stubs).length + record.deleted.length} file(s) restored, packages: ${record.packages.join(", ") || "none"}`];
}

/** Re-orders the keys along a dotted path to match the template, so a restored key returns to its place. */
function orderLike(target, template, dotted) {
  const keys = dotted.split(".");
  keys.pop();
  const parent = keys.reduce((node, key) => node?.[key], target);
  const reference = keys.reduce((node, key) => node?.[key], template);
  if (!parent || !reference) return;
  const order = Object.keys(reference);
  const rank = (key) => (order.includes(key) ? order.indexOf(key) : order.length);
  const sorted = Object.keys(parent).sort((a, b) => rank(a) - rank(b));
  const copy = { ...parent };
  for (const key of Object.keys(parent)) delete parent[key];
  for (const key of sorted) parent[key] = copy[key];
}

function addRestorable(app, feature, state, { force, install }) {
  if (state.added[feature.id]) throw new Error(`${feature.id} is already added.`);
  const missing = (feature.requires ?? []).filter((required) => state.removed[required]);
  if (missing.length) throw new Error(`${feature.id} needs ${missing.join(", ")}; add those back first.`);
  const source = path.join(featuresDir, feature.id);
  const files = filesUnder(source, ".").map((file) => path.posix.normalize(file));
  const record = { files: {}, replaced: [], packages: [] };
  for (const file of files) {
    const target = path.join(app, file);
    if (exists(target)) {
      // Keep the app's own version so "remove" can put it back exactly.
      fs.mkdirSync(path.dirname(backupPath(app, feature.id, file)), { recursive: true });
      fs.copyFileSync(target, backupPath(app, feature.id, file));
      record.replaced.push(file);
    }
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.copyFileSync(path.join(source, file), target);
  }
  applyPlanName(app);
  record.packages = addPackages(app, feature.addPackages ?? {});
  for (const file of files) record.files[file] = sha(path.join(app, file));
  state.added[feature.id] = record;
  writeState(app, state);
  finish(app, { install });
  return [`added ${feature.id}: ${files.length} file(s) (${record.replaced.length} replaced, originals kept in .mobile-builder/removed/${feature.id}), packages: ${record.packages.join(", ") || "none"}`];
}

function removeRestorable(app, feature, state, { force, install }) {
  const record = state.added[feature.id];
  if (!record) throw new Error(`${feature.id} is not added in this app.`);
  const conflicts = Object.entries(record.files).filter(([file, written]) => exists(path.join(app, file)) && sha(path.join(app, file)) !== written);
  if (conflicts.length && !force) {
    throw new Error(`Changed since ${feature.id} was added, so removing it would lose work:\n  ${conflicts.map(([f]) => f).join("\n  ")}\nMerge by hand, or re-run with --force.`);
  }
  for (const file of Object.keys(record.files)) {
    const backup = backupPath(app, feature.id, file);
    if (record.replaced.includes(file) && exists(backup)) fs.copyFileSync(backup, path.join(app, file));
    else fs.rmSync(path.join(app, file), { force: true });
  }
  removeEmptyDirs(path.join(app, "src"));
  fs.rmSync(path.join(app, ".mobile-builder", "removed", feature.id), { recursive: true, force: true });
  const removed = removePackages(app, record.packages);
  delete state.added[feature.id];
  writeState(app, state);
  finish(app, { install });
  return [`removed ${feature.id}: original files restored, packages uninstalled: ${removed.join(", ") || "none"}`];
}

function removeEmptyDirs(dir) {
  if (!exists(dir) || !fs.statSync(dir).isDirectory()) return;
  for (const entry of fs.readdirSync(dir)) removeEmptyDirs(path.join(dir, entry));
  if (!fs.readdirSync(dir).length) fs.rmdirSync(dir);
}

export function setFeatureFlag(appArg, id, value) {
  const feature = findFeature(id);
  if (!feature.flag) throw new Error(`${id} has no on/off switch; use remove/add.`);
  setFlag(path.resolve(appArg), feature.flag, value);
  return [`${id} switched ${value ? "on" : "off"} (code and packages unchanged).`];
}

function status(appArg) {
  const app = path.resolve(appArg);
  const state = readState(app);
  const flags = exists(path.join(app, "src", "constants", "features.ts"))
    ? fs.readFileSync(path.join(app, "src", "constants", "features.ts"), "utf8")
    : "";
  for (const feature of manifest) {
    let value;
    if (feature.kind === "restorable") value = state.added[feature.id] ? "added" : "not added";
    else if (state.removed[feature.id]) value = "removed";
    else if (feature.flag && new RegExp(`^\\s{2}${feature.flag}:\\s*false,`, "mu").test(flags)) value = "off";
    else value = "on";
    console.log(`${feature.id.padEnd(14)} ${value}`);
  }
}

function main() {
  const [command = "list", id, app, ...flags] = process.argv.slice(2);
  const options = { force: flags.includes("--force"), install: !flags.includes("--no-install") };
  const print = (notes) => notes.forEach((note) => console.log(note));
  if (command === "list") {
    for (const feature of manifest) {
      console.log(`${feature.id.padEnd(14)} ${feature.kind.padEnd(11)} ${feature.flag ? "on/off+remove" : feature.kind === "restorable" ? "add/remove   " : "remove/add   "}  ${feature.name}`);
    }
    return;
  }
  if (command === "status" && id) return status(id);
  if (!id || !app) {
    console.error("Usage: bash start.sh expo feature list | status APP | on|off|remove|add ID APP [--force] [--no-install]");
    process.exit(2);
  }
  if (command === "on" || command === "off") return print(setFeatureFlag(app, id, command === "on"));
  if (command === "remove") return print(removeFeature(app, id, options));
  if (command === "add") return print(addFeature(app, id, options));
  console.error(`Unknown command '${command}'.`);
  process.exit(2);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    main();
  } catch (error) {
    console.error(`error: ${error.message}`);
    process.exit(1);
  }
}
