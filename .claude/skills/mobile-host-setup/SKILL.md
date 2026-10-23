---
name: mobile-host-setup
description: Detect the operating system and installed tools, then install whatever a mobile platform needs (Node, Bun, Git, Java 17, Android Studio, Android SDK/NDK, emulator, Rust, Xcode). Use before the first app on a machine or when a build fails for a missing tool.
---

# Machine setup

## Steps
1. `bash start.sh doctor --platform <expo|tauri|all>` and read the MISSING rows and the verdict lines.
2. `bash start.sh install-prereqs --platform <p> --dry-run`; show the plan to the user, then run it without `--dry-run` (add `--yes` only when the user has approved installs).
3. If Android Studio was just installed, the user must open it once and finish the setup wizard, and tick "Android SDK Command-line Tools (latest)" in SDK Manager > SDK Tools. Say so plainly and wait.
4. `bash start.sh android-setup --set-env` installs platform-tools, emulator, Android 35, build-tools 36.0.0, the newest NDK and a system image, then creates an emulator.
5. On Windows, tell the user to reopen Git Bash and VS Code, then re-run `doctor`.
6. iOS needs a Mac with full Xcode; on Windows/Linux record iOS as not possible locally (Expo can use EAS cloud builds).

## Done when
`doctor` shows the targets the user needs as READY, or every remaining gap is reported as a manual step.
