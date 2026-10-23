#!/usr/bin/env node
/**
 * Read-only report of what this machine can build and run for a Tauri 2 mobile
 * app: browser preview, desktop preview window, Android, and iOS. It never
 * installs anything; the builder's install-prereqs script does that.
 *
 * Usage: node scripts/check-system.mjs [--require-core]
 *   --require-core  exit 1 when Node.js 22.18+ or Git is missing (used by setup).
 */
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const windows = process.platform === "win32";
const mac = process.platform === "darwin";

function capture(command, args = []) {
  try {
    const options = { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"], timeout: 10000 };
    const output =
      windows && !/[\\/]/u.test(command)
        ? execFileSync([command, ...args].join(" "), { ...options, shell: true })
        : execFileSync(command, args, options);
    return output.trim();
  } catch {
    return undefined;
  }
}
const first = (text) => text?.split(/\r?\n/u)[0]?.slice(0, 60);

function atLeast(text, minimum) {
  const found = text?.match(/(\d+)\.(\d+)(?:\.(\d+))?/u);
  if (!found) return false;
  const have = found.slice(1).map((part) => Number(part ?? 0));
  const need = minimum.split(".").map(Number);
  for (let index = 0; index < 3; index += 1) {
    if ((have[index] ?? 0) !== (need[index] ?? 0)) return (have[index] ?? 0) > (need[index] ?? 0);
  }
  return true;
}

function firstDir(candidates, mustContain) {
  return candidates.find((dir) => dir && fs.existsSync(path.join(dir, mustContain))) ?? "";
}

const sdk = firstDir(
  [
    process.env.ANDROID_HOME,
    process.env.ANDROID_SDK_ROOT,
    windows && process.env.LOCALAPPDATA ? path.join(process.env.LOCALAPPDATA, "Android", "Sdk") : "",
    path.join(os.homedir(), "Library", "Android", "sdk"),
    path.join(os.homedir(), "Android", "Sdk"),
  ],
  "platform-tools",
);
const ndkVersions = sdk && fs.existsSync(path.join(sdk, "ndk")) ? fs.readdirSync(path.join(sdk, "ndk")) : [];
const jdk = firstDir(
  [
    process.env.JAVA_HOME,
    "C:\\Program Files\\Android\\Android Studio\\jbr",
    "/Applications/Android Studio.app/Contents/jbr/Contents/Home",
    "/opt/android-studio/jbr",
  ],
  path.join("bin", windows ? "java.exe" : "java"),
);
const emulator = sdk ? path.join(sdk, "emulator", windows ? "emulator.exe" : "emulator") : "";
const avds = emulator && fs.existsSync(emulator) ? capture(emulator, ["-list-avds"]) : undefined;
const rustTargets = capture("rustup", ["target", "list", "--installed"])?.split(/\r?\n/u) ?? [];
const androidTargets = [
  "aarch64-linux-android",
  "armv7-linux-androideabi",
  "i686-linux-android",
  "x86_64-linux-android",
];
const iosTargets = ["aarch64-apple-ios", "x86_64-apple-ios", "aarch64-apple-ios-sim"];
const missing = (wanted) => wanted.filter((target) => !rustTargets.includes(target));

const [major = 0, minor = 0] = process.versions.node.split(".").map(Number);
const nodeOk = major > 22 || (major === 22 && minor >= 18);
const rustc = first(capture("rustc", ["--version"]));

const rows = [
  ["Node.js 22.18+", process.version, nodeOk],
  ["Bun", first(capture("bun", ["--version"]))],
  ["Git", first(capture("git", ["--version"]))],
  ["Rust 1.90+ (rustup)", rustc, atLeast(rustc, "1.90.0")],
  [
    "Rust Android targets",
    missing(androidTargets).length ? `missing ${missing(androidTargets).join(" ")}` : "all 4",
    missing(androidTargets).length === 0,
  ],
  ["Android SDK", sdk || undefined],
  ["Android NDK", ndkVersions.length ? ndkVersions.sort().at(-1) : undefined],
  ["JDK (Android Studio jbr or 17)", jdk || undefined],
  ["Android Virtual Device", avds ? avds.split(/\r?\n/u).join(", ") : undefined],
];
if (mac) {
  rows.push(
    ["Xcode (full)", first(capture("xcodebuild", ["-version"]))],
    ["CocoaPods", first(capture("pod", ["--version"]))],
    [
      "Rust iOS targets",
      missing(iosTargets).length ? `missing ${missing(iosTargets).join(" ")}` : "all 3",
      missing(iosTargets).length === 0,
    ],
  );
}
if (process.platform === "linux") {
  rows.push(["WebKitGTK 4.1 (desktop preview)", capture("pkg-config", ["--modversion", "webkit2gtk-4.1"])]);
}
if (windows) {
  const vswhere = "C:\\Program Files (x86)\\Microsoft Visual Studio\\Installer\\vswhere.exe";
  const msvc = fs.existsSync(vswhere)
    ? capture(vswhere, [
        "-latest",
        "-products",
        "*",
        "-requires",
        "Microsoft.VisualStudio.Component.VC.Tools.x86.x64",
        "-property",
        "displayName",
      ])
    : undefined;
  rows.push(["MSVC C++ build tools", first(msvc)]);
}

const ok = Object.fromEntries(rows.map(([name, found, explicit]) => [name, explicit ?? Boolean(found)]));
const line = (char = "-") => char.repeat(70);
console.log(line("="));
console.log(" Tauri 2 mobile host report (read-only)");
console.log(line("="));
console.log(`OS : ${os.platform()} ${os.release()} (${os.arch()}), ${(os.totalmem() / 1024 ** 3).toFixed(1)} GB RAM`);
console.log(line());
for (const [name, found] of rows)
  console.log(`  ${(ok[name] ? "OK" : "MISSING").padEnd(8)} ${String(name).padEnd(32)} ${found ?? ""}`);
console.log(line());
const core = nodeOk && ok.Bun && ok.Git;
const rust = ok["Rust 1.90+ (rustup)"];
const android =
  core &&
  rust &&
  ok["Rust Android targets"] &&
  ok["Android SDK"] &&
  ok["Android NDK"] &&
  ok["JDK (Android Studio jbr or 17)"];
console.log(`  Browser preview  : ${core ? "READY  (bash start.sh run web)" : "NOT READY - Node 22.18+, Bun, Git"}`);
const desktopExtra = windows
  ? ok["MSVC C++ build tools"]
  : process.platform === "linux"
    ? ok["WebKitGTK 4.1 (desktop preview)"]
    : true;
console.log(
  `  Desktop preview  : ${core && rust && desktopExtra ? "READY  (bash start.sh run desktop)" : "NOT READY - Rust plus the OS build tools"}`,
);
console.log(
  `  Android          : ${android ? (ok["Android Virtual Device"] ? "READY  (bash start.sh run android)" : "tools ready; create an emulator or attach a USB phone") : "NOT READY - see MISSING rows"}`,
);
console.log(
  `  iOS              : ${mac ? (ok["Xcode (full)"] && rust ? "READY  (bash start.sh run ios)" : "install full Xcode, CocoaPods and the iOS Rust targets") : "not possible on this OS (Tauri iOS commands are macOS-only)"}`,
);
console.log(line("="));

if (process.argv.includes("--require-core") && !(nodeOk && ok.Git)) {
  console.error("Node.js 22.18 or newer and Git are required.");
  process.exit(1);
}
