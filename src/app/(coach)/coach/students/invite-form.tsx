"use client";

import { useActionState, useState } from "react";
import { UserPlus } from "lucide-react";
import { inviteStudentAction } from "./actions";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import type { ActionState } from "@/server/actions";

const initialState: ActionState = {};

export function InviteStudentForm() {
  const [state, formAction, pending] = useActionState(inviteStudentAction, initialState);

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
      {state.ok && state.message && (
        <div className="rounded-md border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-300">
          {state.message}
        </div>
      )}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <Label htmlFor="invite-name" className="text-xs text-muted-foreground">
            Nome do aluno *
          </Label>
          <Input
            id="invite-name"
            name="name"
            required
            minLength={2}
            placeholder="Ex: Mariana Costa"
          />
        </div>

        <div className="space-y-1">
          <Label htmlFor="invite-email" className="text-xs text-muted-foreground">
            E-mail *
          </Label>
          <Input
            id="invite-email"
            name="email"
            type="email"
            required
            placeholder="mariana@exemplo.com"
          />
        </div>

        <div className="space-y-1">
          <Label htmlFor="invite-phone" className="text-xs text-muted-foreground">
            Telefone (opcional)
          </Label>
          <Input
            id="invite-phone"
            name="phone"
            placeholder="(11) 99999-0000"
          />
        </div>

        <div className="space-y-1">
          <Label htmlFor="invite-goal" className="text-xs text-muted-foreground">
            Objetivo principal
          </Label>
          <Select id="invite-goal" name="fitnessGoal" defaultValue="HYPERTROPHY">
            <option value="HYPERTROPHY">Hipertrofia</option>
            <option value="WEIGHT_LOSS">Emagrecimento</option>
            <option value="STRENGTH">Força</option>
            <option value="HEALTH">Saúde e Condicionamento</option>
            <option value="REHABILITATION">Reabilitação</option>
          </Select>
        </div>
      </div>

      <div className="flex justify-end pt-1">
        <Button type="submit" disabled={pending}>
          <UserPlus className="h-4 w-4" />
          {pending ? "Enviando..." : "Enviar convite"}
        </Button>
      </div>
    </form>
  );
}

export function InviteStudentDialog({ defaultOpen = false }: { defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <UserPlus className="h-4 w-4" />
          Convidar aluno
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Convidar novo aluno</DialogTitle>
          <DialogDescription>
            Enviaremos um link de ativação de uso único para o aluno criar a própria senha.
          </DialogDescription>
        </DialogHeader>
        <div className="mt-4">
          <InviteStudentForm />
        </div>
      </DialogContent>
    </Dialog>
  );
}
