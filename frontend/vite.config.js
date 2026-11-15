import tailwind from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react(), tailwind()],
  server: {
    port: 5173,
    strictPort: true,
    // Em dev, as chamadas do frontend à API passam pelo proxy do Vite.
    proxy: { "/tarefas": "http://localhost:8000" },
  },
  test: {
    environment: "jsdom",
    setupFiles: "./tests/setup.js",
    include: ["tests/**/*.test.{js,jsx}"],
    exclude: ["tests/e2e/**", "node_modules/**"],
  },
});
