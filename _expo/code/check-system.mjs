import { execSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';

const GB = 1024 ** 3;

function line(char = '-') {
  return char.repeat(64);
}

function tryVersion(command) {
  try {
    const out = execSync(command, {
      stdio: ['ignore', 'pipe', 'ignore'],
      timeout: 6000,
    })
      .toString()
      .trim();
    return out.split('\n')[0].slice(0, 60);
  } catch {
    return null;
  }
}

function detectTool(name, command) {
  const version = tryVersion(command);
  return { name, present: version !== null, version };
}

function freeDiskGb() {
  try {
    const stat = fs.statfsSync(process.cwd());
    return (stat.bsize * stat.bavail) / GB;
  } catch {
    return null;
  }
}

function mark(ok) {
  return ok ? 'OK ' : 'ACTION';
}

function main() {
  const platform = os.platform();
  const [nodeMajor, nodeMinor] = process.versions.node.split('.').map(Number);
  const nodeReady = nodeMajor > 22 || (nodeMajor === 22 && nodeMinor >= 18);
  const totalGb = os.totalmem() / GB;
  const freeGb = os.freemem() / GB;
  const cpus = os.cpus();
  const cores = cpus.length;
  const cpuModel = cpus[0]?.model ?? 'unknown';
  const disk = freeDiskGb();

  const tools = [
    {
      name: 'node >=22.18',
      present: nodeReady,
      version: `${process.version}${nodeReady ? '' : ' (upgrade required)'}`,
    },
    detectTool('bun', 'bun --version'),
    detectTool('git', 'git --version'),
    detectTool('java', platform === 'win32' ? 'java -version 2>&1' : 'java -version'),
    detectTool('adb', 'adb --version'),
    detectTool('emulator', 'emulator -version'),
    detectTool('sdkmanager', 'sdkmanager --version'),
  ];

  const androidHome = process.env.ANDROID_HOME || process.env.ANDROID_SDK_ROOT || '';
  const javaHome = process.env.JAVA_HOME || '';

  const hasJava = tools.find((t) => t.name === 'java')?.present ?? false;
  const hasAdb = tools.find((t) => t.name === 'adb')?.present ?? false;
  const hasEmulator = tools.find((t) => t.name === 'emulator')?.present ?? false;
  const hasBun = tools.find((t) => t.name === 'bun')?.present ?? false;

  const emulatorReady = hasJava && hasAdb && hasEmulator && androidHome.length > 0;
  const emulatorComfortable = emulatorReady && totalGb >= 8 && (disk === null || disk >= 15);

  console.log(line('='));
  console.log(' Expo App Starter — Host System Capability Report');
  console.log(line('='));
  console.log(`OS            : ${platform} ${os.release()} (${os.arch()})`);
  console.log(`CPU           : ${cores} cores — ${cpuModel}`);
  console.log(`RAM           : ${totalGb.toFixed(1)} GB total, ${freeGb.toFixed(1)} GB free now`);
  console.log(`Disk (cwd)    : ${disk === null ? 'n/a' : `${disk.toFixed(1)} GB free`}`);
  console.log(`ANDROID_HOME  : ${androidHome || '(not set)'}`);
  console.log(`JAVA_HOME     : ${javaHome || '(not set)'}`);
  console.log(line());
  console.log(' Toolchain');
  console.log(line());
  for (const tool of tools) {
    console.log(`  ${mark(tool.present).padEnd(8)} ${tool.name.padEnd(12)} ${tool.version ?? ''}`);
  }

  console.log(line());
  console.log(' Verdict');
  console.log(line());
  console.log(
    `  Expo Go (themes, screens, gestures, animations, mock data, cloud APIs):`
  );
  console.log(
    hasBun && nodeReady
      ? '     READY. From the playbook, run `bash start.sh run <app> go`.'
      : '     NOT READY. Install Node 22.18+ and Bun, then run `bash start.sh setup <app>`.'
  );
  console.log('');
  console.log('  Android emulator (dev client, UI + on-device speech):');
  if (emulatorComfortable) {
    console.log('     READY and comfortable on this hardware.');
  } else if (emulatorReady) {
    console.log('     Possible, but RAM/disk is tight — prefer a physical phone or Expo Go.');
  } else {
    const missing = [];
    if (!hasJava) missing.push('Java 17');
    if (!androidHome) missing.push('ANDROID_HOME + Android SDK');
    if (!hasEmulator) missing.push('emulator');
    if (!hasAdb) missing.push('adb/platform-tools');
    console.log(`     NOT READY. Missing: ${missing.join(', ')}. See QUICKSTART.md.`);
  }
  console.log('');
  console.log('  AI workloads — where each can run:');
  console.log('     Cloud LLM/VLM (OpenAI/Anthropic/Grok via fetch) : ANY target incl. Expo Go.');
  console.log('     On-device OCR (ML Kit)                          : physical device only.');
  console.log('     On-device LLM/VLM (llama.rn / ONNX)             : physical device (NPU/GPU),');
  console.log('        or run as standalone scripts on this host — NOT the emulator.');
  console.log('     Emulator does NOT accelerate on-device AI; use scripts or a real phone.');

  console.log(line());
  console.log(' Notes');
  console.log(line());
  if (totalGb < 8) {
    console.log('  * < 8 GB RAM: emulator will be slow. Use Expo Go on a real phone as the main loop.');
  }
  if (!nodeReady) {
    console.log('  * Current template and Supabase client tooling require Node 22.18+.');
  }
  console.log('  * Genymotion is an emulator alternative, but it still cannot run on-device AI models;');
  console.log('    it helps UI testing only. For AI, use cloud (Expo Go), node scripts, or a real phone.');
  console.log('  * BLE and the camera do not work in ANY emulator — those need a physical device.');
  console.log(line('='));
}

main();
