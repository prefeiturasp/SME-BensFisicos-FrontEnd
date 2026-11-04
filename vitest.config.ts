import path from 'node:path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    testTimeout: 10000,
    setupFiles: ['./src/setupTests.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
    coverage: {
      reporter: ["text", "lcov"],
      reportsDirectory: "./coverage",
      exclude: [
        "**/.next/**", // 👈 Exclui TUDO dentro de .next/
        "src/components/ui/**", // 👈 Exclui apenas a pasta 'ui' dentro de components
        "src/const.ts",
        "src/app/api/*",
        "*/types/*",
        "next.config.mjs",
        "tailwind.config.js",
        "postcss.config.mjs",
        "src/lib/zod-i18n.ts",
        "next-env.d.ts",
        "vitest.config.ts",
        "eslint.config.mjs",
        "*/.next/*", // Pode ser redundante, mas não atrapalha
        "testes/**", // Exclui a pasta de testes de QA
        "cypress.config.js", // Exclui config do Cypress
        "cypress/support/**", // Exclui arquivos de suporte do Cypress
      ],
    },
  },
});
