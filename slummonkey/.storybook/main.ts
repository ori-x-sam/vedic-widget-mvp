import type { StorybookConfig } from "@storybook/html-vite";

const config: StorybookConfig = {
  stories: ["../stories/**/*.stories.ts"],
  addons: ["@storybook/addon-vitest"],
  framework: { name: "@storybook/html-vite", options: {} },
  core: { disableTelemetry: true },
};
export default config;
