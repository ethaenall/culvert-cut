import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "./tests/browser",
  use: { baseURL: "http://localhost:5173", headless: true },
  timeout: 30000,
});
