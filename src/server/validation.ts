import { ZodError, type ZodType, type z } from "zod";
import { ValidationError } from "@/server/errors";

/**
 * Validação de entrada na fronteira do servidor. Toda server action / route handler deve passar
 * por aqui: a validação no navegador é apenas conveniência de UX, nunca uma barreira de segurança.
 */
export function parseInput<S extends ZodType>(schema: S, input: unknown): z.output<S> {
  const result = schema.safeParse(input);
  if (result.success) return result.data;
  throw new ValidationError("Dados inválidos.", fieldErrorsFrom(result.error));
}

export function fieldErrorsFrom(error: ZodError): Record<string, string[]> {
  const out: Record<string, string[]> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "_form");
    (out[key] ??= []).push(issue.message);
  }
  return out;
}
