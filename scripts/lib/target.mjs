/**
 * Target-folder rules shared by the Expo and Tauri generators.
 *
 * A target is where a new app is written. It may be:
 *   - a folder that does not exist yet (it is created),
 *   - an empty folder, or
 *   - a freshly created repository that holds only the files a Git host adds
 *     when a repository is created (see ALLOWED_EXISTING).
 * Anything else is refused, so a generator can never overwrite real work.
 *
 * When the target already has one of the allowed files, the user's copy is
 * kept and the template's copy is placed beside it (README, LICENSE) or merged
 * into it line by line (.gitignore, .gitattributes). Nothing is deleted.
 */
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

/** Files and folders a new hosted repository may already contain. */
export const ALLOWED_EXISTING = [
  ".git",
  ".github",
  "README.md",
  "LICENSE",
  "LICENSE.md",
  "LICENSE.txt",
  ".gitignore",
  ".gitattributes",
];

/** Folders never copied out of a template. */
const NEVER_COPY = new Set(["node_modules", ".git", ".expo", "dist", "out", ".next", "target", "gen"]);

/**
 * Validates the target and returns the names of the allowed files it already has.
 * Throws when the target holds anything else.
 */
export function inspectTarget(target, { builderRoot } = {}) {
  const resolved = path.resolve(target);
  if (builderRoot) {
    const relative = path.relative(path.resolve(builderRoot), resolved);
    if (relative === "" || (!relative.startsWith("..") && !path.isAbsolute(relative))) {
      throw new Error(`Refusing to generate inside the builder repository itself: ${resolved}`);
    }
  }
  if (!fs.existsSync(resolved)) return { target: resolved, existing: [], hasGit: false };
  if (!fs.statSync(resolved).isDirectory()) throw new Error(`Target exists and is not a folder: ${resolved}`);
  const entries = fs.readdirSync(resolved);
  const unexpected = entries.filter((entry) => !ALLOWED_EXISTING.includes(entry));
  if (unexpected.length > 0) {
    throw new Error(
      `Target must be new, empty, or a new repository containing only ${ALLOWED_EXISTING.join(", ")}.\n` +
        `Found: ${unexpected.slice(0, 10).join(", ")}${unexpected.length > 10 ? " ..." : ""}\n` +
        "Nothing was changed. Choose another folder or move those files first.",
    );
  }
  return { target: resolved, existing: entries, hasGit: entries.includes(".git") };
}

function mergeLines(destination, source, banner) {
  const current = fs.readFileSync(destination, "utf8");
  const have = new Set(current.split(/\r?\n/u).map((line) => line.trim()));
  const additions = fs
    .readFileSync(source, "utf8")
    .split(/\r?\n/u)
    .filter((line) => line.trim() && !line.trim().startsWith("#") && !have.has(line.trim()));
  if (additions.length === 0) return 0;
  const separator = current.endsWith("\n") || current.length === 0 ? "" : "\n";
  fs.writeFileSync(destination, `${current}${separator}\n# ${banner}\n${additions.join("\n")}\n`);
  return additions.length;
}

/**
 * Copies a template into the target, keeping every allowed file the target
 * already has. Returns a list of human-readable notes about kept or merged files.
 */
export function copyTemplate(templateDir, target, existing, { extraSkip = [] } = {}) {
  const notes = [];
  const skip = new Set([...NEVER_COPY, ...extraSkip]);
  const keepTopLevel = new Set(existing.filter((entry) => entry !== ".git" && entry !== ".github"));
  fs.mkdirSync(target, { recursive: true });
  fs.cpSync(templateDir, target, {
    recursive: true,
    force: false,
    errorOnExist: false,
    filter(source) {
      const relative = path.relative(templateDir, source);
      if (relative === "") return true;
      const parts = relative.split(path.sep);
      if (parts.some((part) => skip.has(part))) return false;
      return !(parts.length === 1 && keepTopLevel.has(parts[0]));
    },
  });

  for (const name of keepTopLevel) {
    const templateFile = path.join(templateDir, name);
    if (!fs.existsSync(templateFile)) continue;
    const userFile = path.join(target, name);
    if (name === ".gitignore" || name === ".gitattributes") {
      const added = mergeLines(userFile, templateFile, "Added by Mobile Starter App Builder");
      notes.push(`${name}: kept yours and appended ${added} template line(s).`);
    } else if (name === "README.md") {
      fs.mkdirSync(path.join(target, "docs"), { recursive: true });
      fs.copyFileSync(templateFile, path.join(target, "docs", "STARTER_README.md"));
      notes.push("README.md: kept yours; the template README is at docs/STARTER_README.md.");
    } else if (name.startsWith("LICENSE")) {
      fs.mkdirSync(path.join(target, "licenses"), { recursive: true });
      fs.copyFileSync(templateFile, path.join(target, "licenses", "TEMPLATE_LICENSE.txt"));
      notes.push(`${name}: kept yours; the template's license (keep it for attribution) is at licenses/TEMPLATE_LICENSE.txt.`);
    }
  }
  // A repository may have LICENSE.md while the template ships LICENSE (or the reverse).
  const templateLicense = path.join(templateDir, "LICENSE");
  const userHasOtherLicense = [...keepTopLevel].some((name) => name.startsWith("LICENSE") && name !== "LICENSE");
  if (userHasOtherLicense && fs.existsSync(path.join(target, "LICENSE")) && fs.existsSync(templateLicense)) {
    fs.mkdirSync(path.join(target, "licenses"), { recursive: true });
    fs.renameSync(path.join(target, "LICENSE"), path.join(target, "licenses", "TEMPLATE_LICENSE.txt"));
    notes.push("The template's LICENSE was moved to licenses/TEMPLATE_LICENSE.txt so your license file stays the only one at the root.");
  }
  return notes;
}

/** Initializes a `main` branch unless the target is already a Git repository. */
export function ensureGitRepository(target, hasGit) {
  if (hasGit) return "Existing Git repository kept (no commit, no push).";
  const result = spawnSync("git", ["init", "-b", "main"], { cwd: target, encoding: "utf8", shell: false });
  if (result.status !== 0) throw new Error(`git init failed: ${result.stderr || result.error?.message}`);
  return "Initialized a new Git repository on branch main (no remote, no commit).";
}

/** Path to Git Bash on Windows, or plain bash elsewhere. */
export function bashCommand() {
  const gitBash = "C:\\Program Files\\Git\\bin\\bash.exe";
  return process.platform === "win32" && fs.existsSync(gitBash) ? gitBash : "bash";
}
