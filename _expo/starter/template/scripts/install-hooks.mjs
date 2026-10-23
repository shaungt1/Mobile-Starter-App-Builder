#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import fs from "node:fs";

if (!fs.existsSync(".git")) {
  console.log("Skipping Git hooks: this template copy is not an independent Git repository yet.");
  process.exit(0);
}

const result = spawnSync("lefthook", ["install"], {
  stdio: "inherit",
  shell: process.platform === "win32",
});
process.exit(result.status ?? 1);
