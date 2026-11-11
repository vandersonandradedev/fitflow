import { prisma } from "../src/lib/db";
import bcrypt from "bcryptjs";
import { resolveTenantContext } from "../src/server/auth/context";

async function main() {
  console.log("=== VERIFICANDO CONTA E CONTEXTO DO USUÁRIO VANDERSON ===");

  const email = "vandersonandrade_dev@outlook.com";
  const passwordInput = "85197726Van@";

  const user = await prisma.user.findUnique({
    where: { email },
    include: {
      memberships: { include: { tenant: true } },
      studentProfiles: true,
    },
  });

  if (!user) {
    throw new Error(`Usuário ${email} não foi encontrado.`);
  }

  console.log("1. Usuário encontrado no banco:", {
    id: user.id,
    name: user.name,
    email: user.email,
    emailVerified: user.emailVerified,
    sessionVersion: user.sessionVersion,
  });

  const passwordValid = await bcrypt.compare(passwordInput, user.passwordHash ?? "");
  console.log("2. Validação da senha:", passwordValid ? "✅ CORRETA" : "❌ INCORRETA");
  if (!passwordValid) throw new Error("Senha incorreta");

  const context = await resolveTenantContext(user.id, user.sessionVersion);
  console.log("3. Contexto de Tenant resolvido:", context);

  // Buscar programas ativos do aluno
  const programs = await prisma.trainingProgram.findMany({
    where: {
      tenantId: context.tenantId,
      studentProfileId: context.studentProfileId!,
      isActive: true,
    },
    include: {
      versions: {
        where: { status: "PUBLISHED" },
        include: {
          trainingDays: {
            orderBy: { orderIndex: "asc" },
            include: {
              workoutExercises: {
                include: {
                  exercise: {
                    include: {
                      media: true,
                    },
                  },
                  sets: true,
                },
              },
            },
          },
        },
      },
    },
  });

  console.log(`4. Programas ativos e publicados encontrados: ${programs.length}`);
  for (const p of programs) {
    const v = p.versions[0];
    console.log(`   - Programa: "${p.title}" (Meta: ${p.goal})`);
    console.log(`     Versão: v${v?.versionNumber} (${v?.status}), Dias de treino: ${v?.trainingDays.length}`);
    for (const d of v?.trainingDays ?? []) {
      const exCount = d.workoutExercises.length;
      const totalSets = d.workoutExercises.reduce((acc, wex) => acc + wex.sets.length, 0);
      const firstMedia = d.workoutExercises[0]?.exercise.media[0]?.url;
      console.log(`       * ${d.name} -> ${exCount} exercícios, ${totalSets} séries. Exemplo GIF: ${firstMedia}`);
    }
  }

  console.log("=== TUDO 100% VALIDADO E FUNCIONAL! ===");
}

main().catch(console.error).finally(() => prisma.$disconnect());
