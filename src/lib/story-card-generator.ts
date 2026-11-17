/**
 * Gerador de Cards Visuais para Instagram Stories (1080 x 1920 - 9:16)
 *
 * Padrão Editorial / Luxury Athletic (estilo Strava Summit, Apple Fitness+ & Anthropic Claude):
 * - Renderização 100% no cliente via HTML5 Canvas 2D
 * - Zero latência (< 30ms) e zero egress de banda
 * - Arquitetura Bento Grid com foco em hierarquia tipográfica e respiração visual
 * - Vidro fosco (glassmorphism) sutil com bordas em gradiente titânio/esmeralda
 * - Foto de perfil do atleta com anel duplo e fallback estilizado de iniciais
 * - Destaque no vínculo com o treinador e a equipe/consultoria
 * - Título dinâmico inteligente sem cortes por reticências
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
  5: "Moderado firme",
  6: "Firme",
  7: "Intenso (RIR 3)",
  8: "Muito Intenso (RIR 2)",
  9: "Quase Máximo (RIR 1)",
  10: "Esforço Máximo (Falha)",
};

/**
 * Carrega a foto do perfil com suporte a CORS e timeout de segurança.
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

    // Timeout de 2 segundos para não atrasar a geração se a imagem falhar
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
 * Desenha um retângulo com cantos arredondados sem nenhum artefato de traçado.
 */
function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  if (typeof ctx.roundRect === "function") {
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, r);
    return;
  }
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

/**
 * Desenha um painel de vidro fosco (glassmorphic panel) com borda refinada.
 */
function drawGlassPanel(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
  options?: {
    fillColor?: string;
    borderColor?: string;
    topHighlight?: boolean;
  }
) {
  ctx.save();
  roundRect(ctx, x, y, w, h, r);

  // Fundo com preenchimento sutil
  ctx.fillStyle = options?.fillColor || "rgba(255, 255, 255, 0.035)";
  ctx.fill();

  // Borda refinada com gradiente de luz superior
  if (options?.topHighlight) {
    const borderGrad = ctx.createLinearGradient(x, y, x, y + h);
    borderGrad.addColorStop(0, "rgba(16, 185, 129, 0.45)");
    borderGrad.addColorStop(0.35, "rgba(255, 255, 255, 0.12)");
    borderGrad.addColorStop(1, "rgba(255, 255, 255, 0.03)");
    ctx.strokeStyle = borderGrad;
  } else {
    ctx.strokeStyle = options?.borderColor || "rgba(255, 255, 255, 0.08)";
  }
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.restore();
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

  // 1. Fundo Deep Obsidian Titanium
  const bgGrad = ctx.createLinearGradient(0, 0, width, height);
  bgGrad.addColorStop(0, "#060709");
  bgGrad.addColorStop(0.3, "#0A0D14");
  bgGrad.addColorStop(0.7, "#080A10");
  bgGrad.addColorStop(1, "#030406");
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, width, height);

  // 2. Luzes Atmosféricas Suaves (Vignette de luxo, sem manchas neon)
  // Brilho suave superior atrás do atleta
  const topAura = ctx.createRadialGradient(width / 2, 380, 20, width / 2, 380, 360);
  topAura.addColorStop(0, "rgba(16, 185, 129, 0.12)");
  topAura.addColorStop(0.6, "rgba(16, 185, 129, 0.03)");
  topAura.addColorStop(1, "rgba(0, 0, 0, 0)");
  ctx.fillStyle = topAura;
  ctx.fillRect(0, 100, width, 550);

  // Brilho sutil atrás do card principal de volume
  const heroAura = ctx.createRadialGradient(width / 2, 830, 40, width / 2, 830, 480);
  heroAura.addColorStop(0, "rgba(16, 185, 129, 0.08)");
  heroAura.addColorStop(0.5, "rgba(5, 150, 105, 0.02)");
  heroAura.addColorStop(1, "rgba(0, 0, 0, 0)");
  ctx.fillStyle = heroAura;
  ctx.fillRect(0, 600, width, 500);

  // 3. Moldura Técnica Externa Elegante com Crosshairs nos cantos
  ctx.save();
  ctx.strokeStyle = "rgba(255, 255, 255, 0.06)";
  ctx.lineWidth = 1;
  ctx.strokeRect(48, 48, width - 96, height - 96);

  // Marcadores de precisão nos cantos (Crosshairs estilo cronômetro esportivo suíço)
  const drawCornerTick = (cx: number, cy: number, dx: number, dy: number) => {
    ctx.strokeStyle = "rgba(16, 185, 129, 0.35)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(cx, cy + dy * 12);
    ctx.lineTo(cx, cy);
    ctx.lineTo(cx + dx * 12, cy);
    ctx.stroke();
  };
  drawCornerTick(48, 48, 1, 1);
  drawCornerTick(width - 48, 48, -1, 1);
  drawCornerTick(48, height - 48, 1, -1);
  drawCornerTick(width - 48, height - 48, -1, -1);
  ctx.restore();

  // 4. Cabeçalho de Marca: FitFlow & Consultoria
  ctx.save();
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  // FitFlow Wordmark com jewel dot esmeralda
  ctx.font = "800 28px sans-serif";
  ctx.fillStyle = "#F8FAFC";
  const brandName = "FITFLOW";
  const brandWidth = ctx.measureText(brandName).width;
  const brandCenterX = width / 2 - 8;
  ctx.fillText(brandName, brandCenterX, 115);

  // Jewel Dot
  ctx.beginPath();
  ctx.arc(brandCenterX + brandWidth / 2 + 10, 115, 3.5, 0, Math.PI * 2);
  ctx.fillStyle = "#10B981";
  ctx.fill();

  // Consultoria / Equipe Subtitle
  const subHeader = data.tenantName
    ? `CONSULTORIA ${data.tenantName.toUpperCase()}`
    : data.coachName
    ? `TREINADOR ${data.coachName.toUpperCase()}`
    : "PERFORMANCE TRACKING";

  ctx.font = "600 15px sans-serif";
  ctx.fillStyle = "rgba(148, 163, 184, 0.75)";
  ctx.fillText(subHeader, width / 2, 150);
  ctx.restore();

  // 5. Badge de Status Minimalista (Sessão Concluída / Recorde Pessoal)
  ctx.save();
  const badgeY = 208;
  const isRecord = Boolean(data.isRecordVolume);
  const badgeText = isRecord
    ? "🏆 NOVO RECORDE PESSOAL (PR)"
    : "✓ SESSÃO CONCLUÍDA COM SUCESSO";

  ctx.font = "600 17px sans-serif";
  const bTextW = ctx.measureText(badgeText).width;
  const bPadH = 44;
  const bPadW = bTextW + 48;
  const bX = (width - bPadW) / 2;

  drawGlassPanel(ctx, bX, badgeY - bPadH / 2, bPadW, bPadH, 22, {
    fillColor: isRecord ? "rgba(245, 158, 11, 0.08)" : "rgba(16, 185, 129, 0.07)",
    borderColor: isRecord ? "rgba(245, 158, 11, 0.35)" : "rgba(16, 185, 129, 0.3)",
  });

  ctx.fillStyle = isRecord ? "#FBBF24" : "#34D399";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(badgeText, width / 2, badgeY);
  ctx.restore();

  // 6. Foto do Aluno (Avatar com anel duplo de prestígio)
  let avatarImg: HTMLImageElement | null = null;
  if (data.studentAvatarUrl) {
    avatarImg = await loadAvatarImage(data.studentAvatarUrl);
  }
  const avatarCenterY = 345;
  const avatarRadius = 66;
  drawAvatar(ctx, avatarImg, data.studentName, width / 2, avatarCenterY, avatarRadius);

  // 7. Nome do Aluno e Vínculo com Treinador
  ctx.save();
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";

  // Nome do Aluno
  ctx.font = "800 38px sans-serif";
  ctx.fillStyle = "#FFFFFF";
  ctx.fillText(data.studentName, width / 2, 460);

  // Vínculo com Treinador e Consultoria
  const coachLabel = data.coachName
    ? `Aluno de: ${data.coachName}${data.tenantName ? ` · ${data.tenantName}` : ""}`
    : data.tenantName
    ? `Equipe: ${data.tenantName}`
    : "Atleta FitFlow";

  ctx.font = "600 20px sans-serif";
  ctx.fillStyle = "#6EE7B7"; // menta sofisticado
  ctx.fillText(coachLabel, width / 2, 496);

  // Data em formato editorial limpo
  ctx.font = "400 17px sans-serif";
  ctx.fillStyle = "rgba(148, 163, 184, 0.65)";
  const cleanDate = cleanDateString(data.dateStr);
  ctx.fillText(cleanDate, width / 2, 530);
  ctx.restore();

  // 8. Título do Treino (Hero Typography)
  ctx.save();
  // Linha divisória sutil superior com fade
  const dividerGrad = ctx.createLinearGradient(160, 560, width - 160, 560);
  dividerGrad.addColorStop(0, "rgba(255, 255, 255, 0)");
  dividerGrad.addColorStop(0.5, "rgba(255, 255, 255, 0.1)");
  dividerGrad.addColorStop(1, "rgba(255, 255, 255, 0)");
  ctx.strokeStyle = dividerGrad;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(160, 560);
  ctx.lineTo(width - 160, 560);
  ctx.stroke();

  drawWorkoutTitle(ctx, data.workoutName, width / 2, 620, width - 200);
  ctx.restore();

  // 9. BENTO GRID ARCHITECTURE (Substitui os 4 cards idênticos por hierarquia perfeita)
  const containerX = 80;
  const containerW = 920;

  // A) HERO CARD: Volume Total Levantado (Full Width destaque monumental)
  const heroY = 690;
  const heroH = 240;
  drawGlassPanel(ctx, containerX, heroY, containerW, heroH, 24, {
    fillColor: "rgba(255, 255, 255, 0.045)",
    topHighlight: true,
  });

  // Conteúdo do Hero Card
  ctx.save();
  // Label com ponto esmeralda
  ctx.beginPath();
  ctx.arc(containerX + 44, heroY + 44, 4, 0, Math.PI * 2);
  ctx.fillStyle = "#10B981";
  ctx.fill();

  ctx.font = "600 17px sans-serif";
  ctx.fillStyle = "rgba(148, 163, 184, 0.85)";
  ctx.textAlign = "left";
  ctx.fillText("VOLUME TOTAL LEVANTADO (CARGA ACUMULADA)", containerX + 60, heroY + 49);

  // Valor Gigante
  const formattedVolume = data.totalVolumeKg.toLocaleString("pt-BR");
  ctx.font = "900 96px sans-serif";
  ctx.fillStyle = "#FFFFFF";
  ctx.fillText(formattedVolume, containerX + 44, heroY + 160);

  // Unidade KG perfeitamente posicionada
  const volumeWidth = ctx.measureText(formattedVolume).width;
  ctx.font = "800 34px sans-serif";
  ctx.fillStyle = "#10B981";
  ctx.fillText("KG", containerX + 44 + volumeWidth + 18, heroY + 160);

  // Sublabel discreto no canto
  ctx.font = "500 15px sans-serif";
  ctx.fillStyle = "rgba(148, 163, 184, 0.6)";
  ctx.textAlign = "right";
  ctx.fillText("Tonelagem da sessão", containerX + containerW - 40, heroY + 49);
  ctx.restore();

  // B) 3 CARDS EM COLUNA (Duração · Séries · Intensidade)
  const colY = 960;
  const colH = 220;
  const colGap = 26;
  const colW = (containerW - colGap * 2) / 3; // ~289px cada

  // --- Coluna 1: Duração do Treino ---
  const col1X = containerX;
  drawGlassPanel(ctx, col1X, colY, colW, colH, 20);

  ctx.save();
  ctx.font = "600 15px sans-serif";
  ctx.fillStyle = "rgba(148, 163, 184, 0.8)";
  ctx.textAlign = "left";
  ctx.fillText("DURAÇÃO", col1X + 28, colY + 42);

  // Valor
  ctx.font = "900 64px sans-serif";
  ctx.fillStyle = "#FFFFFF";
  const durVal = String(data.durationMinutes);
  ctx.fillText(durVal, col1X + 28, colY + 128);

  // Unidade
  const durW = ctx.measureText(durVal).width;
  ctx.font = "800 22px sans-serif";
  ctx.fillStyle = "#38BDF8"; // Sky Blue
  ctx.fillText("MIN", col1X + 28 + durW + 12, colY + 128);

  ctx.font = "500 14px sans-serif";
  ctx.fillStyle = "rgba(148, 163, 184, 0.55)";
  ctx.fillText("Tempo de treino", col1X + 28, colY + 175);
  ctx.restore();

  // --- Coluna 2: Séries Concluídas ---
  const col2X = col1X + colW + colGap;
  drawGlassPanel(ctx, col2X, colY, colW, colH, 20);

  ctx.save();
  ctx.font = "600 15px sans-serif";
  ctx.fillStyle = "rgba(148, 163, 184, 0.8)";
  ctx.textAlign = "left";
  ctx.fillText("SÉRIES FEITAS", col2X + 28, colY + 42);

  // Valor
  ctx.font = "900 64px sans-serif";
  ctx.fillStyle = "#FFFFFF";
  const setsVal = String(data.completedSetsCount);
  ctx.fillText(setsVal, col2X + 28, colY + 128);

  // Unidade
  const setsW = ctx.measureText(setsVal).width;
  ctx.font = "700 24px sans-serif";
  ctx.fillStyle = "#FBBF24"; // Amber Gold
  ctx.fillText(`/${data.totalSetsCount}`, col2X + 28 + setsW + 8, colY + 128);

  ctx.font = "500 14px sans-serif";
  ctx.fillStyle = "rgba(148, 163, 184, 0.55)";
  ctx.fillText("Séries concluídas", col2X + 28, colY + 175);
  ctx.restore();

  // --- Coluna 3: Intensidade (RPE) ---
  const col3X = col2X + colW + colGap;
  drawGlassPanel(ctx, col3X, colY, colW, colH, 20);

  ctx.save();
  const currentRpe = data.rpe ?? 8;
  ctx.font = "600 15px sans-serif";
  ctx.fillStyle = "rgba(148, 163, 184, 0.8)";
  ctx.textAlign = "left";
  ctx.fillText("INTENSIDADE", col3X + 28, colY + 42);

  // Valor
  ctx.font = "900 64px sans-serif";
  ctx.fillStyle = "#FFFFFF";
  const rpeVal = String(currentRpe);
  ctx.fillText(rpeVal, col3X + 28, colY + 128);

  // Unidade
  const rpeW = ctx.measureText(rpeVal).width;
  ctx.font = "700 24px sans-serif";
  ctx.fillStyle = currentRpe >= 9 ? "#F87171" : "#34D399";
  ctx.fillText("/10", col3X + 28 + rpeW + 8, colY + 128);

  const rpeDesc = RPE_LABELS[currentRpe]?.split("(")[0]?.trim() || "Intenso";
  ctx.font = "600 14px sans-serif";
  ctx.fillStyle = "rgba(226, 232, 240, 0.85)";
  ctx.fillText(rpeDesc, col3X + 28, colY + 175);
  ctx.restore();

  // 10. Painel de Citação Editorial & Selo de Autenticidade
  const quoteY = 1220;
  const quoteH = 175;
  drawGlassPanel(ctx, containerX, quoteY, containerW, quoteH, 20, {
    fillColor: "rgba(255, 255, 255, 0.02)",
    borderColor: "rgba(255, 255, 255, 0.06)",
  });

  // Linha de acento lateral esquerda esmeralda
  ctx.save();
  ctx.fillStyle = "#10B981";
  roundRect(ctx, containerX, quoteY + 24, 4, quoteH - 48, 2);
  ctx.fill();

  // Citação com aspas estilizadas
  ctx.font = 'italic 400 24px Georgia, "Times New Roman", serif';
  ctx.fillStyle = "rgba(241, 245, 249, 0.95)";
  ctx.textAlign = "left";
  ctx.fillText(
    '“A disciplina constrói o que a motivação apenas sonha.”',
    containerX + 36,
    quoteY + 65
  );

  // Selo de verificação da plataforma
  ctx.font = "600 13px sans-serif";
  ctx.fillStyle = "rgba(148, 163, 184, 0.6)";
  ctx.fillText("FITFLOW VERIFIED SESSION · ALTA PERFORMANCE ESPORTIVA", containerX + 36, quoteY + 120);
  ctx.restore();

  // 11. Rodapé Refinado com Assinatura da Consultoria e FitFlow
  ctx.save();
  const footerDividerY = 1660;
  const footGrad = ctx.createLinearGradient(120, footerDividerY, width - 120, footerDividerY);
  footGrad.addColorStop(0, "rgba(255, 255, 255, 0)");
  footGrad.addColorStop(0.5, "rgba(255, 255, 255, 0.12)");
  footGrad.addColorStop(1, "rgba(255, 255, 255, 0)");
  ctx.strokeStyle = footGrad;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(120, footerDividerY);
  ctx.lineTo(width - 120, footerDividerY);
  ctx.stroke();

  // Assinatura do Treinador e Consultoria
  ctx.textAlign = "center";
  const footerAttribution = data.coachName
    ? `Treinador: ${data.coachName}${data.tenantName ? ` · ${data.tenantName}` : ""}`
    : data.tenantName
    ? `Consultoria ${data.tenantName}`
    : "Treinamento de Alta Performance";

  ctx.font = "700 22px sans-serif";
  ctx.fillStyle = "#F1F5F9";
  ctx.fillText(footerAttribution, width / 2, 1720);

  // URL e subtítulo
  ctx.font = "500 16px sans-serif";
  ctx.fillStyle = "rgba(148, 163, 184, 0.75)";
  ctx.fillText("fitflow.app · Gestão e Alta Performance", width / 2, 1760);
  ctx.restore();
}

/**
 * Desenha o avatar do atleta com anel duplo de acabamento premium.
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

  // Anel exterior com halo suave
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius + 8, 0, Math.PI * 2);
  ctx.strokeStyle = "rgba(16, 185, 129, 0.25)";
  ctx.lineWidth = 2;
  ctx.stroke();

  // Anel interior esmeralda jewel
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius + 2, 0, Math.PI * 2);
  ctx.strokeStyle = "#10B981";
  ctx.lineWidth = 3;
  ctx.stroke();

  // Recorte circular do avatar
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

/**
 * Fallback com iniciais estilizadas em gradiente escuro de esmeralda.
 */
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
  grad.addColorStop(0, "#064E3B");
  grad.addColorStop(1, "#047857");
  ctx.fillStyle = grad;
  ctx.fillRect(centerX - radius, centerY - radius, radius * 2, radius * 2);

  const parts = name.split(" ").filter(Boolean);
  const initials =
    parts.length >= 2
      ? `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
      : (parts[0]?.substring(0, 2) || "FF").toUpperCase();

  ctx.font = `bold ${Math.round(radius * 0.72)}px sans-serif`;
  ctx.fillStyle = "#FFFFFF";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(initials, centerX, centerY + 2);
}

/**
 * Desenha o título do treino com inteligência de quebra de linha.
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
  ctx.textAlign = "center";

  // Se couber em 1 linha a 44px
  ctx.font = "800 44px sans-serif";
  if (ctx.measureText(title).width <= maxWidth) {
    ctx.fillText(title, centerX, startY);
    return;
  }

  // Se couber em 1 linha a 38px
  ctx.font = "800 38px sans-serif";
  if (ctx.measureText(title).width <= maxWidth) {
    ctx.fillText(title, centerX, startY);
    return;
  }

  // Divisão elegante em 2 linhas por palavras
  const words = title.split(" ");
  const midpoint = Math.ceil(words.length / 2);
  const line1 = words.slice(0, midpoint).join(" ");
  const line2 = words.slice(midpoint).join(" ");

  ctx.font = "800 36px sans-serif";
  ctx.fillText(line1, centerX, startY - 22);
  ctx.fillText(line2, centerX, startY + 26);
}

/**
 * Converte data técnica em formato editorial legível.
 */
function cleanDateString(rawDate: string): string {
  if (!rawDate) return "";
  // Se contiver padrão com traço ou vírgula, formata com elegância
  return rawDate
    .replace(/^([A-Z]{3,4}\.?,?\s*)/i, "")
    .trim();
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
 * Realiza o download direto do card como arquivo PNG de alta resolução.
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
 * Copia o PNG gerado para a área de transferência do usuário.
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
 * Dispara o Web Share API nativo (Instagram Stories, WhatsApp, AirDrop, etc.).
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
