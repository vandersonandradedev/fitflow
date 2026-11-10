export interface OutgoingEmail {
  to: string;
  subject: string;
  text: string;
}

/**
 * Transporte de e-mail do MVP.
 *
 * PENDENTE (decisão do produto): nenhum provedor real (Resend, SES, etc.) foi configurado.
 *  - development: o e-mail é impresso no console do servidor para permitir testar os links.
 *  - test: as mensagens ficam em memória (ver `testOutbox`).
 *  - production: NÃO envia nada e registra um aviso sem o conteúdo (links contêm tokens).
 *    Enquanto não houver provedor, verificação de e-mail, convites e reset de senha não chegam ao usuário.
 */
const testOutbox: OutgoingEmail[] = [];

export const __testOutbox = testOutbox;

export async function sendEmail(message: OutgoingEmail): Promise<void> {
  if (process.env.NODE_ENV === "test") {
    testOutbox.push(message);
    return;
  }
  if (process.env.NODE_ENV === "development") {
    console.info(`\n[email:dev] Para: ${message.to}\n[email:dev] Assunto: ${message.subject}\n${message.text}\n`);
    return;
  }
  console.warn("[email] Nenhum provedor de e-mail configurado; mensagem não enviada.");
}

export function appUrl(path: string): string {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? process.env.AUTH_URL ?? "http://localhost:3000";
  return new URL(path, base).toString();
}
