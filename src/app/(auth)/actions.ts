"use server";

import { redirect } from "next/navigation";
import { AuthError } from "next-auth";
import { acceptInvite } from "@/modules/students/invites";
import {
  changePassword,
  registerCoach,
  requestPasswordReset,
  resetPassword,
  revokeAllSessions,
  verifyEmail,
} from "@/modules/auth/service";
import { signIn, signOut } from "@/server/auth/auth";
import { getTenantContext } from "@/server/auth/session";
import { formObject, requestMeta, toActionState, type ActionState } from "@/server/actions";

const LOGIN_ERRORS: Record<string, string> = {
  email_not_verified: "Confirme seu e-mail antes de entrar. Procure a mensagem de verificação na sua caixa de entrada.",
  rate_limited: "Muitas tentativas. Aguarde alguns minutos e tente novamente.",
  invalid_credentials: "E-mail ou senha incorretos.",
};

export async function loginAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const state = await toActionState(async () => {
    try {
      await signIn("credentials", {
        email: String(formData.get("email") ?? ""),
        password: String(formData.get("password") ?? ""),
        redirect: false,
      });
    } catch (error) {
      if (error instanceof AuthError) {
        const code = (error as AuthError & { code?: string }).code ?? "invalid_credentials";
        return { error: LOGIN_ERRORS[code] ?? LOGIN_ERRORS.invalid_credentials };
      }
      throw error;
    }
  });
  if (state.ok) redirect("/coach/dashboard"); // alunos são redirecionados pelo layout do treinador
  return state;
}

export async function logoutAction(): Promise<void> {
  await signOut({ redirectTo: "/login" });
}

export async function registerAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  return toActionState(async () => {
    await registerCoach(formObject(formData), await requestMeta());
    return {
      ok: true,
      message: "Enviamos um link de confirmação para o seu e-mail. Confirme para ativar a conta.",
    };
  });
}

export async function forgotPasswordAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  return toActionState(async () => {
    await requestPasswordReset(formObject(formData), await requestMeta());
    return { ok: true, message: "Se o e-mail estiver cadastrado, você receberá um link para criar uma nova senha." };
  });
}

export async function resetPasswordAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const state = await toActionState(async () => {
    await resetPassword(formObject(formData), await requestMeta());
  });
  if (state.ok) redirect("/login?reset=1");
  return state;
}

export async function acceptInviteAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const state = await toActionState(async () => {
    await acceptInvite(formObject(formData), await requestMeta());
  });
  if (state.ok) redirect("/login?welcome=1");
  return state;
}

export async function verifyEmailAction(token: string): Promise<boolean> {
  return verifyEmail({ token }).catch(() => false);
}

export async function changePasswordAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const state = await toActionState(async () => {
    const ctx = await getTenantContext();
    await changePassword(ctx.userId, formObject(formData), await requestMeta());
  });
  if (state.ok) redirect("/login?reset=1"); // todas as sessões foram revogadas
  return state;
}

export async function revokeSessionsAction(): Promise<void> {
  const ctx = await getTenantContext();
  await revokeAllSessions(ctx.userId, await requestMeta());
  await signOut({ redirectTo: "/login" });
}
