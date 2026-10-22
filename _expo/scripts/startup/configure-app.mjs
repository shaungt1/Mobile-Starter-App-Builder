import fs from 'node:fs';
import path from 'node:path';

const [appRootArg, ...rawArgs] = process.argv.slice(2);
if (!appRootArg) throw new Error('Target application directory is required.');

const args = new Map();
for (let index = 0; index < rawArgs.length; index += 2) {
  const key = rawArgs[index];
  const value = rawArgs[index + 1];
  if (!key?.startsWith('--') || value === undefined || value.startsWith('--')) {
    throw new Error(`Expected --option value; received ${key ?? '(nothing)'}`);
  }
  args.set(key, value);
}

for (const required of ['--name', '--slug', '--bundle-id']) {
  if (!args.get(required)) throw new Error(`${required} is required.`);
}

const name = args.get('--name');
const slug = args.get('--slug');
const scheme = args.get('--scheme') ?? slug;
const bundleId = args.get('--bundle-id');

if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
  throw new Error('--slug must use lowercase letters, digits, and single hyphens.');
}
if (!/^[a-z][a-z0-9+.-]*$/.test(scheme)) {
  throw new Error('--scheme must be a valid lowercase URL scheme.');
}
if (!/^[A-Za-z][A-Za-z0-9]*(?:\.[A-Za-z0-9]+)+$/.test(bundleId)) {
  throw new Error('--bundle-id must be reverse-DNS form, for example com.example.myapp.');
}

const appRoot = path.resolve(appRootArg);
const appJsonPath = path.join(appRoot, 'app.json');
if (!fs.existsSync(appJsonPath)) {
  throw new Error('Automatic configuration currently requires app.json. Configure app.config.* manually.');
}

const appJson = JSON.parse(fs.readFileSync(appJsonPath, 'utf8'));
const expo = appJson.expo ?? appJson;
const oldScheme = typeof expo.scheme === 'string' ? expo.scheme : '';
expo.name = name;
expo.slug = slug;
expo.scheme = scheme;
expo.ios = { ...(expo.ios ?? {}), bundleIdentifier: bundleId };
expo.android = { ...(expo.android ?? {}), package: bundleId.toLowerCase() };
fs.writeFileSync(appJsonPath, `${JSON.stringify(appJson, null, 2)}\n`);

const brandPath = path.join(appRoot, 'src', 'constants', 'brand.ts');
if (fs.existsSync(brandPath)) {
  let brand = fs.readFileSync(brandPath, 'utf8');
  brand = brand.replace(/appName:\s*(["'])[^"']*\1/, `appName: ${JSON.stringify(name)}`);
  brand = brand.replace(/wordmark:\s*(["'])[^"']*\1/, `wordmark: ${JSON.stringify(name)}`);
  brand = brand.replace(/proName:\s*(["'])[^"']*\1/, `proName: ${JSON.stringify(`${name} Pro`)}`);
  fs.writeFileSync(brandPath, brand);
}

const supabasePath = path.join(appRoot, 'supabase', 'config.toml');
if (oldScheme && fs.existsSync(supabasePath)) {
  const original = fs.readFileSync(supabasePath, 'utf8');
  fs.writeFileSync(supabasePath, original.replaceAll(`${oldScheme}://`, `${scheme}://`));
}

console.log(`Configured ${name}`);
console.log(`  slug:       ${slug}`);
console.log(`  scheme:     ${scheme}`);
console.log(`  bundle ID:  ${bundleId}`);
console.log('Review icons, splash assets, legal URLs, provider redirect URLs, EAS ownership, and product copy.');
