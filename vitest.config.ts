import { defineConfig } from "vitest/config";
import { loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

const env = loadEnv("test", process.cwd(), "");
const testDbUrl = env.TEST_DATABASE_URL;

const alias = { "@": path.resolve(__dirname, "./src") };

export default defineConfig({
  plugins: [react()],
  resolve: { alias },
  test: {
    globals: true,
    projects: [
      {
        extends: true,
        test: {
          name: "unit",
          environment: "jsdom",
          setupFiles: ["./tests/setup.ts"],
          include: ["tests/unit/**/*.{test,spec}.{ts,tsx}"],
        },
      },
      {
        extends: true,
        test: {
          name: "integration",
          environment: "node",
          include: ["tests/integration/**/*.{test,spec}.ts"],
          // Todos os testes de integração compartilham um único banco: execução serial.
          fileParallelism: false,
          setupFiles: ["./tests/integration/setup.ts"],
          // Garante que a aplicação NUNCA use o banco de desenvolvimento durante os testes.
          env: {
            DATABASE_URL: testDbUrl ?? "",
            DIRECT_URL: testDbUrl ?? "",
            AUTH_SECRET: "test-secret-test-secret-test-secret-123",
            NODE_ENV: "test",
          },
        },
      },
    ],
  },
});
