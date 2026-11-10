"use server";

import { revalidatePath } from "next/cache";
import {
  createTenantMedia,
  deleteTenantMedia,
  listTenantMedia,
  updateTenantMedia,
} from "./service";
import { formObject, toActionState, type ActionState } from "@/server/actions";
import { getTenantContext } from "@/server/auth/session";

export async function createTenantMediaAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  return toActionState(async () => {
    const ctx = await getTenantContext();
    const raw = formObject(formData);

    const tagsRaw = String(formData.get("tags") ?? "");
    const tags = tagsRaw
      ? tagsRaw
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean)
      : [];

    await createTenantMedia(ctx, {
      title: raw.title,
      description: raw.description,
      mediaType: raw.mediaType || "IMAGE",
      url: raw.url,
      thumbnailUrl: raw.thumbnailUrl || undefined,
      category: raw.category || undefined,
      tags,
    });

    revalidatePath("/coach/gallery");
    return { ok: true, message: "Mídia cadastrada com sucesso na sua galeria." };
  });
}

export async function updateTenantMediaAction(
  mediaId: string,
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  return toActionState(async () => {
    const ctx = await getTenantContext();
    const raw = formObject(formData);

    const tagsRaw = formData.get("tags");
    const tags =
      tagsRaw !== null
        ? String(tagsRaw)
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean)
        : undefined;

    await updateTenantMedia(ctx, mediaId, {
      title: raw.title,
      description: raw.description,
      mediaType: raw.mediaType,
      url: raw.url,
      thumbnailUrl: raw.thumbnailUrl,
      category: raw.category,
      tags,
    });

    revalidatePath("/coach/gallery");
    return { ok: true, message: "Mídia atualizada com sucesso." };
  });
}

export async function deleteTenantMediaAction(mediaId: string): Promise<ActionState> {
  return toActionState(async () => {
    const ctx = await getTenantContext();
    await deleteTenantMedia(ctx, mediaId);
    revalidatePath("/coach/gallery");
    return { ok: true, message: "Mídia removida da galeria." };
  });
}

export async function searchTenantGalleryAction(
  searchQuery?: string,
  mediaType?: "IMAGE" | "VIDEO" | "GIF"
) {
  const ctx = await getTenantContext();
  return listTenantMedia(ctx, { search: searchQuery, mediaType, take: 50 });
}
