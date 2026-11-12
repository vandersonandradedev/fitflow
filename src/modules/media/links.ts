/**
 * Utilitários de alto desempenho para manipulação e extração de metadados de mídias por LINK.
 * Zero armazenamento local, zero proxy no servidor Next.js: links externos são processados
 * diretamente pelo cliente ou via CDNs oficiais (ex: YouTube, Vimeo, Cloudflare R2, Unsplash).
 */

export interface ParsedMedia {
  originalUrl: string;
  provider: "YOUTUBE" | "VIMEO" | "R2" | "UNSPLASH" | "EXTERNAL";
  mediaType: "VIDEO" | "IMAGE" | "GIF";
  thumbnailUrl: string | null;
  embedUrl: string | null;
  videoId?: string;
}

/**
 * Extrai o ID do vídeo do YouTube a partir de qualquer formato comum de URL:
 * - https://www.youtube.com/watch?v=VIDEO_ID
 * - https://youtu.be/VIDEO_ID
 * - https://www.youtube.com/shorts/VIDEO_ID
 * - https://www.youtube.com/embed/VIDEO_ID
 */
export function extractYouTubeId(url: string): string | null {
  try {
    const parsed = new URL(url);
    if (parsed.hostname.includes("youtu.be")) {
      return parsed.pathname.replace(/^\//, "").split(/[\/\?]/)[0] || null;
    }
    if (parsed.hostname.includes("youtube.com")) {
      if (parsed.pathname.startsWith("/watch")) {
        return parsed.searchParams.get("v");
      }
      if (parsed.pathname.startsWith("/shorts/") || parsed.pathname.startsWith("/embed/")) {
        return parsed.pathname.split("/")[2] || null;
      }
    }
  } catch {}
  return null;
}

/**
 * Extrai o ID do vídeo do Vimeo a partir de links como:
 * - https://vimeo.com/123456789
 * - https://player.vimeo.com/video/123456789
 */
export function extractVimeoId(url: string): string | null {
  try {
    const parsed = new URL(url);
    if (parsed.hostname.includes("vimeo.com")) {
      const match = parsed.pathname.match(/\/(\d+)/);
      return match ? match[1] : null;
    }
  } catch {}
  return null;
}

/**
 * Analisa uma URL e retorna metadados completos de reprodução e thumbnail sem custo de servidor.
 */
export function parseMediaUrl(url: string): ParsedMedia {
  const trimmed = url.trim();
  const lower = trimmed.toLowerCase();

  // 1. YouTube: gera thumbnail diretamente de img.youtube.com (zero custo Vercel)
  const ytId = extractYouTubeId(trimmed);
  if (ytId) {
    return {
      originalUrl: trimmed,
      provider: "YOUTUBE",
      mediaType: "VIDEO",
      videoId: ytId,
      thumbnailUrl: `https://img.youtube.com/vi/${ytId}/hqdefault.jpg`,
      embedUrl: `https://www.youtube-nocookie.com/embed/${ytId}?rel=0&modestbranding=1`,
    };
  }

  // 2. Vimeo: gera link de embed seguro
  const vimeoId = extractVimeoId(trimmed);
  if (vimeoId) {
    return {
      originalUrl: trimmed,
      provider: "VIMEO",
      mediaType: "VIDEO",
      videoId: vimeoId,
      thumbnailUrl: null,
      embedUrl: `https://player.vimeo.com/video/${vimeoId}?dnt=1`,
    };
  }

  // 3. Cloudflare R2 / S3
  if (
    lower.includes(".r2.cloudflarestorage.com") ||
    lower.includes(".r2.dev") ||
    lower.includes("media.fitflow.app")
  ) {
    const isVideo =
      lower.endsWith(".mp4") ||
      lower.endsWith(".webm") ||
      lower.endsWith(".mov") ||
      lower.endsWith(".m4v") ||
      lower.endsWith(".ogv") ||
      lower.endsWith(".3gp");
    return {
      originalUrl: trimmed,
      provider: "R2",
      mediaType: isVideo ? "VIDEO" : "IMAGE",
      thumbnailUrl: isVideo ? null : trimmed,
      embedUrl: null,
    };
  }

  // 4. Unsplash
  if (lower.includes("images.unsplash.com")) {
    return {
      originalUrl: trimmed,
      provider: "UNSPLASH",
      mediaType: "IMAGE",
      thumbnailUrl: trimmed,
      embedUrl: null,
    };
  }

  // 5. Link genérico externo
  const isGif = lower.endsWith(".gif");
  const isVideo = lower.endsWith(".mp4") || lower.endsWith(".webm") || lower.endsWith(".mov");

  return {
    originalUrl: trimmed,
    provider: "EXTERNAL",
    mediaType: isGif ? "GIF" : isVideo ? "VIDEO" : "IMAGE",
    thumbnailUrl: isVideo ? null : trimmed,
    embedUrl: null,
  };
}
