import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import { copyTemplate, inspectTarget } from "../scripts/lib/target.mjs";

const builderRoot = fileURLToPath(new URL("..", import.meta.url));
const temp = () => fs.mkdtempSync(path.join(os.tmpdir(), "target-"));

test("accepts a missing or empty folder", () => {
  assert.equal(inspectTarget(path.join(temp(), "new-app")).existing.length, 0);
  assert.equal(inspectTarget(temp()).hasGit, false);
});

test("accepts a new hosted repository and refuses real work", () => {
  const repo = temp();
  fs.mkdirSync(path.join(repo, ".git"));
  fs.writeFileSync(path.join(repo, "README.md"), "# Mine\n");
  assert.equal(inspectTarget(repo).hasGit, true);
  fs.writeFileSync(path.join(repo, "index.js"), "");
  assert.throws(() => inspectTarget(repo), /Target must be new, empty, or a new repository/u);
});

test("refuses to generate inside the builder", () => {
  assert.throws(() => inspectTarget(path.join(builderRoot, "apps", "x"), { builderRoot }), /inside the builder/u);
});

test("keeps the user's README, LICENSE and ignore rules", () => {
  const template = temp();
  fs.writeFileSync(path.join(template, "README.md"), "template readme");
  fs.writeFileSync(path.join(template, "LICENSE"), "MIT template");
  fs.writeFileSync(path.join(template, ".gitignore"), "node_modules/\n.env\n");
  fs.writeFileSync(path.join(template, "app.txt"), "app");
  const target = temp();
  fs.writeFileSync(path.join(target, "README.md"), "mine");
  fs.writeFileSync(path.join(target, "LICENSE.md"), "my license");
  fs.writeFileSync(path.join(target, ".gitignore"), ".env\n");
  copyTemplate(template, target, inspectTarget(target).existing);
  assert.equal(fs.readFileSync(path.join(target, "README.md"), "utf8"), "mine");
  assert.equal(fs.readFileSync(path.join(target, "docs", "STARTER_README.md"), "utf8"), "template readme");
  assert.equal(fs.readFileSync(path.join(target, "LICENSE.md"), "utf8"), "my license");
  assert.equal(fs.existsSync(path.join(target, "LICENSE")), false);
  assert.equal(fs.readFileSync(path.join(target, "licenses", "TEMPLATE_LICENSE.txt"), "utf8"), "MIT template");
  assert.match(fs.readFileSync(path.join(target, ".gitignore"), "utf8"), /^\.env\n\n# Added by Mobile Starter App Builder\nnode_modules\/\n$/u);
  assert.equal(fs.readFileSync(path.join(target, "app.txt"), "utf8"), "app");
});
