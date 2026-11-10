"use client";

import { useState } from "react";
import { Dumbbell } from "lucide-react";

interface SafeImageProps extends Omit<React.ImgHTMLAttributes<HTMLImageElement>, "src"> {
  src?: string | null;
  alt: string;
  fallbackText?: string;
  className?: string;
  containerClassName?: string;
}

/**
 * Componente de imagem nativa com fallback discreto e sem custos de re-compressão.
 */
export function SafeImage({
  src,
  alt,
  fallbackText,
  className = "",
  containerClassName = "",
  ...props
}: SafeImageProps) {
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const cleanSrc = src && typeof src === "string" ? src.trim() : null;

  if (!cleanSrc || hasError) {
    return (
      <div
        className={`flex flex-col items-center justify-center rounded-md border border-border bg-background p-3 text-center text-brand-textMuted ${containerClassName}`}
        role="img"
        aria-label={alt}
      >
        <Dumbbell className="mb-1 h-5 w-5 stroke-[1.5] text-brand-borderStrong" />
        <span className="line-clamp-1 text-[11px] font-medium text-brand-textMuted">
          {fallbackText || alt || "Sem imagem"}
        </span>
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden ${containerClassName}`}>
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-background">
          <Dumbbell className="h-5 w-5 text-border" />
        </div>
      )}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={cleanSrc}
        alt={alt}
        loading="lazy"
        decoding="async"
        referrerPolicy="no-referrer"
        onLoad={() => setIsLoading(false)}
        onError={() => {
          setIsLoading(false);
          setHasError(true);
        }}
        className={`transition-opacity duration-150 ${
          isLoading ? "opacity-0" : "opacity-100"
        } ${className}`}
        {...props}
      />
    </div>
  );
}
