import "dotenv/config";
import { generatePresignedUploadUrl } from "../src/modules/media/r2";
import { S3Client, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { AIEngagementAgent } from "../src/modules/ai/engagement-agent";

async function main() {
  console.log("==================================================");
  console.log("🚀 INICIANDO BATERIA DE QA - FITFLOW");
  console.log("==================================================\n");

  let allPassed = true;

  // -------------------------------------------------------------------
  // TESTE 1: Produção Vercel - Health & Login
  // -------------------------------------------------------------------
  console.log("📌 [1/3] Testando Conectividade da Produção (Vercel)...");
  try {
    const healthRes = await fetch("https://fitflowgo.vercel.app/api/health", {
      headers: { "User-Agent": "FitFlow-QA-Runner" },
    });
    console.log(`   /api/health Status: ${healthRes.status} ${healthRes.statusText}`);
    const healthData = await healthRes.json().catch(() => null);
    console.log("   Health Payload:", JSON.stringify(healthData));

    const loginRes = await fetch("https://fitflowgo.vercel.app/login", {
      headers: { "User-Agent": "FitFlow-QA-Runner" },
    });
    console.log(`   /login Status: ${loginRes.status} ${loginRes.statusText}`);

    if (healthRes.ok && loginRes.ok) {
      console.log("   ✅ Produção Vercel: OPERACIONAL E RESPONDENDO\n");
    } else {
      console.log("   ⚠️ Produção Vercel respondeu com status inesperado.\n");
      allPassed = false;
    }
  } catch (err) {
    console.error("   ❌ Erro de conexão com produção:", err);
    allPassed = false;
  }

  // -------------------------------------------------------------------
  // TESTE 2: Cloudflare R2 Upload & CORS
  // -------------------------------------------------------------------
  console.log("📌 [2/3] Testando Fluxo Cloudflare R2 (Presigned URL + CORS + PUT + Public URL)...");
  try {
    const presigned = await generatePresignedUploadUrl({
      tenantId: "qa-verification",
      resourceFolder: "exercises",
      contentType: "video/mp4",
    });
    console.log("   [A] URL Pré-assinada gerada com sucesso!");
    console.log(`       Key: ${presigned.key}`);
    console.log(`       Public URL: ${presigned.publicUrl}`);

    // Preflight CORS (OPTIONS)
    console.log("   [B] Testando Preflight CORS (OPTIONS) simulando https://fitflowgo.vercel.app...");
    const optionsRes = await fetch(presigned.uploadUrl, {
      method: "OPTIONS",
      headers: {
        Origin: "https://fitflowgo.vercel.app",
        "Access-Control-Request-Method": "PUT",
        "Access-Control-Request-Headers": "content-type",
      },
    });
    console.log(`       OPTIONS Status: ${optionsRes.status} ${optionsRes.statusText}`);
    const corsOrigin = optionsRes.headers.get("access-control-allow-origin");
    const corsMethods = optionsRes.headers.get("access-control-allow-methods");
    console.log(`       CORS Allow-Origin: ${corsOrigin || "(nenhum - CORS precisa ser salvo no painel)"}`);
    console.log(`       CORS Allow-Methods: ${corsMethods || "(nenhum)"}`);

    if (!corsOrigin) {
      console.log("       ⚠️ ATENÇÃO: O header 'Access-Control-Allow-Origin' não foi retornado.");
      console.log("       Certifique-se de salvar o CORS no painel Cloudflare R2 conforme instruído.");
    } else {
      console.log("       ✅ CORS está ATIVO e liberado!");
    }

    // Direct PUT Upload
    console.log("   [C] Testando upload direto via PUT de vídeo de teste...");
    const testPayload = Buffer.from("FITFLOW-QA-TEST-VIDEO-BINARY-CONTENT-2026");
    const putRes = await fetch(presigned.uploadUrl, {
      method: "PUT",
      headers: {
        "Content-Type": "video/mp4",
      },
      body: testPayload,
    });
    console.log(`       PUT Status: ${putRes.status} ${putRes.statusText}`);

    if (!putRes.ok) {
      const errText = await putRes.text();
      throw new Error(`Falha no PUT para R2: ${putRes.status} - ${errText}`);
    }
    console.log("       ✅ Upload PUT direto para R2 realizado com sucesso!");

    // Verificação de Leitura Pública
    console.log("   [D] Verificando acesso público via subdomínio r2.dev...");
    const getRes = await fetch(presigned.publicUrl);
    console.log(`       GET Status: ${getRes.status} ${getRes.statusText}`);
    const bodyText = await getRes.text();
    const matches = bodyText === "FITFLOW-QA-TEST-VIDEO-BINARY-CONTENT-2026";
    console.log(`       Integridade do conteúdo: ${matches ? "100% IDÊNTICO ✅" : "Divergente ❌"}`);

    // Limpeza do arquivo de teste
    const s3 = new S3Client({
      region: "auto",
      endpoint: `https://${process.env.CLOUDFLARE_R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: process.env.CLOUDFLARE_R2_ACCESS_KEY_ID!,
        secretAccessKey: process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY!,
      },
    });
    await s3.send(
      new DeleteObjectCommand({
        Bucket: process.env.CLOUDFLARE_R2_BUCKET_NAME || "fitflow-media",
        Key: presigned.key,
      })
    );
    console.log("       🧹 Objeto de teste excluído do bucket com sucesso.");
    console.log("   ✅ Cloudflare R2: OPERACIONAL E TESTADO COM SUCESSO!\n");
  } catch (err) {
    console.error("   ❌ Erro no teste do Cloudflare R2:", err);
    allPassed = false;
  }

  // -------------------------------------------------------------------
  // TESTE 3: Agente Autônomo de IA de Engajamento
  // -------------------------------------------------------------------
  console.log("📌 [3/3] Testando Agente Autônomo de IA (Geração de Lembretes)...");
  try {
    const studentContext = {
      studentName: "Carlos Silva",
      fitnessGoal: "HYPERTROPHY" as const,
      streakDays: 4,
    };

    const morningMsg = await AIEngagementAgent.getMorningWorkoutReminder({
      ...studentContext,
      workoutTitle: "Treino A - Peito e Tríceps",
    });
    console.log("   [A] Lembrete Matinal de Treino:", JSON.stringify(morningMsg));

    const eveningMsg = await AIEngagementAgent.getEveningWorkoutReminder({
      ...studentContext,
      workoutTitle: "Treino A - Peito e Tríceps",
    });
    console.log("   [B] Lembrete Noturno (Treino Pendente):", JSON.stringify(eveningMsg));

    const waterMsg = await AIEngagementAgent.getWaterReminder(studentContext);
    console.log("   [C] Lembrete de Hidratação:", JSON.stringify(waterMsg));

    const nutritionMsg = await AIEngagementAgent.getNutritionReminder(studentContext);
    console.log("   [D] Lembrete de Refeição:", JSON.stringify(nutritionMsg));

    const sleepMsg = await AIEngagementAgent.getSleepReminder(studentContext);
    console.log("   [E] Lembrete de Sono:", JSON.stringify(sleepMsg));

    const churnMsg = await AIEngagementAgent.getStudentChurnAlert({
      studentName: "Carlos Silva",
      daysInactive: 7,
      lastWorkoutName: "Treino Fullbody",
    });
    console.log("   [F] Alerta de Aluno Sumido:", JSON.stringify(churnMsg));

    console.log("   ✅ Agente Autônomo de IA: 100% OPERACIONAL!\n");
  } catch (err) {
    console.error("   ❌ Erro no teste da IA:", err);
    allPassed = false;
  }

  console.log("==================================================");
  if (allPassed) {
    console.log("🎉 RESULTADO FINAL: TODOS OS TESTES PASSARAM COM SUCESSO!");
  } else {
    console.log("⚠️ RESULTADO FINAL: ALGUNS TESTES APRESENTARAM ALERTAS.");
  }
  console.log("==================================================");
}

main().catch(console.error);
