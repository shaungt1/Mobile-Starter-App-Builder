/**
 * Light/dark theme. Inside the app the choice is saved with the Tauri store
 * plugin (preferences.json in the app data folder); in a plain browser it falls
 * back to localStorage so `bun run dev:web` works too. "system" follows the OS.
 */
import { load } from "@tauri-apps/plugin-store";
import { isTauri } from "@/lib/ipc";

export type ThemeMode = "system" | "light" | "dark";

const STORE_FILE = "preferences.json";
const KEY = "theme";
const systemDark = () => window.matchMedia?.("(prefers-color-scheme: dark)").matches ?? false;

export function applyTheme(mode: ThemeMode): boolean {
  const dark = mode === "dark" || (mode === "system" && systemDark());
  document.documentElement.classList.toggle("dark", dark);
  return dark;
}

export async function getThemeMode(): Promise<ThemeMode> {
  if (!isTauri()) {
    try {
      return (localStorage.getItem(KEY) as ThemeMode | null) ?? "system";
    } catch {
      return "system";
    }
  }
  const store = await load(STORE_FILE, { defaults: { [KEY]: "system" } });
  return (await store.get<ThemeMode>(KEY)) ?? "system";
}

export async function setThemeMode(mode: ThemeMode): Promise<{ mode: ThemeMode; dark: boolean }> {
  if (isTauri()) {
    const store = await load(STORE_FILE, { defaults: { [KEY]: "system" } });
    await store.set(KEY, mode);
    await store.save();
  } else {
    try {
      localStorage.setItem(KEY, mode);
    } catch {
      // Private browsing: the choice lasts for this session only.
    }
  }
  return { mode, dark: applyTheme(mode) };
}

/** Applies the saved theme and keeps "system" in sync with OS changes. */
export async function initTheme(): Promise<void> {
  applyTheme(await getThemeMode());
  window.matchMedia?.("(prefers-color-scheme: dark)").addEventListener("change", () => {
    void getThemeMode().then(applyTheme);
  });
}
