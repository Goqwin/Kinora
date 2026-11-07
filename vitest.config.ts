import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
    setupFiles: ["./tests/setup.ts"],
  },
  resolve: {
    alias: [
      {
        find: "@/lib/personalization",
        replacement: path.resolve(__dirname, "src/lib/personalization"),
      },
      {
        find: "@",
        replacement: path.resolve(__dirname, "."),
      },
    ],
  },
});
