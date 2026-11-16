/**
 * Configuration des tests automatisés (« npm test »).
 * Chaque fichier de test travaille sur sa propre base temporaire, créée à partir d'une
 * base modèle vide (voir tests/support/).
 */
import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: { alias: { "@": path.resolve(import.meta.dirname, "src") } },
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
    globalSetup: ["tests/support/global-setup.ts"],
    setupFiles: ["tests/support/setup.ts"],
    testTimeout: 30_000,
  },
});
