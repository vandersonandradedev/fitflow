import type { Prisma, StorageProvider } from "@prisma/client";
import { prisma } from "@/lib/db";
import { assertCoach, type TenantContext } from "@/server/auth/context";
import { writeAudit } from "@/server/audit";
import { NotFoundError } from "@/server/errors";
import { parseInput } from "@/server/validation";
import { parseMediaUrl } from "@/modules/media/links";
import {
  createTenantMediaSchema,
  listTenantMediaFilterSchema,
  updateTenantMediaSchema,
} from "./types";

function detectStorageProvider(url: string): StorageProvider {
  const lower = url.toLowerCase();
  if (lower.includes("youtube.com") || lower.includes("youtu.be")) {
    return "YOUTUBE";
  }
  if (lower.includes("vimeo.com")) {
    return "VIMEO";
  }
  if (
    lower.includes(".r2.cloudflarestorage.com") ||
    lower.includes(".r2.dev") ||
    lower.includes("media.fitflow.app")
  ) {
    return "R2";
  }
  return "EXTERNAL";
}

/**
 * Lista as mídias da galeria privada do tenant (treinador).
 * Garante isolamento estrito por tenantId (anti-IDOR).
 */
export async function listTenantMedia(ctx: TenantContext, rawFilter: unknown = {}) {
  assertCoach(ctx);
  const filter = parseInput(listTenantMediaFilterSchema, rawFilter);

  const where: Prisma.TenantMediaWhereInput = {
    tenantId: ctx.tenantId,
  };

  if (filter.mediaType) {
    where.mediaType = filter.mediaType;
  }

  if (filter.category) {
    where.category = { equals: filter.category, mode: "insensitive" };
  }

  if (filter.search) {
    where.OR = [
      { title: { contains: filter.search, mode: "insensitive" } },
      { description: { contains: filter.search, mode: "insensitive" } },
      { category: { contains: filter.search, mode: "insensitive" } },
      { tags: { has: filter.search.toLowerCase() } },
    ];
  }

  return prisma.tenantMedia.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: filter.take,
  });
}

/**
 * Busca uma mídia específica da galeria pelo ID, garantindo propriedade do tenant.
 */
export async function getTenantMedia(ctx: TenantContext, mediaId: string) {
  assertCoach(ctx);

  const media = await prisma.tenantMedia.findFirst({
    where: { id: mediaId, tenantId: ctx.tenantId },
  });

  if (!media) {
    throw new NotFoundError("Mídia não encontrada na galeria.");
  }

  return media;
}

/**
 * Cadastra uma nova mídia na galeria do treinador.
 * Auto-detecta provedores (YouTube, Vimeo, R2) e gera thumbnail automática caso não informada.
 */
export async function createTenantMedia(ctx: TenantContext, rawInput: unknown) {
  assertCoach(ctx);
  const data = parseInput(createTenantMediaSchema, rawInput);

  const parsed = parseMediaUrl(data.url);
  const detectedProvider = detectStorageProvider(data.url);
  const effectiveThumbnail =
    data.thumbnailUrl || parsed.thumbnailUrl || (data.mediaType === "IMAGE" ? data.url : null);

  const normalizedTags = data.tags.map((t) => t.toLowerCase().trim()).filter(Boolean);

  const created = await prisma.tenantMedia.create({
    data: {
      tenantId: ctx.tenantId,
      title: data.title,
      description: data.description,
      mediaType: data.mediaType,
      url: data.url,
      thumbnailUrl: effectiveThumbnail,
      storageProvider: detectedProvider,
      category: data.category,
      tags: normalizedTags,
    },
  });

  await writeAudit(prisma, {
    tenantId: ctx.tenantId,
    userId: ctx.userId,
    action: "TENANT_MEDIA_CREATED",
    resource: "tenant_media",
    resourceId: created.id,
    metadata: { title: created.title, mediaType: created.mediaType },
  });

  return created;
}

/**
 * Atualiza os metadados de uma mídia da galeria.
 */
export async function updateTenantMedia(ctx: TenantContext, mediaId: string, rawInput: unknown) {
  assertCoach(ctx);
  const data = parseInput(updateTenantMediaSchema, rawInput);

  const existing = await getTenantMedia(ctx, mediaId);

  let effectiveThumbnail = data.thumbnailUrl;
  let detectedProvider = existing.storageProvider;

  if (data.url) {
    const parsed = parseMediaUrl(data.url);
    detectedProvider = detectStorageProvider(data.url);
    if (!effectiveThumbnail) {
      effectiveThumbnail = parsed.thumbnailUrl || (data.mediaType === "IMAGE" ? data.url : null);
    }
  }

  const updated = await prisma.tenantMedia.update({
    where: { id: existing.id },
    data: {
      title: data.title,
      description: data.description ?? undefined,
      mediaType: data.mediaType,
      url: data.url,
      thumbnailUrl: effectiveThumbnail !== undefined ? effectiveThumbnail : undefined,
      storageProvider: detectedProvider,
      category: data.category ?? undefined,
      tags: data.tags ? data.tags.map((t) => t.toLowerCase().trim()).filter(Boolean) : undefined,
    },
  });

  await writeAudit(prisma, {
    tenantId: ctx.tenantId,
    userId: ctx.userId,
    action: "TENANT_MEDIA_UPDATED",
    resource: "tenant_media",
    resourceId: updated.id,
    metadata: { title: updated.title },
  });

  return updated;
}

/**
 * Exclui uma mídia da galeria do estúdio.
 */
export async function deleteTenantMedia(ctx: TenantContext, mediaId: string) {
  assertCoach(ctx);
  const existing = await getTenantMedia(ctx, mediaId);

  await prisma.tenantMedia.delete({
    where: { id: existing.id },
  });

  await writeAudit(prisma, {
    tenantId: ctx.tenantId,
    userId: ctx.userId,
    action: "TENANT_MEDIA_DELETED",
    resource: "tenant_media",
    resourceId: existing.id,
    metadata: { title: existing.title },
  });

  return { ok: true };
}
