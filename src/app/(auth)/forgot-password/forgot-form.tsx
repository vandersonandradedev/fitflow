"use client";

import { useActionState } from "react";
import Link from "next/link";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { forgotPasswordAction } from "@/app/(auth)/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ActionState } from "@/server/actions";

const initialState: ActionState = {};

export function ForgotForm() {
  const [state, formAction, pending] = useActionState(forgotPasswordAction, initialState);

  if (state.ok && state.message) {
    return (
      <div className="space-y-4 py-2 text-center">
        <CheckCircle2 className="mx-auto h-7 w-7 text-primary" />
        <p className="text-xs leading-relaxed text-muted-foreground">{state.message}</p>
        <Link href="/login" className="block">
          <Button variant="outline" className="w-full">
            Voltar ao Login
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-4">
      {state.error && (
        <div
          role="alert"
          className="rounded-md border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-300"
        >
          {state.error}
        </div>
      )}

      <div className="space-y-1.5">
        <Label htmlFor="email" className="text-xs font-medium text-foreground">
          E-mail da conta
        </Label>
        <Input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          placeholder="seu.email@exemplo.com"
        />
      </div>

      <Button type="submit" disabled={pending} className="w-full h-10">
        {pending ? "Enviando..." : "Enviar Link de Redefinição"}
        <ArrowRight className="h-4 w-4" />
      </Button>
    </form>
  );
}
