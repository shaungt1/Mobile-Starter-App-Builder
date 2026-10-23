import fs from 'node:fs';
import path from 'node:path';

const appRoot = path.resolve(process.argv[2] ?? '.');
const packagePath = path.join(appRoot, 'package.json');
const appJsonPath = path.join(appRoot, 'app.json');
if (!fs.existsSync(packagePath) || !fs.existsSync(appJsonPath)) process.exit(0);

const manifest = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
const appJson = JSON.parse(fs.readFileSync(appJsonPath, 'utf8'));
const expo = appJson.expo ?? appJson;
const dependencies = { ...(manifest.dependencies ?? {}), ...(manifest.devDependencies ?? {}) };
const plugins = Array.isArray(expo.plugins) ? expo.plugins : [];
const pluginName = (entry) => (Array.isArray(entry) ? entry[0] : entry);
let changed = false;

// Expo CLI cannot write this automatically when app.config.js wraps app.json.
// Keep this list limited to baseline plugins whose package is already installed.
for (const required of ['expo-font']) {
  if (dependencies[required] && !plugins.some((entry) => pluginName(entry) === required)) {
    plugins.push(required);
    changed = true;
    console.log(`Added required baseline config plugin: ${required}`);
  }
}

if (changed) {
  expo.plugins = plugins;
  fs.writeFileSync(appJsonPath, `${JSON.stringify(appJson, null, 2)}\n`);
}
