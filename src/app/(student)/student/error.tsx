"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function StudentError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="rounded-lg border border-border bg-card p-6 text-center">
      <h2 className="text-sm font-semibold text-foreground">
        Erro ao carregar seu treino
      </h2>
      <p className="mt-1 text-xs text-muted-foreground">
        Verifique sua conexão e tente novamente.
      </p>
      <div className="mt-4">
        <Button onClick={reset} size="touch">
          Tentar novamente
        </Button>
      </div>
    </div>
  );
}
