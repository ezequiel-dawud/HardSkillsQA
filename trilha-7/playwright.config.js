// @ts-check
const { defineConfig, devices } = require("@playwright/test");

module.exports = defineConfig({
  testDir: "./tests",
  fullyParallel: true,
  reporter: [["list"], ["json", { outputFile: "resultado.json" }]],
  use: {
    baseURL: process.env.BASE_URL || "https://qa-learning-treino-production.up.railway.app",
    trace: "retain-on-failure",
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
  ],
});
