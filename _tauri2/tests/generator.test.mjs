import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import { installCapability } from "../generator/capabilities.mjs";
import { applyPlan, normalizePlan } from "../generator/project-config.mjs";

const tauriDir = fileURLToPath(new URL("..", import.meta.url));
const base = { name: "Field App", slug: "field-app", bundleId: "com.acme.field" };

function copyTemplate() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "tauri-plan-"));
  fs.cpSync(path.join(tauriDir, "template"), root, { recursive: true });
  return root;
}

test("normalizes defaults: Vite, shadcn, iOS look, no capabilities", () => {
  const plan = normalizePlan(base);
  assert.equal(plan.frontend, "vite");
  assert.equal(plan.ui, "shadcn");
  assert.equal(plan.scheme, "fieldapp");
  assert.deepEqual(plan.capabilities, []);
});

test("rejects identifiers Android or Tauri cannot use", () => {
  assert.throws(() => normalizePlan({ ...base, bundleId: "com.1acme.app" }));
  assert.throws(() => normalizePlan({ ...base, bundleId: "com.tauri.dev" }));
  assert.throws(() => normalizePlan({ ...base, frontend: "vue" }));
  assert.throws(() => normalizePlan({ ...base, name: 'Bad "quote"' }));
});

test("applies identity and theme without leaving placeholders", () => {
  const root = copyTemplate();
  applyPlan(root, { ...base, theme: { primary: "142 70% 40%" } }, path.join(tauriDir, "overlays"));
  const conf = JSON.parse(fs.readFileSync(path.join(root, "src-tauri", "tauri.conf.json"), "utf8"));
  assert.equal(conf.identifier, "com.acme.field");
  assert.match(fs.readFileSync(path.join(root, "src", "styles", "globals.css"), "utf8"), /--primary: hsl\(142 70% 40%\);/u);
  for (const file of ["package.json", "index.html", "src-tauri/Cargo.toml", "src-tauri/Cargo.lock", "src/lib/app-identity.ts"]) {
    assert.doesNotMatch(fs.readFileSync(path.join(root, file), "utf8"), /__APP_[A-Z]+__/u, file);
  }
});

test("Next.js and Konsta overlays swap the frontend and the app shell", () => {
  const root = copyTemplate();
  applyPlan(root, { ...base, frontend: "nextjs", ui: "konsta", uiTheme: "material" }, path.join(tauriDir, "overlays"));
  const manifest = JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8"));
  assert.ok(manifest.dependencies.next && manifest.dependencies.konsta);
  assert.equal(manifest.dependencies["@tanstack/react-router"], undefined);
  assert.equal(fs.existsSync(path.join(root, "vite.config.ts")), false);
  assert.match(fs.readFileSync(path.join(root, "src", "components", "app-layout.tsx"), "utf8"), /theme="material"/u);
  const conf = JSON.parse(fs.readFileSync(path.join(root, "src-tauri", "tauri.conf.json"), "utf8"));
  assert.equal(conf.build.frontendDist, "../out");
});

test("capability install is guarded for mobile-only plugins and idempotent", () => {
  const root = copyTemplate();
  applyPlan(root, base, path.join(tauriDir, "overlays"));
  installCapability(root, "barcode-scanner", { quiet: true });
  installCapability(root, "barcode-scanner", { quiet: true });
  const rust = fs.readFileSync(path.join(root, "src-tauri", "src", "lib.rs"), "utf8");
  assert.equal(rust.match(/tauri_plugin_barcode_scanner::init/gu)?.length, 1);
  assert.match(rust, /#\[cfg\(mobile\)\]\s*\n\s*app\.handle\(\)\.plugin\(tauri_plugin_barcode_scanner::init\(\)\)\?;/u);
  const toml = fs.readFileSync(path.join(root, "src-tauri", "Cargo.toml"), "utf8");
  assert.match(toml, /cfg\(any\(target_os = "android", target_os = "ios"\)\)'\.dependencies\]\ntauri-plugin-barcode-scanner = "2"/u);
  const mobile = JSON.parse(fs.readFileSync(path.join(root, "src-tauri", "capabilities", "mobile.json"), "utf8"));
  assert.deepEqual(mobile.platforms, ["iOS", "android"]);
  assert.match(fs.readFileSync(path.join(root, "src-tauri", "Info.ios.plist"), "utf8"), /NSCameraUsageDescription/u);
  assert.deepEqual(JSON.parse(fs.readFileSync(path.join(root, "PROJECT_PLAN.json"), "utf8")).capabilities, ["barcode-scanner"]);
});
