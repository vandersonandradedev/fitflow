import bcrypt from "bcryptjs";

const BCRYPT_ROUNDS = 12;

// Hash válido e descartável usado para equalizar o tempo de resposta quando o e-mail não existe,
// evitando enumeração de contas por diferença de latência no login.
const DUMMY_HASH = bcrypt.hashSync("fitflow-dummy-password", BCRYPT_ROUNDS);

export function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, BCRYPT_ROUNDS);
}

export async function verifyPassword(plain: string, hash: string | null | undefined): Promise<boolean> {
  const ok = await bcrypt.compare(plain, hash ?? DUMMY_HASH);
  return hash ? ok : false;
}
