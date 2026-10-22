import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import { applyPlan, normalizePlan } from '../starter/generator/project-config.mjs';

test('normalizes a valid project plan', () => {
  const plan = normalizePlan({ name: 'Field App', slug: 'field-app', bundleId: 'com.acme.field' });
  assert.equal(plan.scheme, 'fieldapp');
  assert.deepEqual(plan.capabilities, ['core']);
});

test('rejects unsafe identifiers', () => {
  assert.throws(() => normalizePlan({ name: 'Bad', slug: '../bad', bundleId: 'bad' }));
});

test('applies identity and theme without touching source template', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'launchpad-plan-'));
  const source = fileURLToPath(new URL('../starter/template', import.meta.url));
  fs.cpSync(source, root, {
    recursive: true,
    filter(entry) {
      const relative = path.relative(source, entry);
      return !relative.split(path.sep).some((part) => part === 'node_modules' || part === '.expo');
    },
  });
  applyPlan(root, {
    name: 'Field App', slug: 'field-app', scheme: 'fieldapp', bundleId: 'com.acme.field',
    theme: { primary: '142 70% 40%', accent: '38 90% 50%', background: '0 0% 100%', foreground: '222 47% 11%', radius: '1rem' },
  });
  const app = JSON.parse(fs.readFileSync(path.join(root, 'app.json'), 'utf8'));
  assert.equal(app.expo.ios.bundleIdentifier, 'com.acme.field');
  assert.match(fs.readFileSync(path.join(root, 'global.css'), 'utf8'), /--primary: 142 70% 40%;/u);
  assert.match(fs.readFileSync(path.join(root, 'src', 'constants', 'brand.ts'), 'utf8'), /appName: "Field App"/u);
});
