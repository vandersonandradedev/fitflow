import { describe, expect, it } from "vitest";
import {
  createStudentDirectlyForTenant,
  deleteStudentForTenant,
  getStudentForTenant,
  listStudentsForTenant,
  updateStudentForTenant,
} from "@/modules/students/service";
import { createCoach, createStudent } from "./helpers";
import { NotFoundError } from "@/server/errors";

describe("CRUD Completo de Alunos — Treinador", () => {
  it("permite matricular aluno diretamente com ativação imediata", async () => {
    const coach = await createCoach("stDirectCoach");

    const student = await createStudentDirectlyForTenant(coach.ctx, {
      name: "Mariana Aluna Direta",
      email: "mariana.direta@teste.com",
      phone: "(11) 98888-7777",
      fitnessGoal: "HYPERTROPHY",
      experienceLevel: "BEGINNER",
      trainerNotes: "Foco em condicionamento e mobilidade.",
    });

    expect(student.id).toBeDefined();
    expect(student.status).toBe("ACTIVE");
    expect(student.user.name).toBe("Mariana Aluna Direta");

    const found = await getStudentForTenant(coach.ctx, student.id);
    expect(found.phone).toBe("(11) 98888-7777");
    expect(found.trainerNotes).toBe("Foco em condicionamento e mobilidade.");
  });

  it("permite atualizar dados de saúde e cadastrais e depois excluir o aluno", async () => {
    const coach = await createCoach("stCrudCoach");
    const { studentProfileId } = await createStudent(coach.ctx, "stCrudA");

    // Update
    const updated = await updateStudentForTenant(coach.ctx, studentProfileId, {
      phone: "(11) 99999-1234",
      fitnessGoal: "STRENGTH",
      trainerNotes: "Ajuste na carga de agachamento.",
    });
    expect(updated.fitnessGoal).toBe("STRENGTH");
    expect(updated.phone).toBe("(11) 99999-1234");

    // Delete (Soft-delete com arquivamento)
    const delRes = await deleteStudentForTenant(coach.ctx, studentProfileId);
    expect(delRes.ok).toBe(true);

    // Tentativa de leitura deve retornar NotFoundError
    await expect(getStudentForTenant(coach.ctx, studentProfileId)).rejects.toBeInstanceOf(
      NotFoundError
    );

    // Listagem não deve mais trazer o aluno excluído
    const activeList = await listStudentsForTenant(coach.ctx);
    expect(activeList.some((s) => s.id === studentProfileId)).toBe(false);
  });

  it("impede que o treinador exclua ou altere aluno de outro tenant", async () => {
    const coachA = await createCoach("stIsoCoachA");
    const coachB = await createCoach("stIsoCoachB");
    const { studentProfileId: studentAId } = await createStudent(coachA.ctx, "stIsoA");

    await expect(deleteStudentForTenant(coachB.ctx, studentAId)).rejects.toBeInstanceOf(
      NotFoundError
    );

    await expect(
      updateStudentForTenant(coachB.ctx, studentAId, { phone: "(11) 00000-0000" })
    ).rejects.toBeInstanceOf(NotFoundError);
  });
});
