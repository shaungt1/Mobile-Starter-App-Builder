/**
 * Project plan rules and application for Tauri 2 mobile apps.
 *
 * The plan uses the same identity and theme fields as the Expo platform
 * (name, slug, scheme, bundleId, theme as HSL triplets), so one plan format
 * describes an app on either platform. Tauri adds:
 *   frontend  "vite" (React + Vite + TanStack Router, default) or "nextjs" (static export)
 *   ui        "shadcn" (default) or "konsta"
 *   uiTheme   "ios" (default) or "material", used by Konsta
 *   capabilities  ids from _tauri2/config/capabilities.json
 */
import fs from "node:fs";
import path from "node:path";

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/u;
const SCHEME = /^[a-z][a-z0-9+.-]*$/u;
// Letters, digits and dots, each segment starting with a letter: valid for Android and iOS.
const BUNDLE = /^[A-Za-z][A-Za-z0-9]*(?:\.[A-Za-z][A-Za-z0-9]*)+$/u;
const HSL = /^\d{1,3}\s+\d{1,3}%\s+\d{1,3}%$/u;
const TEXT_FILE = /\.(json|ts|tsx|mts|mjs|js|html|css|md|toml|rs|sh|yml|yaml|example|lock)$/u;

export function normalizePlan(input) {
  const name = String(input.name ?? "").trim();
  const slug = String(input.slug ?? "").trim().toLowerCase();
  const scheme = String(input.scheme ?? slug.replaceAll("-", "")).trim().toLowerCase();
  const bundleId = String(input.bundleId ?? "").trim();
  if (!name) throw new Error("Plan requires a non-empty name.");
  if (/["\\`$<>]/u.test(name)) throw new Error('name must not contain quotes, backslashes, backticks, "$", "<" or ">".');
  if (!SLUG.test(slug)) throw new Error("slug must use lowercase letters, numbers, and single hyphens.");
  if (!SCHEME.test(scheme)) throw new Error("scheme is not a valid URI scheme.");
  if (!BUNDLE.test(bundleId)) throw new Error("bundleId must be reverse-DNS style with segments starting with a letter, for example com.company.app.");
  if (bundleId === "com.tauri.dev") throw new Error("bundleId com.tauri.dev is a placeholder that Tauri refuses to build.");

  const theme = {
    primary: input.theme?.primary ?? "221 83% 53%",
    accent: input.theme?.accent ?? "199 89% 48%",
    background: input.theme?.background ?? "210 33% 98%",
    foreground: input.theme?.foreground ?? "222 47% 11%",
    radius: input.theme?.radius ?? "0.75rem",
  };
  for (const key of ["primary", "accent", "background", "foreground"]) {
    if (!HSL.test(theme[key])) throw new Error(`theme.${key} must be an HSL triplet such as "221 83% 53%".`);
  }
  const frontend = input.frontend ?? "vite";
  if (!["vite", "nextjs"].includes(frontend)) throw new Error('frontend must be "vite" or "nextjs".');
  const ui = input.ui ?? "shadcn";
  if (!["shadcn", "konsta"].includes(ui)) throw new Error('ui must be "shadcn" or "konsta" (add Consta UIKit with the consta-ui capability).');
  const uiTheme = input.uiTheme ?? "ios";
  if (!["ios", "material"].includes(uiTheme)) throw new Error('uiTheme must be "ios" or "material".');
  const capabilities = [...new Set(input.capabilities ?? [])];
  return { platform: "tauri", name, slug, scheme, bundleId, theme, frontend, ui, uiTheme, capabilities };
}

function walk(dir, visit) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (["node_modules", ".git", "target", "gen", "icons"].includes(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, visit);
    else visit(full);
  }
}

/** Replaces __PLACEHOLDER__ tokens in every text file under root. */
export function replacePlaceholders(root, values) {
  walk(root, (file) => {
    if (!TEXT_FILE.test(file) && !path.basename(file).startsWith(".env")) return;
    const before = fs.readFileSync(file, "utf8");
    let after = before;
    for (const [token, value] of Object.entries(values)) after = after.replaceAll(token, value);
    if (after !== before) fs.writeFileSync(file, after);
  });
}

const readJson = (file) => JSON.parse(fs.readFileSync(file, "utf8"));
const writeJson = (file, value) => fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`);

/** Applies one overlay folder (overlay.json plus files/) onto a generated app. */
export function applyOverlay(root, overlayDir) {
  const spec = readJson(path.join(overlayDir, "overlay.json"));
  for (const relative of spec.remove ?? []) fs.rmSync(path.join(root, relative), { force: true, recursive: true });

  if (spec.package) {
    const file = path.join(root, "package.json");
    const manifest = readJson(file);
    for (const name of spec.package.removeDependencies ?? []) delete manifest.dependencies[name];
    for (const name of spec.package.removeDevDependencies ?? []) delete manifest.devDependencies[name];
    Object.assign(manifest.dependencies, spec.package.dependencies ?? {});
    Object.assign(manifest.devDependencies, spec.package.devDependencies ?? {});
    Object.assign(manifest.scripts, spec.package.scripts ?? {});
    manifest.dependencies = Object.fromEntries(Object.entries(manifest.dependencies).sort());
    manifest.devDependencies = Object.fromEntries(Object.entries(manifest.devDependencies).sort());
    writeJson(file, manifest);
  }
  if (spec.tauriConf) {
    const file = path.join(root, "src-tauri", "tauri.conf.json");
    const conf = readJson(file);
    for (const [section, values] of Object.entries(spec.tauriConf)) conf[section] = { ...conf[section], ...values };
    writeJson(file, conf);
  }
  if (spec.tsconfig) {
    const file = path.join(root, "tsconfig.json");
    const tsconfig = readJson(file);
    tsconfig.compilerOptions = { ...tsconfig.compilerOptions, ...spec.tsconfig.compilerOptions };
    if (spec.tsconfig.include) tsconfig.include = spec.tsconfig.include;
    writeJson(file, tsconfig);
  }
  if (spec.appendCss) {
    const file = path.join(root, spec.appendCss.file);
    const css = fs.readFileSync(file, "utf8");
    if (!css.includes(spec.appendCss.text)) {
      if (!css.includes(spec.appendCss.after)) throw new Error(`Overlay anchor not found in ${spec.appendCss.file}`);
      fs.writeFileSync(file, css.replace(spec.appendCss.after, `${spec.appendCss.after}\n${spec.appendCss.text}`));
    }
  }
  const files = path.join(overlayDir, "files");
  if (fs.existsSync(files)) fs.cpSync(files, root, { recursive: true, force: true });
}

/** Writes the plan's light-theme colors and radius into src/styles/globals.css. */
export function applyTheme(root, theme) {
  const file = path.join(root, "src", "styles", "globals.css");
  let css = fs.readFileSync(file, "utf8");
  for (const token of ["primary", "accent", "background", "foreground"]) {
    css = css.replace(new RegExp(`(:root\\s*\\{[^}]*?--${token}:)\\s*[^;]+;`, "u"), `$1 hsl(${theme[token]});`);
  }
  css = css.replace(/(:root\s*\{[^}]*?--radius:)\s*[^;]+;/u, `$1 ${theme.radius};`);
  fs.writeFileSync(file, css);
}

/** Applies identity, frontend, interface kit and theme to a copied template. */
export function applyPlan(root, rawPlan, overlaysDir) {
  const plan = normalizePlan(rawPlan);
  if (plan.frontend === "nextjs") applyOverlay(root, path.join(overlaysDir, "nextjs"));
  if (plan.ui === "konsta") applyOverlay(root, path.join(overlaysDir, "konsta"));
  replacePlaceholders(root, {
    __APP_NAME__: plan.name,
    __APP_SLUG__: plan.slug,
    __APP_ID__: plan.bundleId,
    __APP_SCHEME__: plan.scheme,
    __UI_THEME__: plan.uiTheme,
  });
  applyTheme(root, plan.theme);
  writeJson(path.join(root, "PROJECT_PLAN.json"), plan);
  return plan;
}
