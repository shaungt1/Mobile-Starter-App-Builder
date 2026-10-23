import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import { addFeature, removeFeature, setFeatureFlag } from '../scripts/features.mjs';

const expoDir = fileURLToPath(new URL('..', import.meta.url));
const templateDir = path.join(expoDir, 'starter', 'template');
const featuresDir = path.join(expoDir, 'features');
const { features } = JSON.parse(fs.readFileSync(path.join(featuresDir, 'features.json'), 'utf8'));
const templatePackage = JSON.parse(fs.readFileSync(path.join(templateDir, 'package.json'), 'utf8'));
const templateDeps = { ...templatePackage.dependencies, ...templatePackage.devDependencies };

const exportedNames = (file) =>
  [...fs.readFileSync(file, 'utf8').matchAll(/export\s+(?:async\s+)?(?:function|const|class|type|interface)\s+(\w+)/gu)]
    .map((match) => match[1])
    .sort();

function copyTemplate() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'features-'));
  fs.cpSync(templateDir, root, {
    recursive: true,
    filter: (entry) => !path.relative(templateDir, entry).split(path.sep).includes('node_modules'),
  });
  return root;
}

function snapshot(root) {
  const files = {};
  const walk = (relative) => {
    for (const entry of fs.readdirSync(path.join(root, relative))) {
      const child = path.join(relative, entry);
      if (child.startsWith('.mobile-builder')) continue;
      if (fs.statSync(path.join(root, child)).isDirectory()) walk(child);
      else files[child] = fs.readFileSync(path.join(root, child), 'utf8');
    }
  };
  walk('.');
  return files;
}

test('manifest points at files and packages that exist in the template', () => {
  for (const feature of features.filter((entry) => entry.kind === 'built-in')) {
    for (const file of [...feature.stubs, ...feature.delete]) {
      assert.ok(fs.existsSync(path.join(templateDir, file)), `${feature.id}: ${file} missing from template`);
    }
    for (const name of feature.packages) assert.ok(templateDeps[name], `${feature.id}: package ${name} not in template`);
  }
});

test('every stub exports the same names as the file it replaces', () => {
  for (const feature of features.filter((entry) => entry.kind === 'built-in')) {
    for (const file of feature.stubs) {
      const stub = path.join(featuresDir, 'stubs', feature.id, file);
      assert.ok(fs.existsSync(stub), `${feature.id}: stub ${file} missing`);
      const original = exportedNames(path.join(templateDir, file));
      for (const name of exportedNames(stub)) assert.ok(original.includes(name), `${feature.id}: ${file} stub exports extra ${name}`);
    }
  }
});

test('the funnel requires features that exist', () => {
  const funnel = features.find((entry) => entry.id === 'funnel');
  for (const id of funnel.requires) assert.ok(features.some((entry) => entry.id === id));
  assert.ok(fs.existsSync(path.join(featuresDir, 'funnel', 'src', 'features', 'onboarding')));
});

test('removing every feature and adding it back restores the app exactly', () => {
  const root = copyTemplate();
  const before = snapshot(root);
  const builtIn = features.filter((entry) => entry.kind === 'built-in').map((entry) => entry.id);
  for (const id of builtIn) removeFeature(root, id, { install: false });
  assert.ok(!fs.existsSync(path.join(root, 'src', 'lib', 'supabase.ts')));
  assert.match(fs.readFileSync(path.join(root, 'src', 'constants', 'features.ts'), 'utf8'), /auth: false,/u);
  assert.doesNotMatch(fs.readFileSync(path.join(root, 'package.json'), 'utf8'), /react-native-purchases/u);
  assert.throws(() => addFeature(root, 'funnel', { install: false }), /needs/u);
  for (const id of builtIn.toReversed()) addFeature(root, id, { install: false });
  assert.deepEqual(snapshot(root), before);
  fs.rmSync(root, { recursive: true, force: true });
});

test('adding the funnel and removing it restores the app exactly', () => {
  const root = copyTemplate();
  const before = snapshot(root);
  addFeature(root, 'funnel', { install: false });
  assert.ok(fs.existsSync(path.join(root, 'src', 'features', 'onboarding')));
  assert.match(fs.readFileSync(path.join(root, 'package.json'), 'utf8'), /"zustand"/u);
  assert.throws(() => removeFeature(root, 'auth', { install: false }), /needed by funnel/u);
  removeFeature(root, 'funnel', { install: false });
  assert.deepEqual(snapshot(root), before);
  fs.rmSync(root, { recursive: true, force: true });
});

test('a stub edited after removal blocks add unless forced', () => {
  const root = copyTemplate();
  removeFeature(root, 'analytics', { install: false });
  fs.appendFileSync(path.join(root, 'src', 'lib', 'analytics.tsx'), '\n// edited\n');
  assert.throws(() => addFeature(root, 'analytics', { install: false }), /Changed since removal/u);
  addFeature(root, 'analytics', { install: false, force: true });
  fs.rmSync(root, { recursive: true, force: true });
});

test('on/off switches only the flag', () => {
  const root = copyTemplate();
  setFeatureFlag(root, 'payments', false);
  assert.match(fs.readFileSync(path.join(root, 'src', 'constants', 'features.ts'), 'utf8'), /payments: false,/u);
  assert.ok(fs.existsSync(path.join(root, 'src', 'lib', 'revenuecat.ts')));
  assert.throws(() => setFeatureFlag(root, 'local-db', false), /no on\/off switch/u);
  fs.rmSync(root, { recursive: true, force: true });
});
