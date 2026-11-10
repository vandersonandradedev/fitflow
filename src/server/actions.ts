import { headers } from "next/headers";
import { AppError, ValidationError } from "@/server/errors";

export interface ActionState {
  ok?: boolean;
  message?: string;
  error?: string;
  fieldErrors?: Record<string, string[]>;
}

export async function requestMeta(): Promise<{ ip: string }> {
  const h = await headers();
  return { ip: h.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown" };
}

/**
 * Executa uma operação de domínio e a converte em estado serializável para o formulário.
 * Erros de domínio viram mensagens controladas; qualquer outro erro é registrado no servidor
 * e o usuário recebe uma mensagem genérica (sem stack trace nem detalhes internos).
 * `redirect()` do Next lança um erro especial: por isso ele deve ser chamado FORA desta função.
 */
export async function toActionState(operation: () => Promise<ActionState | void>): Promise<ActionState> {
  try {
    return (await operation()) ?? { ok: true };
  } catch (error) {
    if (error instanceof ValidationError) {
      return { error: error.message, fieldErrors: error.fieldErrors };
    }
    if (error instanceof AppError) {
      return { error: error.message };
    }
    console.error("[action] erro inesperado:", error);
    return { error: "Algo deu errado. Tente novamente em instantes." };
  }
}

export function formObject(formData: FormData): Record<string, FormDataEntryValue> {
  return Object.fromEntries(formData.entries());
}
