import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const playbookRoot = path.resolve(scriptDir, '..', '..');
const catalog = JSON.parse(
  fs.readFileSync(path.join(playbookRoot, 'config', 'capabilities.json'), 'utf8'),
);
const capabilities = catalog.capabilities;

function usage(exitCode = 0) {
  console.log('Usage:');
  console.log('  start.sh capabilities list');
  console.log('  start.sh capabilities show ID');
  console.log('  start.sh capabilities install ID TARGET [--apply] [--no-verify]');
  process.exit(exitCode);
}

function findCapability(id) {
  const capability = capabilities.find((entry) => entry.id === id);
  if (!capability) throw new Error(`Unknown capability '${id}'. Run 'capabilities list'.`);
  return capability;
}

function printCapability(capability) {
  console.log(`${capability.id}: ${capability.name}`);
  const runtime = capability.manualOnly
    ? 'architecture-specific; decide during design'
    : capability.requiresDevBuild
      ? 'development build / native verification'
      : 'Expo Go compatible when configured correctly';
  console.log(`  Runtime: ${runtime}`);
  if (capability.manualOnly) console.log('  Install: manual architecture step (no blind package installation)');
  if (capability.expo.length) console.log(`  Expo install: ${capability.expo.join(', ')}`);
  if (capability.packages.length) console.log(`  Bun add: ${capability.packages.join(', ')}`);
  if (capability.devPackages.length) console.log(`  Bun add -d: ${capability.devPackages.join(', ')}`);
  if (capability.env.length) console.log(`  Environment: ${capability.env.join(', ')}`);
  console.log('  Required follow-up:');
  capability.steps.forEach((step) => console.log(`    - ${step}`));
}

function run(command, args, cwd) {
  const result = spawnSync(command, args, { cwd, stdio: 'inherit', shell: false });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
}

function installedDependencies(appRoot) {
  const manifest = JSON.parse(fs.readFileSync(path.join(appRoot, 'package.json'), 'utf8'));
  return new Set([
    ...Object.keys(manifest.dependencies ?? {}),
    ...Object.keys(manifest.devDependencies ?? {}),
  ]);
}

function packageName(specifier) {
  if (specifier.startsWith('@')) {
    const secondAt = specifier.indexOf('@', 1);
    return secondAt === -1 ? specifier : specifier.slice(0, secondAt);
  }
  const at = specifier.indexOf('@');
  return at === -1 ? specifier : specifier.slice(0, at);
}

const [command = 'list', id, target, ...flags] = process.argv.slice(2);

if (command === 'list') {
  console.log('Capability       Runtime       Name');
  console.log('---------------- ------------- ------------------------------------------');
  for (const capability of capabilities) {
    const runtime = capability.manualOnly ? 'manual' : capability.requiresDevBuild ? 'dev-build' : 'Expo Go';
    console.log(`${capability.id.padEnd(16)} ${runtime.padEnd(13)} ${capability.name}`);
  }
  process.exit(0);
}

if (command === 'show') {
  if (!id) usage(1);
  printCapability(findCapability(id));
  process.exit(0);
}

if (command !== 'install' || !id || !target) usage(1);
const capability = findCapability(id);
const apply = flags.includes('--apply');
const verify = !flags.includes('--no-verify');
for (const flag of flags) {
  if (!['--apply', '--no-verify'].includes(flag)) throw new Error(`Unknown flag '${flag}'.`);
}

const appRoot = path.resolve(target);
if (!fs.existsSync(path.join(appRoot, 'package.json'))) {
  throw new Error(`No package.json found in ${appRoot}`);
}

printCapability(capability);
if (capability.manualOnly) {
  console.log('\nNo packages were installed. Complete and approve the architecture steps first.');
  process.exit(0);
}

const installed = installedDependencies(appRoot);
const missing = (items) => items.filter((item) => !installed.has(packageName(item)));
const expo = missing(capability.expo);
const packages = missing(capability.packages);
const devPackages = missing(capability.devPackages);

console.log('\nInstall plan:');
console.log(`  expo install: ${expo.join(' ') || '(already present / none)'}`);
console.log(`  bun add:      ${packages.join(' ') || '(already present / none)'}`);
console.log(`  bun add -d:   ${devPackages.join(' ') || '(already present / none)'}`);

if (!apply) {
  console.log('\nDry run only. Re-run with --apply to change the target application.');
  process.exit(0);
}

if (expo.length) run('bun', ['x', 'expo', 'install', ...expo], appRoot);
if (packages.length) run('bun', ['add', ...packages], appRoot);
if (devPackages.length) run('bun', ['add', '-d', ...devPackages], appRoot);

if (verify) run('bash', [path.join(scriptDir, 'verify.sh'), appRoot], playbookRoot);
console.log('\nPackage installation complete. Finish every required follow-up step shown above.');
if (capability.requiresDevBuild) {
  console.log('Rebuild the development client before runtime verification.');
}
