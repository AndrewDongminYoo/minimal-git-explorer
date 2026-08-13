import { defineConfig } from "@vscode/test-cli";

export default defineConfig({
  files: "out/test/**/*.test.js",
  version: process.env.VSCODE_TEST_VERSION ?? "stable",
  env: {
    VSCODE_CLI: "1",
  },
  mocha: {
    timeout: 10000,
  },
});
