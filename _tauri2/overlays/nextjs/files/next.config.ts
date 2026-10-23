/**
 * Next.js configuration for a Tauri app. Tauri has no Node server, so every
 * route is exported as static files into out/ (tauri.conf.json frontendDist).
 */
import type { NextConfig } from "next";

const isProduction = process.env.NODE_ENV === "production";
// Set by `tauri android dev` / `tauri ios dev` so a phone or emulator can reach the dev server.
const devHost = process.env.TAURI_DEV_HOST || "localhost";

const nextConfig: NextConfig = {
  output: "export",
  // The image optimizer needs a server; exported images are served as-is.
  images: { unoptimized: true },
  // Without this, assets do not resolve when the dev server is reached from the Tauri window or a device.
  assetPrefix: isProduction ? undefined : `http://${devHost}:1420`,
  // The dev server rejects other hosts unless they are listed; allow the device's address during mobile development.
  ...(process.env.TAURI_DEV_HOST ? { allowedDevOrigins: [process.env.TAURI_DEV_HOST] } : {}),
};

export default nextConfig;
