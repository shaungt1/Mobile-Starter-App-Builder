#!/usr/bin/env node
/** Writes the theme tokens from PROJECT_PLAN.json into src/styles/globals.css (light theme values). */
import fs from "node:fs";

const plan = JSON.parse(fs.readFileSync("PROJECT_PLAN.json", "utf8"));
const file = "src/styles/globals.css";
let css = fs.readFileSync(file, "utf8");
const tokens = ["primary", "accent", "background", "foreground"];
for (const token of tokens) {
  const value = plan.theme?.[token];
  if (value) css = css.replace(new RegExp(`(:root\\s*\\{[^}]*?--${token}:)\\s*[^;]+;`, "u"), `$1 hsl(${value});`);
}
if (plan.theme?.radius) css = css.replace(/(:root\s*\{[^}]*?--radius:)\s*[^;]+;/u, `$1 ${plan.theme.radius};`);
fs.writeFileSync(file, css);
console.log("Applied PROJECT_PLAN.json theme tokens to src/styles/globals.css.");
