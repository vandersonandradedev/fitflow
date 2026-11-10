import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded border px-2 py-0.5 text-xs font-medium transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground font-semibold",
        secondary:
          "border-border bg-secondary text-muted-foreground",
        destructive:
          "border-red-500/25 bg-red-500/10 text-red-400",
        outline: "border-border bg-transparent text-muted-foreground",
        emerald:
          "border-emerald-500/25 bg-emerald-500/10 text-emerald-400",
        warning:
          "border-amber-500/25 bg-amber-500/10 text-amber-400",
        info:
          "border-blue-500/25 bg-blue-500/10 text-blue-400",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
