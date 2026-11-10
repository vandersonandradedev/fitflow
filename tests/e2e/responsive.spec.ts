import { test, expect, type Page } from "@playwright/test";
import { prisma } from "@/lib/db";

const VIEWPORTS = [
  { name: "mobile", width: 375, height: 812 },
  { name: "tablet", width: 768, height: 1024 },
  { name: "desktop", width: 1440, height: 900 },
] as const;

async function assertNoHorizontalOverflow(page: Page) {
  const { scrollWidth, innerWidth } = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    innerWidth: window.innerWidth,
  }));
  expect(scrollWidth).toBeLessThanOrEqual(innerWidth);
}

test.describe("FitFlow — Responsividade Mobile, Tablet e Desktop", () => {
  test("1. Landing e telas de autenticação sem overflow horizontal", async ({ page }) => {
    for (const vp of VIEWPORTS) {
      await page.setViewportSize({ width: vp.width, height: vp.height });

      for (const route of ["/", "/login", "/register", "/forgot-password"]) {
        await page.goto(route);
        await assertNoHorizontalOverflow(page);
      }
    }
  });

  test("2. Painel do Treinador responsivo e drawer mobile funcional", async ({ page }) => {
    const uniqueId = Date.now();
    const coachEmail = `coach_resp_${uniqueId}@fitflow.test`;

    await page.goto("/register");
    await page.fill("input[name='name']", `Personal Resp ${uniqueId}`);
    await page.fill("input[name='tenantName']", `Studio Resp ${uniqueId}`);
    await page.fill("input[name='email']", coachEmail);
    await page.fill("input[name='password']", "SenhaForteResp!123");
    await page.check("input[name='acceptTerms']");
    await page.click("button[type='submit']");
    await expect(page.getByText(/verifique seu e-mail/i)).toBeVisible({ timeout: 10000 });

    await prisma.user.update({
      where: { email: coachEmail },
      data: { emailVerified: new Date() },
    });

    await page.goto("/login");
    await page.fill("input[name='email']", coachEmail);
    await page.fill("input[name='password']", "SenhaForteResp!123");
    await page.click("button[type='submit']");
    await expect(page).toHaveURL(/\/coach\/dashboard/, { timeout: 10000 });

    // Verifica drawer mobile em 375px
    await page.setViewportSize({ width: 375, height: 812 });
    const menuButton = page.getByRole("button", { name: /abrir menu/i });
    await expect(menuButton).toBeVisible();
    await menuButton.click();

    const mobileDrawer = page.getByLabel("Menu lateral móvel");
    await expect(mobileDrawer).toBeVisible();
    await mobileDrawer.getByRole("link", { name: /alunos/i }).click();
    await expect(page).toHaveURL(/\/coach\/students/);

    // Verifica zero overflow horizontal em todas as rotas do treinador nos 3 viewports
    const coachRoutes = [
      "/coach/dashboard",
      "/coach/students",
      "/coach/exercises",
      "/coach/workouts",
      "/coach/progress",
      "/coach/settings",
    ];

    for (const vp of VIEWPORTS) {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      for (const route of coachRoutes) {
        await page.goto(route);
        await assertNoHorizontalOverflow(page);
      }
    }
  });
});
