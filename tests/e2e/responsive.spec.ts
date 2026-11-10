import { test, expect, type Page } from "@playwright/test";
import { prisma } from "@/lib/db";
import { hashPassword } from "@/server/security/password";

const VIEWPORTS = [
  { name: "mobile-compact", width: 360, height: 780 },
  { name: "mobile", width: 390, height: 844 },
  { name: "tablet", width: 768, height: 1024 },
  { name: "notebook", width: 1280, height: 800 },
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

    // Verifica drawer mobile em 360px
    await page.setViewportSize({ width: 360, height: 780 });
    const menuButton = page.getByRole("button", { name: /abrir menu/i });
    await expect(menuButton).toBeVisible();
    await menuButton.click();

    const mobileDrawer = page.getByLabel("Menu lateral móvel");
    await expect(mobileDrawer).toBeVisible();
    await mobileDrawer.getByRole("link", { name: /alunos/i }).click();
    await expect(page).toHaveURL(/\/coach\/students/);

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

  test("3. Portal do Aluno e execução de treino responsivos em 360px a 1440px", async ({ page }) => {
    const uniqueId = Date.now();
    const studentEmail = `student_resp_${uniqueId}@fitflow.test`;
    const passwordHash = await hashPassword("SenhaAlunoE2E!123");

    const tenant = await prisma.tenant.create({
      data: { name: `Studio Aluno ${uniqueId}`, slug: `studio-aluno-${uniqueId}` },
    });
    const coachUser = await prisma.user.create({
      data: {
        email: `coach_for_st_${uniqueId}@fitflow.test`,
        name: "Treinador Resp",
        passwordHash,
        emailVerified: new Date(),
      },
    });
    await prisma.tenantMember.create({
      data: { tenantId: tenant.id, userId: coachUser.id, role: "OWNER" },
    });

    const studentUser = await prisma.user.create({
      data: {
        email: studentEmail,
        name: "Aluno Responsivo",
        passwordHash,
        emailVerified: new Date(),
      },
    });
    await prisma.tenantMember.create({
      data: { tenantId: tenant.id, userId: studentUser.id, role: "STUDENT" },
    });
    const studentProfile = await prisma.studentProfile.create({
      data: { tenantId: tenant.id, userId: studentUser.id, status: "ACTIVE" },
    });

    let category = await prisma.exerciseCategory.findFirst();
    if (!category) {
      category = await prisma.exerciseCategory.create({
        data: { name: "Peito", slug: `peito-${uniqueId}` },
      });
    }
    const exercise = await prisma.exercise.create({
      data: {
        categoryId: category.id,
        tenantId: tenant.id,
        isGlobal: false,
        name: `Supino Reto ${uniqueId}`,
        primaryMuscleGroup: "Peitoral Maior",
        equipment: "BARBELL",
        difficulty: "INTERMEDIATE",
        instructions: {
          create: [
            { stepNumber: 1, instruction: "Apoie os pés firmes no chão.", safetyTip: "Mantenha escápulas retraídas." },
          ],
        },
      },
    });

    await prisma.trainingProgram.create({
      data: {
        tenantId: tenant.id,
        studentProfileId: studentProfile.id,
        title: "Mesociclo Teste Responsivo",
        isActive: true,
        versions: {
          create: {
            versionNumber: 1,
            status: "PUBLISHED",
            trainingDays: {
              create: {
                name: "Treino A — Peito",
                dayOfWeek: "MONDAY",
                orderIndex: 0,
                workoutExercises: {
                  create: {
                    exerciseId: exercise.id,
                    orderIndex: 0,
                    sets: {
                      create: [
                        { setNumber: 1, repsTarget: "10", suggestedLoadKg: 40, restSeconds: 60 },
                        { setNumber: 2, repsTarget: "10", suggestedLoadKg: 40, restSeconds: 60 },
                      ],
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    await page.goto("/login");
    await page.fill("input[name='email']", studentEmail);
    await page.fill("input[name='password']", "SenhaAlunoE2E!123");
    await page.click("button[type='submit']");
    await expect(page).toHaveURL(/\/student\/today/, { timeout: 10000 });

    const studentRoutes = [
      "/student/today",
      "/student/week",
      "/student/history",
      "/student/profile",
    ];

    for (const vp of VIEWPORTS) {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      for (const route of studentRoutes) {
        await page.goto(route);
        await assertNoHorizontalOverflow(page);
      }
    }

    // Inicia sessão e valida WorkoutRunner em 360px
    await page.setViewportSize({ width: 360, height: 780 });
    await page.goto("/student/today");
    await page.getByRole("button", { name: /iniciar treino agora/i }).click();
    await expect(page).toHaveURL(/\/student\/session\//, { timeout: 10000 });
    await assertNoHorizontalOverflow(page);

    // Abre instruções e vídeo do exercício
    await page.getByRole("button", { name: /instruções e vídeo/i }).click();
    await expect(page.getByText(/Apoie os pés firmes no chão/i)).toBeVisible();
    await page.keyboard.press("Escape");

    // Marca uma série como concluída e valida timer sem overflow
    await page.getByRole("button", { name: /marcar série 1 como concluída/i }).click();
    await expect(page.getByText(/descanso entre séries/i)).toBeVisible();
    await assertNoHorizontalOverflow(page);
  });
});
