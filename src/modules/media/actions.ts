"use server";

import { getTenantContext } from "@/server/auth/session";
import { generatePresignedUploadUrl } from "./r2";

export interface RequestUploadUrlResult {
  ok: boolean;
  message?: string;
  data?: {
    uploadUrl: string;
    publicUrl: string;
    key: string;
    expiresInSeconds: number;
  };
}

/**
 * Server Action que valida a sessão do usuário e emite uma URL pré-assinada
 * para upload direto ao Cloudflare R2 sem passar pelo servidor da Vercel.
 */
export async function requestPresignedUploadAction(input: {
  resourceFolder: "exercises" | "assessments" | "avatars";
  contentType: string;
}): Promise<RequestUploadUrlResult> {
  try {
    const ctx = await getTenantContext();

    const res = await generatePresignedUploadUrl({
      tenantId: ctx.tenantId,
      resourceFolder: input.resourceFolder,
      contentType: input.contentType,
    });

    return {
      ok: true,
      data: res,
    };
  } catch (error) {
    return {
      ok: false,
      message:
        error instanceof Error
          ? error.message
          : "Erro ao gerar link de upload seguro.",
    };
  }
}
