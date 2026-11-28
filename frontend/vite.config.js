import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  envDir: "..",
  server: {
    port: 5173,
    strictPort: true,
  },
  test: {
    environment: "jsdom",
    setupFiles: "./tests/setup.js",
    include: ["tests/**/*.test.{js,jsx}"],
    env: { VITE_API_URL: "http://api.teste" },
  },
});
