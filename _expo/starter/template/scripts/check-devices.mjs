#!/usr/bin/env node
/**
 * Read-only list of connected Android phones and emulators, Apple devices and
 * simulators (macOS), and USB serial ports (for apps that talk to hardware).
 * Run it after plugging something in. It never flashes or changes a device.
 */
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";

function run(command, args = []) {
  try {
    return execFileSync(command, args, {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
      timeout: 8000,
    }).trim();
  } catch {
    return null;
  }
}

function block(title, value, empty) {
  console.log(`\n${title}\n${"-".repeat(68)}\n${value || empty}`);
}

block(
  "Android devices and emulators (adb devices -l)",
  run("adb", ["devices", "-l"]),
  "adb is not on PATH. Install Android SDK Platform-Tools, or run a launcher script (it finds the SDK itself).",
);
if (os.platform() === "darwin") {
  block(
    "Apple devices and simulators",
    run("xcrun", ["xctrace", "list", "devices"]),
    "Xcode tools are unavailable.",
  );
}
const serial =
  os.platform() === "win32"
    ? run("powershell.exe", [
        "-NoProfile",
        "-NonInteractive",
        "-Command",
        'Get-CimInstance Win32_SerialPort | ForEach-Object { "$($_.DeviceID)  $($_.Name)" }',
      ])
    : (() => {
        try {
          return fs
            .readdirSync("/dev")
            .filter((name) => /^(cu\.|tty\.(usb|wch)|ttyUSB|ttyACM)/u.test(name))
            .map((name) => `/dev/${name}`)
            .join("\n");
        } catch {
          return "";
        }
      })();
block(
  "USB serial ports",
  serial,
  "No serial port detected. Use a data-capable USB cable and install the board's driver if needed.",
);
