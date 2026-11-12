"use client";

import { useState } from "react";
import { parseMediaUrl } from "@/modules/media/links";
import { SafeImage } from "./safe-image";
import { Maximize2, Play, Video } from "lucide-react";

interface MediaPreviewProps {
  url: string;
  alt: string;
  className?: string;
  aspectRatio?: "video" | "square" | "wide" | "4/3" | "tall" | "auto";
  fit?: "cover" | "contain";
}

/**
 * Visualizador universal de mídia por link.
 * Suporta imagens externas, GIFs, YouTube, Vimeo e vídeos MP4/WebM sem armazenar mídia localmente.
 * Área de exibição aprimorada para evitar cortes de biomecânica (cabeça/membros/pesos).
 */
export function MediaPreview({
  url,
  alt,
  className = "",
  aspectRatio = "4/3",
  fit = "contain",
}: MediaPreviewProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentFit, setCurrentFit] = useState<"cover" | "contain">(fit);
  const parsed = parseMediaUrl(url);

  const aspectClass =
    aspectRatio === "video"
      ? "aspect-video"
      : aspectRatio === "square"
      ? "aspect-square"
      : aspectRatio === "wide"
      ? "aspect-[16/10]"
      : aspectRatio === "tall"
      ? "aspect-[3/4]"
      : aspectRatio === "4/3"
      ? "aspect-[4/3]"
      : "w-full aspect-auto min-h-[260px] sm:min-h-[340px]";

  if (parsed.embedUrl) {
    if (!isPlaying && parsed.thumbnailUrl) {
      return (
        <button
          type="button"
          className={`relative block w-full overflow-hidden rounded-lg border border-border bg-background text-left cursor-pointer group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${aspectClass} ${className}`}
          onClick={() => setIsPlaying(true)}
          aria-label={`Reproduzir vídeo: ${alt}`}
        >
          <SafeImage
            src={parsed.thumbnailUrl}
            alt={alt}
            className="h-full w-full object-cover"
            containerClassName="h-full w-full"
          />
          <div className="absolute inset-0 flex items-center justify-center bg-black/45 transition-colors duration-150 group-hover:bg-black/30">
            <div className="flex h-11 w-11 items-center justify-center rounded-md bg-primary text-primary-foreground transition-colors duration-150 group-hover:bg-brand-emeraldHover">
              <Play className="h-5 w-5 fill-current ml-0.5" />
            </div>
          </div>
          <div className="absolute bottom-2 left-2 flex items-center gap-1 rounded bg-black/75 px-2 py-0.5 text-[11px] font-medium text-foreground">
            <Video className="h-3 w-3 text-muted-foreground" />
            Vídeo
          </div>
        </button>
      );
    }

    return (
      <div
        className={`relative overflow-hidden rounded-lg border border-border bg-black ${aspectClass} ${className}`}
      >
        <iframe
          src={`${parsed.embedUrl}&autoplay=1`}
          title={alt}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="h-full w-full border-0"
        />
      </div>
    );
  }

  if (parsed.mediaType === "VIDEO") {
    return (
      <div
        className={`relative overflow-hidden rounded-lg border border-border bg-black ${aspectClass} ${className}`}
      >
        <video
          src={url}
          controls
          preload="metadata"
          className="h-full w-full object-contain"
        >
          Seu navegador não suporta a tag de vídeo.
        </video>
      </div>
    );
  }

  return (
    <div
      className={`relative group overflow-hidden rounded-lg border border-border bg-[#090B0E] flex items-center justify-center ${aspectClass} ${className}`}
    >
      <SafeImage
        src={url}
        alt={alt}
        className={`h-full w-full ${currentFit === "cover" ? "object-cover" : "object-contain"}`}
        containerClassName="h-full w-full flex items-center justify-center"
      />
      <button
        type="button"
        onClick={() => setCurrentFit(currentFit === "contain" ? "cover" : "contain")}
        aria-label={currentFit === "contain" ? "Preencher área" : "Ajustar à área (sem cortes)"}
        title={currentFit === "contain" ? "Preencher área" : "Ajustar à área (sem cortes)"}
        className="absolute bottom-2 right-2 flex items-center gap-1 rounded bg-black/75 px-2 py-1 text-[11px] font-medium text-foreground opacity-75 group-hover:opacity-100 transition-opacity hover:bg-black/95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary backdrop-blur-sm"
      >
        <Maximize2 className="h-3 w-3 text-primary" />
        <span className="text-[10px] sm:text-xs">
          {currentFit === "contain" ? "Sem corte" : "Preenchido"}
        </span>
      </button>
    </div>
  );
}
