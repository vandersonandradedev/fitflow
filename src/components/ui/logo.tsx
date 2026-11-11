import Image from "next/image";
import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
  showWordmark?: boolean;
  priority?: boolean;
}

const SIZE_VARIANTS = {
  sm: {
    height: 24,
    width: 137,
    iconSize: 24,
    logoClass: "h-6",
    textClass: "text-base font-bold",
  },
  md: {
    height: 32,
    width: 183,
    iconSize: 32,
    logoClass: "h-8",
    textClass: "text-lg font-bold",
  },
  lg: {
    height: 40,
    width: 229,
    iconSize: 40,
    logoClass: "h-10",
    textClass: "text-xl font-extrabold",
  },
  xl: {
    height: 52,
    width: 297,
    iconSize: 52,
    logoClass: "h-[52px]",
    textClass: "text-2xl font-extrabold",
  },
};

/**
 * Logomarca oficial do FitFlow.
 * Renderiza o símbolo do halter estilizado em verde esmeralda e a tipografia FitFlow.
 */
export function FitFlowLogo({
  className,
  size = "md",
  showWordmark = true,
  priority = false,
}: LogoProps) {
  const variant = SIZE_VARIANTS[size];

  if (!showWordmark) {
    return (
      <FitFlowIcon size={size} className={className} priority={priority} />
    );
  }

  return (
    <div className={cn("inline-flex items-center gap-2 select-none", className)}>
      <Image
        src="/images/logo.png"
        alt="FitFlow"
        width={variant.width}
        height={variant.height}
        priority={priority}
        className={cn(variant.logoClass, "w-auto object-contain")}
      />
    </div>
  );
}

/**
 * Ícone / Símbolo do FitFlow (Halter estilizado em movimento).
 */
export function FitFlowIcon({
  className,
  size = "md",
  priority = false,
}: {
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
  priority?: boolean;
}) {
  const variant = SIZE_VARIANTS[size];

  return (
    <div
      className={cn(
        "relative inline-flex items-center justify-center shrink-0 select-none overflow-hidden rounded-lg",
        className
      )}
      style={{ width: variant.iconSize, height: variant.iconSize }}
    >
      <Image
        src="/images/logo-icon.png"
        alt="FitFlow Icon"
        width={variant.iconSize * 2}
        height={variant.iconSize * 2}
        priority={priority}
        className="h-full w-full object-contain"
      />
    </div>
  );
}
