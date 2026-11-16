import type { LaunchOptions } from '@playwright/test';

// SwiftShader gives a software WebGL context on machines without a GPU (CI, containers).
// PW_CHROMIUM_PATH lets a pre-installed Chromium be used instead of the Playwright download.
export const launchOptions: LaunchOptions = {
  executablePath: process.env.PW_CHROMIUM_PATH || undefined,
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'],
};
