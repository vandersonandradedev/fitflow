"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireStudentContext } from "@/server/auth/session";
import { toActionState, type ActionState } from "@/server/actions";

export async function updateStudentAvatarAction(
  imageUrl: string | null
): Promise<ActionState> {
  return toActionState(async () => {
    const ctx = await requireStudentContext();

    await prisma.user.update({
      where: { id: ctx.userId },
      data: { image: imageUrl },
    });

    revalidatePath("/student", "layout");
    revalidatePath("/student/profile");
    revalidatePath("/coach/students");
    return {
      ok: true,
      message: imageUrl
        ? "Foto de perfil atualizada com sucesso!"
        : "Foto de perfil removida com sucesso.",
    };
  });
}
