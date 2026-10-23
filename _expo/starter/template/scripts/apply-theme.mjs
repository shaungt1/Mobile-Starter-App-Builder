#!/usr/bin/env node
import fs from "node:fs";

const planFile = "PROJECT_PLAN.json";
if (!fs.existsSync(planFile))
  throw new Error("PROJECT_PLAN.json is missing. Generate the app or copy the example plan first.");
const plan = JSON.parse(fs.readFileSync(planFile, "utf8"));
const cssFile = "global.css";
let css = fs.readFileSync(cssFile, "utf8");
for (const [token, value] of Object.entries(plan.theme ?? {})) {
  if (!["primary", "accent", "background", "foreground", "radius"].includes(token)) continue;
  css = css.replace(new RegExp(`(--${token}:)\\s*[^;]+;`, "u"), `$1 ${value};`);
}
fs.writeFileSync(cssFile, css);
console.log("Applied PROJECT_PLAN.json theme tokens to global.css.");
