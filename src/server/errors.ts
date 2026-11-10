/**
 * Erros de domínio. A camada de UI converte estes erros em mensagens genéricas;
 * detalhes internos nunca devem vazar para o cliente.
 */
export class AppError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = new.target.name;
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = "Sessão não autenticada.") {
    super(message, "UNAUTHORIZED", 401);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = "Você não tem permissão para esta ação.") {
    super(message, "FORBIDDEN", 403);
  }
}

/**
 * Usado tanto quando o recurso não existe quanto quando pertence a outro tenant,
 * para não permitir enumeração de IDs (IDOR).
 */
export class NotFoundError extends AppError {
  constructor(message = "Recurso não encontrado.") {
    super(message, "NOT_FOUND", 404);
  }
}

export class ValidationError extends AppError {
  constructor(
    message = "Dados inválidos.",
    public readonly fieldErrors: Record<string, string[]> = {},
  ) {
    super(message, "VALIDATION", 422);
  }
}

export class ConflictError extends AppError {
  constructor(message = "Conflito com o estado atual do recurso.") {
    super(message, "CONFLICT", 409);
  }
}

export class RateLimitError extends AppError {
  constructor(
    message = "Muitas tentativas. Aguarde alguns minutos e tente novamente.",
    public readonly retryAfterSeconds = 60,
  ) {
    super(message, "RATE_LIMITED", 429);
  }
}
