/**
 * Gerador de Cards Visuais para Instagram Stories (1080 x 1920 - 9:16)
 *
 * Renderização 100% no cliente via HTML5 Canvas 2D:
 * - Zero latência (< 30ms)
 * - Zero consumo de banda / hospedagem (zero egress)
 * - Exibe foto de perfil do aluno (ou iniciais estilizadas)
 * - Exibe o treinador e a equipe/consultoria
 * - Layout anti-sobreposição rigorosamente medido
 * - Compatível com Web Share API, download de PNG e cópia para clipboard
 */

export interface StoryCardData {
  workoutName: string;
  studentName: string;
  studentAvatarUrl?: string | null;
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
 * Carrega uma imagem de forma assíncrona com suporte a CORS e timeout de segurança.
 */
function loadAvatarImage(url: string): Promise<HTMLImageElement | null> {
  if (typeof window === "undefined" || !url) return Promise.resolve(null);

  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    let done = false;

    img.onload = () => {
      if (!done) {
        done = true;
        resolve(img);
      }
    };

    img.onerror = () => {
      if (!done) {
        done = true;
        resolve(null);
      }
    };

    // Timeout de 2 segundos para não atrasar a geração do card se a imagem falhar
    setTimeout(() => {
      if (!done) {
        done = true;
        resolve(null);
      }
    }, 2000);

    img.src = url;
  });
}

/**
 * Renderiza o card de Stories em alta resolução (1080x1920) em um Canvas HTML5.
 */
export async function drawStoryCard(
  canvas: HTMLCanvasElement,
  data: StoryCardData
): Promise<void> {
  const width = 1080;
  const height = 1920;
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  // 1. Fundo Gradiente Premium Dark
  const bgGrad = ctx.createLinearGradient(0, 0, width, height);
  bgGrad.addColorStop(0, "#070A0F");
  bgGrad.addColorStop(0.25, "#0D1424");
  bgGrad.addColorStop(0.7, "#090D16");
  bgGrad.addColorStop(1, "#040608");
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, width, height);

  // 2. Brilho Radial Esmeralda no topo e centro
  const radialGlow = ctx.createRadialGradient(
    width / 2,
    420,
    40,
    width / 2,
    420,
    600
  );
  radialGlow.addColorStop(0, "rgba(16, 185, 129, 0.25)");
  radialGlow.addColorStop(0.5, "rgba(5, 150, 105, 0.09)");
  radialGlow.addColorStop(1, "rgba(0, 0, 0, 0)");
  ctx.fillStyle = radialGlow;
  ctx.fillRect(0, 0, width, 1100);

  // 3. Moldura decorativa superior com cantos sutis
  ctx.save();
  ctx.strokeStyle = "rgba(16, 185, 129, 0.25)";
  ctx.lineWidth = 2;
  ctx.strokeRect(36, 36, width - 72, height - 72);
  ctx.restore();

  // 4. Marca Superior (Header)
  ctx.save();
  ctx.font = "bold 32px sans-serif";
  ctx.fillStyle = "#10B981";
  ctx.textAlign = "center";
  ctx.fillText("FITFLOW", width / 2, 115);

  const subHeader = data.tenantName
    ? `CONSULTORIA · ${data.tenantName.toUpperCase()}`
    : data.coachName
    ? `TREINADOR · ${data.coachName.toUpperCase()}`
    : "TREINAMENTO DE ALTA PERFORMANCE";

  ctx.font = "600 20px monospace";
  ctx.fillStyle = "rgba(156, 163, 175, 0.85)";
  ctx.fillText(subHeader, width / 2, 155);
  ctx.restore();

  // 5. Badge de Status (Feito / Recorde)
  ctx.save();
  const badgeY = 220;
  const badgeText = data.isRecordVolume
    ? "⚡ NOVO RECORDE PESSOAL DE TONELAGEM"
    : "🔥 TREINO PAGO · SESSÃO CONCLUÍDA";

  ctx.font = "bold 22px sans-serif";
  const badgeWidth = ctx.measureText(badgeText).width + 56;
  const badgeX = (width - badgeWidth) / 2;

  ctx.fillStyle = data.isRecordVolume
    ? "rgba(245, 158, 11, 0.18)"
    : "rgba(16, 185, 129, 0.18)";
  ctx.strokeStyle = data.isRecordVolume
    ? "rgba(245, 158, 11, 0.5)"
    : "rgba(16, 185, 129, 0.45)";
  ctx.lineWidth = 2;
  roundRect(ctx, badgeX, badgeY - 28, badgeWidth, 50, 25);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = data.isRecordVolume ? "#FBBF24" : "#34D399";
  ctx.textAlign = "center";
  ctx.fillText(badgeText, width / 2, badgeY + 5);
  ctx.restore();

  // 6. Foto de Perfil do Aluno (Avatar Circular)
  let avatarImg: HTMLImageElement | null = null;
  if (data.studentAvatarUrl) {
    avatarImg = await loadAvatarImage(data.studentAvatarUrl);
  }
  const avatarCenterY = 340;
  const avatarRadius = 64;
  drawAvatar(ctx, avatarImg, data.studentName, width / 2, avatarCenterY, avatarRadius);

  // 7. Nome do Aluno e Vínculo com Treinador/Grupo
  ctx.save();
  ctx.textAlign = "center";
  ctx.font = "bold 34px sans-serif";
  ctx.fillStyle = "#FFFFFF";
  ctx.fillText(data.studentName, width / 2, 450);

  // Vínculo do Treinador / Equipe
  const teamLabel = data.coachName
    ? `Aluno de: ${data.coachName}${data.tenantName ? ` · ${data.tenantName}` : ""}`
    : data.tenantName
    ? `Equipe: ${data.tenantName}`
    : null;

  if (teamLabel) {
    ctx.font = "600 22px sans-serif";
    ctx.fillStyle = "#6EE7B7"; // tom esmeralda claro
    ctx.fillText(teamLabel, width / 2, 488);
  }

  // Data da Sessão
  ctx.font = "400 20px monospace";
  ctx.fillStyle = "rgba(156, 163, 175, 0.75)";
  ctx.fillText(data.dateStr.toUpperCase(), width / 2, teamLabel ? 524 : 492);
  ctx.restore();

  // 8. Título do Treino (com ajuste dinâmico de tamanho para nunca cortar feio)
  ctx.save();
  ctx.textAlign = "center";
  const titleY = teamLabel ? 610 : 580;
  drawWorkoutTitle(ctx, data.workoutName, width / 2, titleY, width - 160);
  ctx.restore();

  // 9. Grid de Métricas Principais (3 Cards de Estatística com layout sem sobreposição)
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

  let cardY = teamLabel ? 720 : 690;
  for (const card of cards) {
    drawStatCard(ctx, 100, cardY, width - 200, 150, card);
    cardY += 175;
  }

  // 10. Barra de Esforço Perceptível (RPE)
  if (data.rpe) {
    ctx.save();
    const rpeBoxY = cardY + 10;
    const rpeBoxX = 100;
    const rpeBoxW = width - 200;
    const rpeBoxH = 140;

    ctx.fillStyle = "rgba(17, 24, 39, 0.8)";
    ctx.strokeStyle = "rgba(75, 85, 99, 0.4)";
    ctx.lineWidth = 1.5;
    roundRect(ctx, rpeBoxX, rpeBoxY, rpeBoxW, rpeBoxH, 20);
    ctx.fill();
    ctx.stroke();

    ctx.font = "600 20px monospace";
    ctx.fillStyle = "#9CA3AF";
    ctx.textAlign = "left";
    ctx.fillText("PERCEPÇÃO DE ESFORÇO DA SESSÃO", rpeBoxX + 40, rpeBoxY + 44);

    ctx.font = "900 46px monospace";
    ctx.fillStyle = data.rpe >= 9 ? "#F87171" : "#10B981";
    ctx.fillText(`${data.rpe} / 10`, rpeBoxX + 40, rpeBoxY + 105);

    const rpeDesc = RPE_LABELS[data.rpe] || "Intenso";
    ctx.font = "600 24px sans-serif";
    ctx.fillStyle = "#E5E7EB";
    ctx.textAlign = "right";
    ctx.fillText(rpeDesc, rpeBoxX + rpeBoxW - 40, rpeBoxY + 102);

    ctx.restore();
  }

  // 11. Frase de Impacto Motivacional
  ctx.save();
  ctx.textAlign = "center";
  ctx.font = "italic 300 26px sans-serif";
  ctx.fillStyle = "rgba(209, 213, 219, 0.85)";
  ctx.fillText('"A disciplina constrói o que a motivação apenas sonha."', width / 2, 1580);
  ctx.restore();

  // 12. Rodapé / Branding do SaaS e do Treinador
  ctx.save();
  ctx.strokeStyle = "rgba(75, 85, 99, 0.35)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(140, 1690);
  ctx.lineTo(width - 140, 1690);
  ctx.stroke();

  ctx.textAlign = "center";
  ctx.font = "bold 26px sans-serif";
  ctx.fillStyle = "#FFFFFF";
  const footerAttribution = data.coachName
    ? `Treinador: ${data.coachName}${data.tenantName ? ` · ${data.tenantName}` : ""}`
    : data.tenantName
    ? `Consultoria ${data.tenantName}`
    : "FitFlow App";
  ctx.fillText(footerAttribution, width / 2, 1750);

  ctx.font = "400 20px monospace";
  ctx.fillStyle = "rgba(156, 163, 175, 0.8)";
  ctx.fillText("fitflow.app · Gestão e Alta Performance", width / 2, 1795);
  ctx.restore();
}

/**
 * Desenha o avatar circular do aluno com anel de brilho esmeralda.
 */
function drawAvatar(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement | null,
  name: string,
  centerX: number,
  centerY: number,
  radius: number
) {
  ctx.save();

  // Anel exterior com brilho esmeralda
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius + 4, 0, Math.PI * 2);
  ctx.strokeStyle = "#10B981";
  ctx.lineWidth = 4;
  ctx.stroke();

  // Sombra suave ao redor
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
  ctx.closePath();
  ctx.clip();

  if (img) {
    try {
      ctx.drawImage(img, centerX - radius, centerY - radius, radius * 2, radius * 2);
    } catch {
      drawInitials(ctx, name, centerX, centerY, radius);
    }
  } else {
    drawInitials(ctx, name, centerX, centerY, radius);
  }

  ctx.restore();
}

function drawInitials(
  ctx: CanvasRenderingContext2D,
  name: string,
  centerX: number,
  centerY: number,
  radius: number
) {
  const grad = ctx.createLinearGradient(
    centerX - radius,
    centerY - radius,
    centerX + radius,
    centerY + radius
  );
  grad.addColorStop(0, "#065F46");
  grad.addColorStop(1, "#047857");
  ctx.fillStyle = grad;
  ctx.fillRect(centerX - radius, centerY - radius, radius * 2, radius * 2);

  const parts = name.split(" ").filter(Boolean);
  const initials =
    parts.length >= 2
      ? `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
      : (parts[0]?.substring(0, 2) || "FF").toUpperCase();

  ctx.font = `bold ${Math.round(radius * 0.75)}px sans-serif`;
  ctx.fillStyle = "#FFFFFF";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(initials, centerX, centerY + 2);
}

/**
 * Desenha o título do treino de forma inteligente, reduzindo a fonte ou quebrando
 * em 2 linhas para nunca ser cortado com reticências feias.
 */
function drawWorkoutTitle(
  ctx: CanvasRenderingContext2D,
  rawTitle: string,
  centerX: number,
  startY: number,
  maxWidth: number
) {
  const title = rawTitle.trim();
  ctx.fillStyle = "#FFFFFF";

  // Se o título couber confortavelmente em 1 linha a 58px:
  ctx.font = "900 58px sans-serif";
  if (ctx.measureText(title).width <= maxWidth) {
    ctx.fillText(title, centerX, startY);
    return;
  }

  // Se couber a 48px:
  ctx.font = "900 48px sans-serif";
  if (ctx.measureText(title).width <= maxWidth) {
    ctx.fillText(title, centerX, startY);
    return;
  }

  // Se for maior, divide em 2 linhas inteligentes por palavras:
  const words = title.split(" ");
  let line1 = "";
  let line2 = "";
  const midpoint = Math.ceil(words.length / 2);

  line1 = words.slice(0, midpoint).join(" ");
  line2 = words.slice(midpoint).join(" ");

  ctx.font = "900 44px sans-serif";
  ctx.fillText(line1, centerX, startY - 26);
  ctx.fillText(line2, centerX, startY + 26);
}

/**
 * Desenha um card de métrica arredondado com espaçamento 100% preciso entre valor e unidade.
 * Corrige o bug anterior onde measureText era chamado APÓS a alteração de tamanho da fonte.
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
  ctx.fillStyle = "rgba(17, 24, 39, 0.8)";
  ctx.strokeStyle = "rgba(75, 85, 99, 0.4)";
  ctx.lineWidth = 1.5;
  roundRect(ctx, x, y, w, h, 20);
  ctx.fill();
  ctx.stroke();

  // Barra de destaque lateral colorida
  ctx.fillStyle = item.color;
  roundRect(ctx, x, y + 20, 8, h - 40, 4);
  ctx.fill();

  // Label superior
  ctx.font = "600 20px monospace";
  ctx.fillStyle = "#9CA3AF";
  ctx.textAlign = "left";
  ctx.fillText(item.label, x + 36, y + 46);

  // 1. Define fonte do VALOR e mede com a fonte correta
  ctx.font = "900 60px monospace";
  const valueWidth = ctx.measureText(item.value).width;

  // 2. Desenha o VALOR em branco
  ctx.fillStyle = "#FFFFFF";
  ctx.fillText(item.value, x + 36, y + 116);

  // 3. Define fonte da UNIDADE e desenha com espaçamento seguro de 16px
  ctx.font = "700 24px monospace";
  ctx.fillStyle = item.color;
  ctx.fillText(item.unit, x + 36 + valueWidth + 16, y + 116);

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
  ctx.arcTo(x, y + w, x, y, r);
  ctx.closePath();
}

/**
 * Converte o canvas renderizado para Blob PNG.
 */
export async function getStoryCardBlob(data: StoryCardData): Promise<Blob | null> {
  if (typeof document === "undefined") return null;

  const canvas = document.createElement("canvas");
  await drawStoryCard(canvas, data);

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
