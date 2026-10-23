import path from "node:path";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// Set by `tauri android dev` / `tauri ios dev` so a phone or emulator can reach this dev server.
const host = process.env.TAURI_DEV_HOST;

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: { alias: { "@": path.resolve(import.meta.dirname, "src") } },
  // Keep Rust compiler errors visible in the terminal.
  clearScreen: false,
  server: {
    // Must match build.devUrl in src-tauri/tauri.conf.json; fail instead of picking another port.
    port: 1420,
    strictPort: true,
    host: host || false,
    hmr: host ? { protocol: "ws", host, port: 1421 } : undefined,
    watch: { ignored: ["**/src-tauri/**"] },
  },
  build: {
    // Android System WebView is Chromium; iOS uses WKWebView (Safari 15+ on the supported iOS versions).
    target: process.env.TAURI_ENV_PLATFORM === "windows" ? "chrome105" : "safari15",
    minify: process.env.TAURI_ENV_DEBUG ? false : "oxc",
    sourcemap: Boolean(process.env.TAURI_ENV_DEBUG),
    // The bundle ships inside the app, not over the network, so one larger chunk is fine.
    chunkSizeWarningLimit: 2000,
  },
  envPrefix: ["VITE_", "TAURI_ENV_"],
});
