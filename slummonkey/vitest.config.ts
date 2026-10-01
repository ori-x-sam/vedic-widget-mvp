import { defineConfig } from "vitest/config";
import { storybookTest } from "@storybook/addon-vitest/vitest-plugin";
import { playwright } from "@vitest/browser-playwright";

export default defineConfig({
  test: {
    projects: [
      { extends: true, test: { name: "unit", include: ["tests/**/*.test.ts"], environment: "node" } },
      {
        extends: true,
        plugins: [storybookTest({ configDir: ".storybook" })],
        test: {
          name: "stories",
          testTimeout: 120000,
          browser: {
            enabled: true,
            headless: true,
            provider: playwright({
              launchOptions: {
                executablePath: process.env.CHROMIUM ?? "/opt/pw-browsers/chromium",
                args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"],
              },
            }),
            instances: [{ browser: "chromium" }],
          },
        },
      },
    ],
  },
});
