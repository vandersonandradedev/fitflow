"use client";

import { useActionState } from "react";
import { KeyRound } from "lucide-react";
import { changePasswordAction } from "@/app/(auth)/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ActionState } from "@/server/actions";

const initialState: ActionState = {};

export function ChangePasswordForm() {
  const [state, formAction, pending] = useActionState(changePasswordAction, initialState);

  return (
    <form action={formAction} className="space-y-4 max-w-md">
      {state.error && (
        <div
          role="alert"
          className="rounded-md border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-300"
        >
          {state.error}
        </div>
      )}

      <div className="space-y-1.5">
        <Label htmlFor="currentPassword" className="text-xs text-muted-foreground">
          Senha atual
        </Label>
        <Input
          id="currentPassword"
          name="currentPassword"
          type="password"
          required
          autoComplete="current-password"
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="newPassword" className="text-xs text-muted-foreground">
          Nova senha (mínimo 10 caracteres)
        </Label>
        <Input
          id="newPassword"
          name="newPassword"
          type="password"
          required
          minLength={10}
          autoComplete="new-password"
        />
        {state.fieldErrors?.newPassword?.[0] && (
          <p className="text-[11px] text-red-400">{state.fieldErrors.newPassword[0]}</p>
        )}
      </div>

      <Button type="submit" disabled={pending} size="sm">
        <KeyRound className="h-4 w-4" />
        {pending ? "Alterando..." : "Atualizar senha"}
      </Button>
    </form>
  );
}
