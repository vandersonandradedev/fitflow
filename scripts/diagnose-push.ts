import { readFileSync } from "fs";
// Load .env manually (no dotenv dependency needed)
const envContent = readFileSync(".env", "utf-8");
for (const line of envContent.split("\n")) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith("#")) continue;
  const eqIdx = trimmed.indexOf("=");
  if (eqIdx === -1) continue;
  const key = trimmed.substring(0, eqIdx).trim();
  let val = trimmed.substring(eqIdx + 1).trim();
  if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
    val = val.slice(1, -1);
  }
  process.env[key] = val;
}

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("=== DIAGNÓSTICO DE NOTIFICAÇÕES PUSH ===\n");

  // 1. Verificar VAPID keys
  console.log("📌 [1] Variáveis de Ambiente VAPID:");
  const pubKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT;
  console.log("  NEXT_PUBLIC_VAPID_PUBLIC_KEY:", pubKey ? `${pubKey.substring(0, 20)}... (OK)` : "❌ NÃO DEFINIDA");
  console.log("  VAPID_PRIVATE_KEY:", privKey ? `${privKey.substring(0, 10)}... (OK)` : "❌ NÃO DEFINIDA");
  console.log("  VAPID_SUBJECT:", subject || "(usando default mailto:contato@fitflow.app)");

  // 2. Verificar inscrições push no banco
  console.log("\n📌 [2] Inscrições Push no Banco de Dados:");
  const subs = await prisma.pushSubscription.findMany({
    include: {
      user: {
        select: { id: true, name: true, email: true },
      },
    },
  });
  console.log(`  Total de inscrições: ${subs.length}`);
  for (const sub of subs) {
    console.log(`  - Usuário: ${sub.user.name} (${sub.user.email})`);
    console.log(`    Endpoint: ${sub.endpoint.substring(0, 80)}...`);
    console.log(`    Criado em: ${sub.createdAt}`);
  }

  // 3. Verificar notificações recentes
  console.log("\n📌 [3] Últimas 10 Notificações (Banco):");
  const notifications = await prisma.notification.findMany({
    take: 10,
    orderBy: { createdAt: "desc" },
    include: {
      user: { select: { name: true, email: true } },
    },
  });
  console.log(`  Total encontradas: ${notifications.length}`);
  for (const n of notifications) {
    console.log(`  - [${n.createdAt.toISOString()}] "${n.title}" → ${n.user.name} (lida: ${n.readAt ? "sim" : "não"})`);
  }

  // 4. Testar envio de push se houver inscrição
  if (subs.length > 0 && pubKey && privKey) {
    console.log("\n📌 [4] Testando Envio de Push Real...");
    const { sendNotification, setVapidDetails, WebPushError } = await import("web-push");
    setVapidDetails(subject || "mailto:contato@fitflow.app", pubKey, privKey);

    for (const sub of subs) {
      try {
        const payload = JSON.stringify({
          title: "FitFlow — Teste de Diagnóstico 🔧",
          body: `Olá ${sub.user.name}! Notificações estão funcionando.`,
          url: "/student/today",
          icon: "/icons/icon-192.png",
        });

        await sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          payload
        );
        console.log(`  ✅ Push enviado com sucesso para ${sub.user.name} (${sub.user.email})`);
      } catch (error) {
        if (error instanceof WebPushError) {
          console.log(`  ❌ Push FALHOU para ${sub.user.name}: Status ${error.statusCode} - ${error.body || error.message}`);
          if (error.statusCode === 410 || error.statusCode === 404) {
            console.log(`     ⚠️ Inscrição EXPIRADA — o aluno precisa reativar.`);
          }
        } else {
          console.log(`  ❌ Push FALHOU para ${sub.user.name}:`, error instanceof Error ? error.message : error);
        }
      }
    }
  } else if (subs.length === 0) {
    console.log("\n📌 [4] Nenhuma inscrição push encontrada.");
    console.log("  ⚠️ O aluno precisa abrir o app → /student/today → clicar em 'Ativar Notificações no Celular'.");
  } else {
    console.log("\n📌 [4] Chaves VAPID ausentes — impossível testar envio.");
  }

  // 5. Testar cron endpoint
  console.log("\n📌 [5] Testando Cron de Engajamento na Produção...");
  try {
    const cronSecret = process.env.CRON_SECRET;
    const res = await fetch("https://fitflowgo.vercel.app/api/cron/engagement?habit=auto", {
      headers: cronSecret ? { Authorization: `Bearer ${cronSecret}` } : {},
    });
    console.log(`  Status: ${res.status} ${res.statusText}`);
    const body = await res.text();
    console.log(`  Resposta: ${body.substring(0, 300)}`);
  } catch (err) {
    console.log("  ❌ Erro:", err instanceof Error ? err.message : err);
  }

  console.log("\n=== FIM DO DIAGNÓSTICO ===");
}

main()
  .then(() => process.exit(0))
  .catch((e) => { console.error(e); process.exit(1); });
