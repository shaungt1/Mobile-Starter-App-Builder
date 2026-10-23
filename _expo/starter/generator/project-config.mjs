import fs from 'node:fs';
import path from 'node:path';

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/u;
const SCHEME = /^[a-z][a-z0-9+.-]*$/u;
const BUNDLE = /^[A-Za-z][A-Za-z0-9]*(?:\.[A-Za-z0-9]+)+$/u;
const HSL = /^\d{1,3}\s+\d{1,3}%\s+\d{1,3}%$/u;

export function normalizePlan(input) {
  const name = String(input.name ?? '').trim();
  const slug = String(input.slug ?? '').trim().toLowerCase();
  const scheme = String(input.scheme ?? slug.replaceAll('-', '')).trim().toLowerCase();
  const bundleId = String(input.bundleId ?? '').trim();
  if (!name) throw new Error('Plan requires a non-empty name.');
  if (!SLUG.test(slug)) throw new Error('slug must use lowercase letters, numbers, and single hyphens.');
  if (!SCHEME.test(scheme)) throw new Error('scheme is not a valid URI scheme.');
  if (!BUNDLE.test(bundleId)) throw new Error('bundleId must be reverse-DNS style, for example com.company.app.');

  const theme = {
    primary: input.theme?.primary ?? '221 83% 53%',
    accent: input.theme?.accent ?? '199 89% 48%',
    background: input.theme?.background ?? '210 33% 98%',
    foreground: input.theme?.foreground ?? '222 47% 11%',
    radius: input.theme?.radius ?? '0.75rem',
  };
  for (const key of ['primary', 'accent', 'background', 'foreground']) {
    if (!HSL.test(theme[key])) throw new Error(`theme.${key} must be an HSL triplet such as "221 83% 53%".`);
  }
  const capabilities = [...new Set(input.capabilities ?? ['core'])];
  return { name, slug, scheme, bundleId, theme, capabilities };
}

function writeJson(file, value) {
  fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`);
}

// Same layout the app's formatter (oxfmt) produces: short arrays of strings on one line.
function writePlanJson(file, value) {
  const text = JSON.stringify(value, null, 2).replace(/\[\n\s+("[^"\n]*"(?:,\n\s+"[^"\n]*")*)\n\s+\]/gu, (match, items) => {
    const inline = `[${items.split(/,\n\s+/u).join(", ")}]`;
    return inline.length <= 80 ? inline : match;
  });
  fs.writeFileSync(file, `${text}\n`);
}

export function applyPlan(root, rawPlan) {
  const plan = normalizePlan(rawPlan);
  const appFile = path.join(root, 'app.json');
  const app = JSON.parse(fs.readFileSync(appFile, 'utf8'));
  app.expo.name = plan.name;
  app.expo.slug = plan.slug;
  app.expo.scheme = plan.scheme;
  app.expo.ios.bundleIdentifier = plan.bundleId;
  app.expo.android.package = plan.bundleId;
  writeJson(appFile, app);

  const packageFile = path.join(root, 'package.json');
  const manifest = JSON.parse(fs.readFileSync(packageFile, 'utf8'));
  manifest.name = plan.slug;
  manifest.description = `${plan.name} mobile application.`;
  writeJson(packageFile, manifest);

  const brandFile = path.join(root, 'src', 'constants', 'brand.ts');
  // Accept either quote style: the template's formatter may rewrite quotes.
  const brand = fs.readFileSync(brandFile, 'utf8')
    .replace(/appName:\s*(["'])[^"']*\1/u, `appName: ${JSON.stringify(plan.name)}`)
    .replace(/wordmark:\s*(["'])[^"']*\1/u, `wordmark: ${JSON.stringify(plan.name)}`)
    .replace(/proName:\s*(["'])[^"']*\1/u, `proName: ${JSON.stringify(`${plan.name} Pro`)}`);
  fs.writeFileSync(brandFile, brand);

  const cssFile = path.join(root, 'global.css');
  let css = fs.readFileSync(cssFile, 'utf8');
  const replacements = {
    background: plan.theme.background,
    foreground: plan.theme.foreground,
    primary: plan.theme.primary,
    accent: plan.theme.accent,
    radius: plan.theme.radius,
  };
  for (const [token, value] of Object.entries(replacements)) {
    css = css.replace(new RegExp(`(--${token}:)\\s*[^;]+;`, 'u'), `$1 ${value};`);
  }
  fs.writeFileSync(cssFile, css);

  const supabaseFile = path.join(root, 'supabase', 'config.toml');
  let supabase = fs.readFileSync(supabaseFile, 'utf8');
  supabase = supabase
    .replace(/^project_id\s*=.*$/mu, `project_id = "${plan.slug.replaceAll('-', '')}"`)
    .replace(/^site_url\s*=.*$/mu, `site_url = "${plan.scheme}://"`)
    .replace(/^additional_redirect_urls\s*=.*$/mu, `additional_redirect_urls = ["${plan.scheme}://", "${plan.scheme}://**"]`);
  fs.writeFileSync(supabaseFile, supabase);
  writePlanJson(path.join(root, 'PROJECT_PLAN.json'), plan);
  return plan;
}
