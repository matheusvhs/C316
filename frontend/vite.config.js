import tailwind from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react(), tailwind()],
  server: { port: 5173, strictPort: true },
  test: {
    environment: "jsdom",
    setupFiles: "./tests/setup.js",
    include: ["tests/**/*.test.{js,jsx}"],
    exclude: ["tests/e2e/**", "node_modules/**"],
  },
});
