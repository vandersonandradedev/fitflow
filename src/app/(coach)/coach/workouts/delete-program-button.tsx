"use client";

import { useRouter } from "next/navigation";
import { DeleteConfirmDialog } from "@/components/ui/delete-confirm-dialog";
import { deleteProgramAction } from "./actions";

export function DeleteProgramButton({
  programId,
  programTitle,
  variant = "outline",
  iconOnly = false,
}: {
  programId: string;
  programTitle: string;
  variant?: "destructive" | "outline" | "ghost";
  iconOnly?: boolean;
}) {
  const router = useRouter();

  return (
    <DeleteConfirmDialog
      title="Excluir Programa de Treino"
      description={`Tem certeza que deseja excluir "${programTitle}"? Se já houver treinos concluídos pelo aluno, o programa será inativado para preservar o histórico; caso contrário, será excluído permanentemente.`}
      triggerLabel="Excluir Programa"
      triggerVariant={variant}
      iconOnly={iconOnly}
      onConfirm={async () => {
        await deleteProgramAction(programId);
        router.push("/coach/workouts");
      }}
    />
  );
}
