import { describe, expect, it } from "vitest";
import {
  createProgramForStudent,
  deleteTrainingProgramForTenant,
  getProgramForTenant,
  listProgramsForTenant,
  updateTrainingProgramInfo,
} from "@/modules/workouts/service";
import { createCoach, createStudent } from "./helpers";
import { NotFoundError } from "@/server/errors";

describe("CRUD Completo de Programas de Treino — Treinador", () => {
  it("permite criar, atualizar cabeçalho e excluir programa sem sessões concluídas", async () => {
    const coach = await createCoach("wktCrudCoach");
    const { studentProfileId } = await createStudent(coach.ctx, "wktStCrud");

    // Create
    const program = await createProgramForStudent(coach.ctx, {
      studentProfileId,
      title: "Programa Hipertrofia Fase 1",
      goal: "Ganho de massa muscular",
      description: "Treino ABC 3x na semana.",
    });

    expect(program.id).toBeDefined();
    expect(program.title).toBe("Programa Hipertrofia Fase 1");

    // Update
    const updated = await updateTrainingProgramInfo(coach.ctx, program.id, {
      title: "Programa Hipertrofia Fase 1 — Ajustado",
      goal: "Força e Hipertrofia",
    });
    expect(updated.title).toBe("Programa Hipertrofia Fase 1 — Ajustado");
    expect(updated.goal).toBe("Força e Hipertrofia");

    // Delete
    const delRes = await deleteTrainingProgramForTenant(coach.ctx, program.id);
    expect(delRes.ok).toBe(true);
    expect(delRes.deleted).toBe(true);

    // Consulta do programa excluído deve falhar com NotFoundError
    await expect(getProgramForTenant(coach.ctx, program.id)).rejects.toBeInstanceOf(
      NotFoundError
    );

    const list = await listProgramsForTenant(coach.ctx, { studentProfileId });
    expect(list.some((p) => p.id === program.id)).toBe(false);
  });

  it("garante isolamento multi-tenant: treinador não pode excluir treino de outro estúdio", async () => {
    const coachA = await createCoach("wktIsoCoachA");
    const coachB = await createCoach("wktIsoCoachB");
    const { studentProfileId } = await createStudent(coachA.ctx, "wktIsoStA");

    const programA = await createProgramForStudent(coachA.ctx, {
      studentProfileId,
      title: "Treino Confidencial A",
    });

    await expect(
      deleteTrainingProgramForTenant(coachB.ctx, programA.id)
    ).rejects.toBeInstanceOf(NotFoundError);

    await expect(
      updateTrainingProgramInfo(coachB.ctx, programA.id, { title: "Hack" })
    ).rejects.toBeInstanceOf(NotFoundError);
  });
});
