#!/usr/bin/env node
/**
 * One command to create a mobile app in another folder or repository.
 *
 * Usage (every option can be left out; missing ones are asked for in a terminal):
 *   node scripts/new-app.mjs
 *     --platform expo | expo-clean | tauri
 *     --target ../my-app                    folder to create the app in
 *     --repo https://github.com/org/app.git clone this (new, empty) repository first; --target is the clone folder
 *     --plan plan.json                      start from a plan file (flags below override it)
 *     --name "My App" --slug my-app --bundle-id com.company.myapp [--scheme myapp]
 *     --frontend vite|nextjs  --ui shadcn|konsta  --ui-theme ios|material     (Tauri)
 *     --capabilities a,b,c                  capability ids (bash start.sh expo|tauri capabilities list)
 *     --install                             run the app's setup (dependencies, native projects, checks)
 *     --commit                              make the first Git commit in the app
 *     --push                                push that commit to the repository's origin (needs --repo and --commit)
 *     --yes                                 never prompt; fail if something required is missing
 *
 * The builder never copies itself into the app and never modifies its own files.
 */
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { createInterface } from "node:readline/promises";
import { fileURLToPath } from "node:url";

import { bashCommand, inspectTarget } from "./lib/target.mjs";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const argv = process.argv.slice(2);
const flag = (name) => argv.includes(`--${name}`);
const option = (name) => {
  const index = argv.indexOf(`--${name}`);
  return index >= 0 && argv[index + 1] && !argv[index + 1].startsWith("--") ? argv[index + 1] : undefined;
};
const interactive = process.stdin.isTTY && !flag("yes");
const rl = interactive ? createInterface({ input: process.stdin, output: process.stdout }) : undefined;

async function ask(question, fallback) {
  if (!rl) {
    if (fallback !== undefined) return fallback;
    throw new Error(`Missing required value: ${question} (pass it as a flag; see --help).`);
  }
  const answer = (await rl.question(`${question}${fallback ? ` [${fallback}]` : ""}: `)).trim();
  return answer || fallback || ask(question, fallback);
}

const slugify = (text) =>
  text
    .toLowerCase()
    .replace(/[^a-z0-9]+/gu, "-")
    .replace(/^-+|-+$/gu, "");

function run(command, args, cwd) {
  console.log(`\n$ ${command} ${args.join(" ")}`);
  const result = spawnSync(command, args, { cwd, stdio: "inherit", shell: false });
  if (result.status !== 0) throw new Error(`${command} exited with code ${result.status ?? result.error?.message}`);
}

async function main() {
  if (flag("help") || flag("h")) {
    console.log(fs.readFileSync(fileURLToPath(import.meta.url), "utf8").split("*/")[0]);
    return;
  }
  const plan = option("plan") ? JSON.parse(fs.readFileSync(path.resolve(option("plan")), "utf8")) : {};

  let platform = option("platform") ?? plan.platform;
  if (!platform) {
    console.log("Platforms:\n  expo        owned Expo template (auth, payments, analytics, local SQL, scripts) - recommended\n  expo-clean  brand-new Expo app on the latest SDK + NativeWind + React Native Reusables\n  tauri       Tauri 2 (Rust core + React web UI) for Android and iOS");
    platform = await ask("Platform (expo, expo-clean, tauri)", "expo");
  }
  if (!["expo", "expo-clean", "tauri"].includes(platform)) throw new Error("--platform must be expo, expo-clean or tauri.");

  const repo = option("repo");
  let target = option("target");
  if (!target && repo) target = path.join("..", path.basename(repo).replace(/\.git$/u, ""));
  if (!target) target = await ask("Folder to create the app in (full or relative path)");

  plan.name = option("name") ?? plan.name ?? (await ask("App name", path.basename(path.resolve(target))));
  plan.slug = option("slug") ?? plan.slug ?? slugify(plan.name);
  plan.bundleId = option("bundle-id") ?? plan.bundleId ?? (await ask("Bundle ID (reverse-DNS, e.g. com.company.app)", `com.example.${plan.slug.replaceAll("-", "")}`));
  plan.scheme = option("scheme") ?? plan.scheme ?? plan.slug.replaceAll("-", "");
  if (option("capabilities")) plan.capabilities = option("capabilities").split(",").map((id) => id.trim()).filter(Boolean);
  if (platform === "tauri") {
    plan.frontend = option("frontend") ?? plan.frontend ?? (await ask("Frontend (vite or nextjs)", "vite"));
    plan.ui = option("ui") ?? plan.ui ?? (await ask("UI kit (shadcn or konsta)", "shadcn"));
    plan.uiTheme = option("ui-theme") ?? plan.uiTheme ?? (plan.ui === "konsta" ? await ask("Konsta look (ios or material)", "ios") : "ios");
    plan.capabilities ??= [];
  } else {
    plan.capabilities ??= ["core"];
  }
  plan.platform = platform === "tauri" ? "tauri" : "expo";
  rl?.close();

  // Validate the destination before cloning or downloading anything.
  const resolvedTarget = path.resolve(target);
  if (repo) {
    if (fs.existsSync(resolvedTarget) && fs.readdirSync(resolvedTarget).length > 0) {
      throw new Error(`${resolvedTarget} already exists and is not empty; choose another --target for the clone.`);
    }
    run("git", ["clone", repo, resolvedTarget], process.cwd());
  }
  inspectTarget(resolvedTarget, { builderRoot: root });

  const planFile = path.join(fs.mkdtempSync(path.join(os.tmpdir(), "mobile-plan-")), "plan.json");
  fs.writeFileSync(planFile, `${JSON.stringify(plan, null, 2)}\n`);
  console.log(`\nPlan:\n${JSON.stringify(plan, null, 2)}`);

  if (platform === "expo") {
    run(process.execPath, [path.join(root, "_expo", "starter", "generator", "create-app.mjs"), resolvedTarget, "--plan", planFile], root);
  } else if (platform === "tauri") {
    run(process.execPath, [path.join(root, "_tauri2", "generator", "create-app.mjs"), resolvedTarget, "--plan", planFile], root);
  } else {
    run(bashCommand(), [path.join(root, "_expo", "clean", "create-clean.sh"), resolvedTarget], root);
    run(bashCommand(), [path.join(root, "_expo", "scripts", "startup", "configure.sh"), resolvedTarget, "--name", plan.name, "--slug", plan.slug, "--bundle-id", plan.bundleId, "--scheme", plan.scheme], root);
    fs.writeFileSync(path.join(resolvedTarget, "PROJECT_PLAN.json"), `${JSON.stringify(plan, null, 2)}\n`);
  }

  if (flag("install")) {
    const setup = platform === "expo-clean" ? ["-c", "bun install && bunx tsc --noEmit"] : ["scripts/setup.sh"];
    run(bashCommand(), setup, resolvedTarget);
  }
  if (flag("commit")) {
    run("git", ["add", "-A"], resolvedTarget);
    run("git", ["commit", "-m", `chore: scaffold ${plan.name} (${platform}) with Mobile Starter App Builder`], resolvedTarget);
    if (flag("push")) {
      if (!repo) throw new Error("--push needs --repo (the app must have an origin remote).");
      run("git", ["push", "-u", "origin", "HEAD"], resolvedTarget);
    }
  }

  console.log(`\nDone. The app is an independent project at ${resolvedTarget}.`);
  console.log("Open that folder on its own (for example in a new VS Code window) and work there:");
  console.log(`  cd "${resolvedTarget}"`);
  if (!flag("install")) console.log(platform === "expo-clean" ? "  bun install && bunx expo start" : "  bash start.sh setup");
  console.log(platform === "expo-clean" ? "  bunx expo start" : "  bash start.sh            (menu: run on web, Android, iOS, ...)");
  console.log("Agents: read AGENTS.md in the app before changing it.");
}

main().catch((error) => {
  rl?.close();
  console.error(`error: ${error.message}`);
  process.exit(1);
});
