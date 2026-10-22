#!/usr/bin/env node
/**
 * Read-only report of what this machine can run: Expo Go, web, the Android
 * emulator, a USB Android phone and the iOS Simulator. It never installs
 * anything; the builder's install-prereqs script does that.
 *
 * Usage: node scripts/check-system.mjs [--require-core]
 *   --require-core  exit 1 when Node.js 22.18+ or Git is missing (used by setup).
 */
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const GB = 1024 ** 3;
const windows = process.platform === "win32";
const exe = (name) => (windows ? `${name}.exe` : name);

function capture(command, args = []) {
  try {
    const options = { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"], timeout: 8000 };
    const shell = windows && !/[\\/]/u.test(command);
    const output = shell
      ? execFileSync([command, ...args].join(" "), { ...options, shell: true })
      : execFileSync(command, args, options);
    return output.trim().split(/\r?\n/u)[0]?.slice(0, 70) ?? "";
  } catch (error) {
    // `java -version` prints to stderr.
    const stderr = String(error?.stderr ?? "").trim();
    return stderr && error?.status === 0 ? stderr.split(/\r?\n/u)[0] : undefined;
  }
}

function javaVersion(javaHome) {
  const release = javaHome ? path.join(javaHome, "release") : "";
  if (release && fs.existsSync(release)) {
    return fs.readFileSync(release, "utf8").match(/JAVA_VERSION="([^"]+)"/u)?.[1];
  }
  return undefined;
}

function findAndroidHome() {
  const candidates = [process.env.ANDROID_HOME, process.env.ANDROID_SDK_ROOT];
  if (windows && process.env.LOCALAPPDATA)
    candidates.push(path.join(process.env.LOCALAPPDATA, "Android", "Sdk"));
  candidates.push(
    path.join(os.homedir(), "Library", "Android", "sdk"),
    path.join(os.homedir(), "Android", "Sdk"),
  );
  return (
    candidates.find((dir) => dir && fs.existsSync(path.join(dir, "platform-tools", exe("adb")))) ??
    ""
  );
}

function findJava17() {
  const candidates = [process.env.JAVA_HOME];
  const roots = windows
    ? ["C:\\Program Files\\Eclipse Adoptium", "C:\\Program Files\\Microsoft"]
    : ["/Library/Java/JavaVirtualMachines", "/usr/lib/jvm"];
  for (const root of roots) {
    if (!fs.existsSync(root)) continue;
    for (const entry of fs.readdirSync(root)) {
      const home = path.join(root, entry, process.platform === "darwin" ? "Contents/Home" : "");
      candidates.push(home);
    }
  }
  return candidates.find((home) => home && javaVersion(home)?.startsWith("17")) ?? "";
}

function freeDiskGb() {
  try {
    const stat = fs.statfsSync(process.cwd());
    return (stat.bsize * stat.bavail) / GB;
  } catch {
    return null;
  }
}

const [nodeMajor = 0, nodeMinor = 0] = process.versions.node.split(".").map(Number);
const nodeReady = nodeMajor > 22 || (nodeMajor === 22 && nodeMinor >= 18);
const androidHome = findAndroidHome();
const javaHome = findJava17();
const sdkTool = (...parts) => (androidHome ? path.join(androidHome, ...parts) : "");
const adb = sdkTool("platform-tools", exe("adb"));
const emulator = sdkTool("emulator", exe("emulator"));
const avds = emulator && fs.existsSync(emulator) ? capture(emulator, ["-list-avds"]) : undefined;

const tools = [
  {
    name: "Node.js 22.18+",
    found: `${process.version}${nodeReady ? "" : " (upgrade required)"}`,
    ok: nodeReady,
  },
  { name: "Bun", found: capture("bun", ["--version"]) },
  { name: "Git", found: capture("git", ["--version"]) },
  { name: "Java 17 JDK", found: javaHome ? `${javaVersion(javaHome)} at ${javaHome}` : undefined },
  { name: "Android SDK", found: androidHome || undefined },
  { name: "adb", found: adb && fs.existsSync(adb) ? capture(adb, ["--version"]) : undefined },
  {
    name: "Android emulator",
    found: emulator && fs.existsSync(emulator) ? "installed" : undefined,
  },
  { name: "Android Virtual Device", found: avds || undefined },
];
if (process.platform === "darwin") {
  tools.push(
    { name: "Xcode", found: capture("xcodebuild", ["-version"]) },
    { name: "CocoaPods", found: capture("pod", ["--version"]) },
    { name: "Watchman", found: capture("watchman", ["--version"]) },
  );
}
for (const tool of tools) tool.ok ??= Boolean(tool.found);

const ok = (name) => tools.find((tool) => tool.name === name)?.ok ?? false;
const totalGb = os.totalmem() / GB;
const disk = freeDiskGb();
const line = (char = "-") => char.repeat(68);

console.log(line("="));
console.log(" Mobile app host report (read-only)");
console.log(line("="));
console.log(`OS   : ${os.platform()} ${os.release()} (${os.arch()})`);
console.log(`CPU  : ${os.cpus().length} cores - ${os.cpus()[0]?.model ?? "unknown"}`);
console.log(`RAM  : ${totalGb.toFixed(1)} GB total`);
console.log(`Disk : ${disk === null ? "n/a" : `${disk.toFixed(1)} GB free here`}`);
console.log(line());
for (const tool of tools) {
  console.log(
    `  ${(tool.ok ? "OK" : "MISSING").padEnd(8)} ${tool.name.padEnd(24)} ${tool.found ?? ""}`,
  );
}
console.log(line());
const core = nodeReady && ok("Bun") && ok("Git");
const android =
  core && ok("Java 17 JDK") && ok("Android SDK") && ok("adb") && ok("Android emulator");
console.log(
  `  Web and Expo Go        : ${core ? "READY  (bash start.sh run web | go)" : "NOT READY - install Node 22.18+, Bun and Git"}`,
);
console.log(
  `  Android emulator       : ${android ? (ok("Android Virtual Device") ? "READY  (bash start.sh run android)" : "SDK ready; create an AVD first") : "NOT READY - Java 17 + Android SDK/emulator needed"}`,
);
console.log(
  `  USB Android phone      : ${android ? "READY when a phone with USB debugging is attached (run usb)" : "NOT READY - same tools as the emulator"}`,
);
console.log(
  `  iOS Simulator          : ${process.platform === "darwin" ? (ok("Xcode") ? "READY  (bash start.sh run ios)" : "install Xcode from the App Store") : "not possible on this OS - use an EAS cloud build"}`,
);
console.log(line());
console.log("  Emulators and simulators cannot test Bluetooth, real camera input, purchases or");
console.log(
  "  on-device AI acceleration; use a physical phone with a development build for those.",
);
if (totalGb < 8)
  console.log("  Less than 8 GB RAM: the Android emulator will be slow; prefer a physical phone.");
if (disk !== null && disk < 20)
  console.log("  Less than 20 GB free: Android SDK, NDK, images and Gradle caches need 25-30 GB.");
console.log(line("="));

if (process.argv.includes("--require-core") && !(nodeReady && ok("Git"))) {
  console.error("Node.js 22.18 or newer and Git are required.");
  process.exit(1);
}
