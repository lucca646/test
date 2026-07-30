import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";
import path from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: [
        "favicon.svg",
        "apple-touch-icon.png",
        "liquid-lens-blob.png",
        "liquid-lens-pill.png",
      ],
      manifest: {
        name: "Liquid Glass",
        short_name: "LiquidGlass",
        description: "Playground Liquid Glass style App Store Apple",
        theme_color: "#000000",
        background_color: "#050508",
        display: "standalone",
        orientation: "portrait",
        start_url: "/",
        scope: "/",
        lang: "fr",
        icons: [
          {
            src: "pwa-192.png",
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: "pwa-512.png",
            sizes: "512x512",
            type: "image/png",
          },
          {
            src: "pwa-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2}"],
        navigateFallback: "/index.html",
      },
      devOptions: {
        enabled: true,
      },
    }),
  ],
  resolve: {
    dedupe: ["react", "react-dom"],
    alias: {
      react: path.resolve(rootDir, "node_modules/react"),
      "react-dom": path.resolve(rootDir, "node_modules/react-dom"),
      "@samasante/liquid-glass": path.resolve(
        rootDir,
        "node_modules/@samasante/liquid-glass",
      ),
    },
  },
  optimizeDeps: {
    include: ["@samasante/liquid-glass"],
  },
  server: {
    host: "127.0.0.1",
    port: 5177,
    allowedHosts: [".trycloudflare.com", "localhost", "127.0.0.1"],
    fs: { allow: [rootDir] },
  },
  preview: {
    host: "127.0.0.1",
    port: 4177,
    allowedHosts: [".trycloudflare.com", "localhost", "127.0.0.1"],
  },
});
