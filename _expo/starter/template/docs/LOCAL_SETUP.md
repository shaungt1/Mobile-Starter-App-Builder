# Setting up a machine by hand

The builder repository that generated this app has scripts that detect the machine and install what is
missing (`bash start.sh doctor`, `install-prereqs` and `android-setup` there). This document is the
manual equivalent, for a person who prefers to install the tools themselves or for a machine the scripts
do not cover. It is derived from the LUMNI environment notes and the lessons recorded in the builder's
`docs/LESSONS_LEARNED.md`. Check what is already installed before installing anything: run
`bash start.sh system` in this app, which reports versions and what the machine can run.

## What each way of running needs

| To run                                        | You need                                                                                                                                                                               |
| --------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Web and Expo Go                               | Node.js 22.18 or newer, Bun, Git (Git Bash on Windows). Nothing else.                                                                                                                  |
| Android emulator or phone (development build) | The above, plus a Java 17 JDK, Android Studio with the Android SDK (platform, build tools, platform tools, command-line tools, emulator, NDK), and `ANDROID_HOME` pointing at the SDK. |
| iOS Simulator or phone (local build)          | A Mac with Xcode and its command-line tools. Without a Mac, use an EAS cloud build.                                                                                                    |

The versions an Expo build wants are printed at the start of its Gradle output (for SDK 57 the build
reported compile SDK 36, build tools 36.0.0 and NDK 27.1); install the ones your build reports.

## Windows (Git Bash)

1. Install Git for Windows (it provides Git Bash), Node.js 22.18+ and Bun. If Node.js is managed by
   nvm-windows, use `nvm install 22.18.0` and `nvm use 22.18.0` rather than a second Node.js installer.
2. Install a Java 17 JDK (for example Microsoft Build of OpenJDK 17 or Eclipse Temurin 17) and set
   `JAVA_HOME` to it. The launch scripts also search the usual JDK 17 folders themselves. Do not replace a
   working `JAVA_HOME` that already points at a JDK 17.
3. Install Android Studio, choose the Standard setup and include the Android Virtual Device.
4. In Android Studio, open Settings > Languages & Frameworks > Android SDK. Under SDK Platforms install
   the current Android API level; under SDK Tools install Android SDK Build-Tools, Android Emulator,
   Android SDK Platform-Tools and Android SDK Command-line Tools.
5. Set `ANDROID_HOME` to the SDK folder (by default `%LOCALAPPDATA%\Android\Sdk`) and add
   `%ANDROID_HOME%\platform-tools` and `%ANDROID_HOME%\emulator` to the user `Path`. The launch scripts
   find the default folder even when the variable is missing, but other tools do not.
6. Open a new terminal and verify with `java -version`, `adb version` and `emulator -version`.
7. Keep one Android SDK folder and one Android Studio installation. Several SDK folders are a common
   source of "wrong SDK" errors; remove old virtual devices from Android Studio's Device Manager before
   deleting their folders.

## macOS

1. Install Homebrew, then Node.js 22.18+, Bun and Git.
2. For Android: install a Java 17 JDK (`brew install --cask zulu@17` is the Azul build used in Expo's
   guidance at the time of writing; any JDK 17 works), install Android Studio, complete its setup wizard,
   and install the SDK packages named above.
3. Add to `~/.zshrc` and reload it:

   ```sh
   export JAVA_HOME=/Library/Java/JavaVirtualMachines/zulu-17.jdk/Contents/Home
   export ANDROID_HOME=$HOME/Library/Android/sdk
   export PATH=$PATH:$ANDROID_HOME/emulator:$ANDROID_HOME/platform-tools
   ```

4. For iOS: install Xcode from the Mac App Store, open it once, select the command-line tools under
   Xcode > Settings > Locations, and install an iOS simulator runtime under Settings > Components.
5. Verify: `java -version`, `adb version`, `xcode-select -p`, `xcrun simctl list devices`.

## Linux

Install Git, Node.js 22.18+ and Bun with your package manager or their official installers, then a
Java 17 JDK and Android Studio (extract it to `/opt/android-studio`, run `studio.sh` once). Set
`JAVA_HOME`, `ANDROID_HOME` (by default `$HOME/Android/Sdk`) and the `PATH` entries as in the macOS
example. iOS cannot be built on Linux.

## Checking it worked

```bash
bash start.sh system       # versions and what this machine can run
bash start.sh devices      # attached phones, emulators, simulators, serial ports
bash start.sh verify       # all static and unit checks
bash start.sh run web      # first launch
```

Emulators cannot test Bluetooth, real camera input, purchases or on-device AI performance; use a
physical phone with a development build for those.
