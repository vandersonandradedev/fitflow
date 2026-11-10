"use client";

import { useState } from "react";
import { parseMediaUrl } from "@/modules/media/links";
import { SafeImage } from "./safe-image";
import { Play, Video } from "lucide-react";

interface MediaPreviewProps {
  url: string;
  alt: string;
  className?: string;
  aspectRatio?: "video" | "square" | "wide";
}

/**
 * Visualizador universal de mídia por link.
 * Suporta imagens externas, YouTube, Vimeo e vídeos MP4/WebM sem armazenar mídia localmente.
 */
export function MediaPreview({
  url,
  alt,
  className = "",
  aspectRatio = "video",
}: MediaPreviewProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const parsed = parseMediaUrl(url);

  const aspectClass =
    aspectRatio === "video"
      ? "aspect-video"
      : aspectRatio === "square"
      ? "aspect-square"
      : "aspect-[16/10]";

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
      className={`relative overflow-hidden rounded-lg border border-border bg-background ${aspectClass} ${className}`}
    >
      <SafeImage
        src={url}
        alt={alt}
        className="h-full w-full object-cover"
        containerClassName="h-full w-full"
      />
    </div>
  );
}
