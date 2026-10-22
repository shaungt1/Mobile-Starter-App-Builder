import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

test("Expo identity is complete and consistent", () => {
  const app = JSON.parse(fs.readFileSync("app.json", "utf8")).expo;
  assert.ok(app.name);
  assert.ok(app.slug);
  assert.ok(app.scheme);
  assert.equal(app.ios.bundleIdentifier, app.android.package);
});

test("client environment example contains no server secrets", () => {
  const env = fs.readFileSync(".env.example", "utf8");
  assert.doesNotMatch(env, /SERVICE_ROLE|PRIVATE_KEY|OPENAI_API_KEY|ANTHROPIC_API_KEY/u);
});
