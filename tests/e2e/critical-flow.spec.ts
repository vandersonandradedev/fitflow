import { test, expect } from "@playwright/test";
import { prisma } from "@/lib/db";

test.describe("FitFlow — Fluxo Crítico SaaS End-to-End", () => {
  test("1. Acessa a landing page e verifica links de navegação para login e cadastro", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("body")).toContainText(/FitFlow/i);
    await expect(page.getByRole("link", { name: /entrar/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /cadastrar personal/i })).toBeVisible();
  });

  test("2. Valida regras de formulário na tela de login", async ({ page }) => {
    await page.goto("/login");

    const submitBtn = page.locator("button[type='submit']");
    await submitBtn.click();

    await expect(page).toHaveURL(/\/login/);
  });

  test("3. Acessa página de cadastro do Personal Trainer e valida campos obrigatórios", async ({ page }) => {
    await page.goto("/register");

    await expect(page.getByText(/Criar Conta de Treinador/i)).toBeVisible();
    await expect(page.locator("input[name='name']")).toBeVisible();
    await expect(page.locator("input[name='tenantName']")).toBeVisible();
    await expect(page.locator("input[name='email']")).toBeVisible();
    await expect(page.locator("input[name='password']")).toBeVisible();
    await expect(page.locator("input[name='acceptTerms']")).toBeVisible();
  });

  test("4. Acessa recuperação de senha e link de convite inválido", async ({ page }) => {
    await page.goto("/forgot-password");
    await expect(page.locator("input[name='email']")).toBeVisible();

    await page.goto("/invite/token-falso-inexistente-123");
    await expect(page.getByText(/convite inválido ou expirado/i)).toBeVisible();
  });

  test("5. Verifica rotas protegidas redirecionando usuários não autenticados", async ({ page }) => {
    await page.goto("/coach/dashboard");
    await expect(page).toHaveURL(/\/login/);

    await page.goto("/coach/students");
    await expect(page).toHaveURL(/\/login/);

    await page.goto("/coach/exercises");
    await expect(page).toHaveURL(/\/login/);

    await page.goto("/coach/workouts");
    await expect(page).toHaveURL(/\/login/);

    await page.goto("/coach/progress");
    await expect(page).toHaveURL(/\/login/);

    await page.goto("/student/today");
    await expect(page).toHaveURL(/\/login/);

    await page.goto("/student/history");
    await expect(page).toHaveURL(/\/login/);
  });

  test("6. Verifica PWA Web App Manifest", async ({ request }) => {
    const response = await request.get("/manifest.webmanifest");
    expect(response.status()).toBe(200);
    const json = await response.json();
    expect(json.name).toContain("FitFlow");
    expect(json.display).toBe("standalone");
    expect(json.theme_color).toBe("#10B981");
  });

  test("7. Fluxo Completo: Cadastro real de Personal -> Verificação -> Login -> Acesso ao Dashboard", async ({ page }) => {
    const uniqueId = Date.now();
    const coachEmail = `coach_e2e_${uniqueId}@fitflow.test`;

    // 1. Cadastra Personal Trainer no formulário
    await page.goto("/register");
    await page.fill("input[name='name']", `Personal E2E ${uniqueId}`);
    await page.fill("input[name='tenantName']", `Studio E2E ${uniqueId}`);
    await page.fill("input[name='email']", coachEmail);
    await page.fill("input[name='password']", "SenhaForteE2E!123");
    await page.check("input[name='acceptTerms']");
    await page.click("button[type='submit']");

    // Confirma redirecionamento ou tela de aviso de verificação
    await expect(page.getByText(/verifique seu e-mail/i)).toBeVisible({ timeout: 10000 });

    // 2. Confirma verificação de e-mail diretamente no banco
    await prisma.user.update({
      where: { email: coachEmail },
      data: { emailVerified: new Date() },
    });

    // 3. Efetua login real com credenciais
    await page.goto("/login");
    await page.fill("input[name='email']", coachEmail);
    await page.fill("input[name='password']", "SenhaForteE2E!123");
    await page.click("button[type='submit']");

    // 4. Chega com sucesso ao Dashboard do treinador
    await expect(page).toHaveURL(/\/coach\/dashboard/, { timeout: 10000 });
    await expect(page.locator("body")).toContainText(new RegExp(`Studio E2E ${uniqueId}`, "i"));
    await expect(page.getByText(/total de alunos/i)).toBeVisible();
    await expect(page.getByText(/treinos da semana/i)).toBeVisible();
  });

  test("8. Verifica endpoint de manutenção e limpeza periódica (/api/cron/cleanup)", async ({ request }) => {
    const res = await request.get("/api/cron/cleanup");
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.report).toBeDefined();
    expect(body.report.durationMs).toBeGreaterThanOrEqual(0);
  });
});
