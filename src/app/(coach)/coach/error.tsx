"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function CoachError({
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
    <div className="rounded-lg border border-border bg-card p-8 text-center">
      <h2 className="text-base font-semibold text-foreground">
        Não foi possível carregar esta área
      </h2>
      <p className="mx-auto mt-1 max-w-md text-xs text-muted-foreground">
        Ocorreu uma falha inesperada ao consultar os dados. Tente recarregar a visualização.
      </p>
      <div className="mt-4">
        <Button onClick={reset} size="sm">
          Tentar novamente
        </Button>
      </div>
    </div>
  );
}
