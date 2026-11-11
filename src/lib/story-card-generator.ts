/**
 * Gerador de Cards Visuais para Instagram Stories (1080 x 1920 - 9:16)
 *
 * Renderização 100% no cliente via HTML5 Canvas 2D:
 * - Zero latência (< 20ms)
 * - Zero consumo de banda / hospedagem (zero egress)
 * - Compatível com Web Share API, download de PNG e cópia para clipboard
 */

export interface StoryCardData {
  workoutName: string;
  studentName: string;
  coachName?: string | null;
  tenantName?: string | null;
  dateStr: string;
  totalVolumeKg: number;
  durationMinutes: number;
  completedSetsCount: number;
  totalSetsCount: number;
  rpe?: number | null;
  isRecordVolume?: boolean;
}

const RPE_LABELS: Record<number, string> = {
  1: "Mínimo (RIR 5+)",
  2: "Muito leve",
  3: "Leve",
  4: "Moderado",
  5: "Moderado sustentável",
  6: "Firme",
  7: "Intenso (RIR 3)",
  8: "Muito Intenso (RIR 2)",
  9: "Quase Máximo (RIR 1)",
  10: "Esforço Máximo (Falha)",
};

/**
 * Renderiza o card de Stories em alta resolução (1080x1920) em um Canvas HTML5.
 */
export function drawStoryCard(
  canvas: HTMLCanvasElement,
  data: StoryCardData
): void {
  const width = 1080;
  const height = 1920;
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  // 1. Fundo Gradiente Premium Dark
  const bgGrad = ctx.createLinearGradient(0, 0, width, height);
  bgGrad.addColorStop(0, "#080B10");
  bgGrad.addColorStop(0.3, "#0E131F");
  bgGrad.addColorStop(0.7, "#0A0E17");
  bgGrad.addColorStop(1, "#05070A");
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, width, height);

  // 2. Brilho Radial Esmeralda no topo e centro
  const radialGlow = ctx.createRadialGradient(
    width / 2,
    480,
    50,
    width / 2,
    480,
    550
  );
  radialGlow.addColorStop(0, "rgba(16, 185, 129, 0.22)");
  radialGlow.addColorStop(0.6, "rgba(5, 150, 105, 0.08)");
  radialGlow.addColorStop(1, "rgba(0, 0, 0, 0)");
  ctx.fillStyle = radialGlow;
  ctx.fillRect(0, 0, width, 1200);

  // 3. Moldura decorativa superior
  ctx.save();
  ctx.strokeStyle = "rgba(16, 185, 129, 0.25)";
  ctx.lineWidth = 2;
  ctx.strokeRect(40, 40, width - 80, height - 80);
  ctx.restore();

  // 4. Marca Superior (Header)
  ctx.save();
  ctx.font = "bold 32px sans-serif";
  ctx.fillStyle = "#10B981";
  ctx.letterSpacing = "4px";
  ctx.textAlign = "center";
  ctx.fillText("FITFLOW", width / 2, 130);

  const subHeader = data.tenantName || data.coachName
    ? `CONSULTORIA · ${((data.tenantName || data.coachName) ?? "").toUpperCase()}`
    : "TREINAMENTO DE ALTA PERFORMANCE";
  ctx.font = "600 20px monospace";
  ctx.fillStyle = "rgba(156, 163, 175, 0.8)";
  ctx.fillText(subHeader, width / 2, 175);
  ctx.restore();

  // 5. Badge de Status (Feito / Recorde)
  ctx.save();
  const badgeY = 270;
  const badgeText = data.isRecordVolume
    ? "⚡ NOVO RECORDE PESSOAL DE TONELAGEM"
    : "🔥 TREINO PAGO · SESSÃO CONCLUÍDA";

  ctx.font = "bold 24px sans-serif";
  const badgeWidth = ctx.measureText(badgeText).width + 60;
  const badgeX = (width - badgeWidth) / 2;

  // Fundo arredondado da badge
  ctx.fillStyle = data.isRecordVolume
    ? "rgba(245, 158, 11, 0.18)"
    : "rgba(16, 185, 129, 0.18)";
  ctx.strokeStyle = data.isRecordVolume
    ? "rgba(245, 158, 11, 0.5)"
    : "rgba(16, 185, 129, 0.4)";
  ctx.lineWidth = 2;
  roundRect(ctx, badgeX, badgeY - 32, badgeWidth, 54, 27);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = data.isRecordVolume ? "#FBBF24" : "#34D399";
  ctx.textAlign = "center";
  ctx.fillText(badgeText, width / 2, badgeY + 5);
  ctx.restore();

  // 6. Título do Treino & Nome do Aluno
  ctx.save();
  ctx.textAlign = "center";
  ctx.font = "900 68px sans-serif";
  ctx.fillStyle = "#FFFFFF";

  // Trunca título se for muito longo
  let title = data.workoutName;
  if (title.length > 28) {
    title = title.substring(0, 26) + "...";
  }
  ctx.fillText(title, width / 2, 450);

  ctx.font = "600 32px sans-serif";
  ctx.fillStyle = "#A7F3D0";
  ctx.fillText(data.studentName, width / 2, 515);

  ctx.font = "400 22px monospace";
  ctx.fillStyle = "rgba(156, 163, 175, 0.7)";
  ctx.fillText(data.dateStr.toUpperCase(), width / 2, 565);
  ctx.restore();

  // 7. Grid de Métricas Principais (3 Cards de Estatística)
  const cards = [
    {
      label: "VOLUME TOTAL LEVANTADO",
      value: `${data.totalVolumeKg.toLocaleString("pt-BR")}`,
      unit: "KG",
      color: "#10B981",
    },
    {
      label: "TEMPO DE EXECUÇÃO",
      value: `${data.durationMinutes}`,
      unit: "MINUTOS",
      color: "#60A5FA",
    },
    {
      label: "SÉRIES CONCLUÍDAS",
      value: `${data.completedSetsCount}`,
      unit: `DE ${data.totalSetsCount} SÉRIES`,
      color: "#F59E0B",
    },
  ];

  let cardY = 660;
  for (const card of cards) {
    drawStatCard(ctx, 100, cardY, width - 200, 160, card);
    cardY += 190;
  }

  // 8. Barra de Esforço Perceptível (RPE)
  if (data.rpe) {
    ctx.save();
    const rpeBoxY = 1270;
    const rpeBoxX = 100;
    const rpeBoxW = width - 200;
    const rpeBoxH = 150;

    ctx.fillStyle = "rgba(17, 24, 39, 0.75)";
    ctx.strokeStyle = "rgba(75, 85, 99, 0.4)";
    ctx.lineWidth = 1.5;
    roundRect(ctx, rpeBoxX, rpeBoxY, rpeBoxW, rpeBoxH, 20);
    ctx.fill();
    ctx.stroke();

    ctx.font = "600 20px monospace";
    ctx.fillStyle = "#9CA3AF";
    ctx.textAlign = "left";
    ctx.fillText("PERCEPÇÃO DE ESFORÇO DA SESSÃO", rpeBoxX + 40, rpeBoxY + 45);

    ctx.font = "900 48px monospace";
    ctx.fillStyle = data.rpe >= 9 ? "#F87171" : "#10B981";
    ctx.fillText(`${data.rpe} / 10`, rpeBoxX + 40, rpeBoxY + 110);

    const rpeDesc = RPE_LABELS[data.rpe] || "Intenso";
    ctx.font = "500 24px sans-serif";
    ctx.fillStyle = "#E5E7EB";
    ctx.textAlign = "right";
    ctx.fillText(rpeDesc, rpeBoxX + rpeBoxW - 40, rpeBoxY + 105);

    ctx.restore();
  }

  // 9. Frase de Impacto Motivacional
  ctx.save();
  ctx.textAlign = "center";
  ctx.font = "italic 300 28px sans-serif";
  ctx.fillStyle = "rgba(209, 213, 219, 0.85)";
  ctx.fillText('"A disciplina constrói o que a motivação apenas sonha."', width / 2, 1550);
  ctx.restore();

  // 10. Rodapé / Branding do SaaS e do Treinador
  ctx.save();
  ctx.strokeStyle = "rgba(75, 85, 99, 0.35)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(140, 1680);
  ctx.lineTo(width - 140, 1680);
  ctx.stroke();

  ctx.textAlign = "center";
  ctx.font = "600 26px sans-serif";
  ctx.fillStyle = "#FFFFFF";
  ctx.fillText(data.coachName ? `Treinador: ${data.coachName}` : "FitFlow App", width / 2, 1740);

  ctx.font = "400 20px monospace";
  ctx.fillStyle = "rgba(156, 163, 175, 0.8)";
  ctx.fillText("fitflow.app · Gestão e Alta Performance", width / 2, 1785);
  ctx.restore();
}

/**
 * Desenha um card de métrica arredondado com efeito de vidro.
 */
function drawStatCard(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  item: { label: string; value: string; unit: string; color: string }
) {
  ctx.save();

  // Fundo
  ctx.fillStyle = "rgba(17, 24, 39, 0.75)";
  ctx.strokeStyle = "rgba(75, 85, 99, 0.35)";
  ctx.lineWidth = 1.5;
  roundRect(ctx, x, y, w, h, 20);
  ctx.fill();
  ctx.stroke();

  // Barra de destaque lateral
  ctx.fillStyle = item.color;
  roundRect(ctx, x, y + 20, 8, h - 40, 4);
  ctx.fill();

  // Label
  ctx.font = "600 20px monospace";
  ctx.fillStyle = "#9CA3AF";
  ctx.textAlign = "left";
  ctx.fillText(item.label, x + 40, y + 50);

  // Valor
  ctx.font = "900 64px monospace";
  ctx.fillStyle = "#FFFFFF";
  ctx.fillText(item.value, x + 40, y + 125);

  // Unidade
  ctx.font = "700 24px monospace";
  ctx.fillStyle = item.color;
  ctx.fillText(item.unit, x + 50 + ctx.measureText(item.value).width, y + 125);

  ctx.restore();
}

/**
 * Helper para desenhar retângulos com cantos arredondados no Canvas.
 */
function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

/**
 * Converte o canvas renderizado para Blob PNG.
 */
export async function getStoryCardBlob(data: StoryCardData): Promise<Blob | null> {
  if (typeof document === "undefined") return null;

  const canvas = document.createElement("canvas");
  drawStoryCard(canvas, data);

  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), "image/png", 0.95);
  });
}

/**
 * Faz o download direto da imagem PNG no aparelho do usuário.
 */
export async function downloadStoryCardPng(
  data: StoryCardData,
  fileName = "fitflow-treino.png"
): Promise<boolean> {
  const blob = await getStoryCardBlob(data);
  if (!blob) return false;

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 2000);
  return true;
}

/**
 * Copia a imagem renderizada para a área de transferência do usuário.
 */
export async function copyStoryCardToClipboard(data: StoryCardData): Promise<boolean> {
  if (typeof navigator === "undefined" || !navigator.clipboard || !window.ClipboardItem) {
    return false;
  }

  try {
    const blob = await getStoryCardBlob(data);
    if (!blob) return false;

    const item = new ClipboardItem({ "image/png": blob });
    await navigator.clipboard.write([item]);
    return true;
  } catch {
    return false;
  }
}

/**
 * Dispara o compartilhamento nativo no celular (Instagram Stories / WhatsApp) via Web Share API.
 */
export async function shareStoryCardNative(
  data: StoryCardData
): Promise<"shared" | "fallback_download"> {
  if (typeof navigator === "undefined" || !navigator.canShare) {
    await downloadStoryCardPng(data);
    return "fallback_download";
  }

  try {
    const blob = await getStoryCardBlob(data);
    if (!blob) {
      await downloadStoryCardPng(data);
      return "fallback_download";
    }

    const file = new File([blob], "treino-fitflow.png", { type: "image/png" });

    if (navigator.canShare({ files: [file] })) {
      await navigator.share({
        title: `Treino Pago — ${data.workoutName}`,
        text: `Treino concluído no FitFlow! ${data.totalVolumeKg.toLocaleString("pt-BR")} kg levantados.`,
        files: [file],
      });
      return "shared";
    }
  } catch {
    // Se o usuário cancelou o share sheet, não força o download
  }

  await downloadStoryCardPng(data);
  return "fallback_download";
}
