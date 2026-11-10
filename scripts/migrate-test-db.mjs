// Aplica as migrations versionadas no banco de TESTES (fitflow_test).
// Nunca toca o banco de desenvolvimento: usa exclusivamente TEST_DATABASE_URL.
import { spawnSync } from "node:child_process";

process.loadEnvFile(".env");

const url = process.env.TEST_DATABASE_URL;
if (!url) {
  console.error("TEST_DATABASE_URL não definido no .env");
  process.exit(1);
}
if (!/\/fitflow_test(\?|$)/.test(url)) {
  console.error("Recusado: TEST_DATABASE_URL deve apontar para o banco 'fitflow_test'.");
  process.exit(1);
}

const result = spawnSync("npx", ["prisma", "migrate", "deploy"], {
  stdio: "inherit",
  shell: true,
  env: { ...process.env, DATABASE_URL: url, DIRECT_URL: url },
});
process.exit(result.status ?? 1);
