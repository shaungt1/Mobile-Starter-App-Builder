/**
 * Typed wrappers around Rust commands. Keep one wrapper per command so command
 * names and argument shapes live in one place.
 */
import { invoke } from "@tauri-apps/api/core";

export interface AppInfo {
  name: string;
  version: string;
  platform: string;
  arch: string;
  tauri: string;
}

/** True inside the Tauri app; false in a plain browser (bun run dev:web). */
export const isTauri = () => typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;

export const ipc = {
  app: {
    info: () => invoke<AppInfo>("app_info"),
  },
  shell: {
    openExternal: (url: string) => invoke<void>("open_external", { url }),
  },
};
