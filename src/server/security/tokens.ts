import { createHash, randomBytes, timingSafeEqual } from "node:crypto";

/**
 * Tokens de uso único (convite, reset de senha, verificação de e-mail).
 * O valor em texto puro só existe no link enviado ao usuário; no banco fica apenas o hash SHA-256.
 * Como o token tem 256 bits de entropia, SHA-256 sem salt é suficiente (não é uma senha humana).
 */
export function generateToken(): { token: string; tokenHash: string } {
  const token = randomBytes(32).toString("base64url");
  return { token, tokenHash: hashToken(token) };
}

export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function safeEqualHex(a: string, b: string): boolean {
  const bufA = Buffer.from(a, "hex");
  const bufB = Buffer.from(b, "hex");
  return bufA.length === bufB.length && timingSafeEqual(bufA, bufB);
}

export const TOKEN_TTL_MS = {
  invite: 48 * 60 * 60 * 1000,
  passwordReset: 60 * 60 * 1000,
  emailVerification: 24 * 60 * 60 * 1000,
} as const;
