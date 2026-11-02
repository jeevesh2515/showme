import { defineConfig } from "vitest/config";

export default defineConfig({
  esbuild: { jsx: "automatic" }, // tsconfig keeps jsx for Next; component tests need it compiled
  test: {
    include: ["**/*.test.ts"],
    exclude: ["node_modules/**", ".next/**"],
  },
});
