import { describe, expect, it } from "vitest";
import {
  createTenantMedia,
  deleteTenantMedia,
  getTenantMedia,
  listTenantMedia,
  updateTenantMedia,
} from "@/modules/gallery/service";
import { createCoach } from "./helpers";
import { NotFoundError } from "@/server/errors";

describe("Galeria de Mídia do Treinador — Isolamento e Gestão por Tenant", () => {
  it("cadastra mídias na galeria com extração automática de thumbnail para YouTube", async () => {
    const coach = await createCoach("galCoachA");

    const ytMedia = await createTenantMedia(coach.ctx, {
      title: "Agachamento Búlgaro Demonstração",
      url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      mediaType: "VIDEO",
      category: "Pernas",
      tags: ["pernas", "quadriceps", "bulgaro"],
    });

    expect(ytMedia.id).toBeDefined();
    expect(ytMedia.storageProvider).toBe("YOUTUBE");
    expect(ytMedia.thumbnailUrl).toContain("img.youtube.com/vi/dQw4w9WgXcQ/hqdefault.jpg");
    expect(ytMedia.tags).toContain("bulgaro");

    const found = await getTenantMedia(coach.ctx, ytMedia.id);
    expect(found.title).toBe("Agachamento Búlgaro Demonstração");
  });

  it("busca e filtra mídias por tipo, categoria e texto", async () => {
    const coach = await createCoach("galCoachB");

    await createTenantMedia(coach.ctx, {
      title: "Supino Inclinado com Halteres",
      url: "https://images.unsplash.com/photo-1517838277536-f5f99be501cd",
      mediaType: "IMAGE",
      category: "Peito",
      tags: ["peitoral", "halteres"],
    });

    await createTenantMedia(coach.ctx, {
      title: "Puxada Frontal na Polia",
      url: "https://media.fitflow.app/tenants/t1/exercises/lat-pulldown.mp4",
      mediaType: "VIDEO",
      category: "Costas",
      tags: ["dorsal", "cabo"],
    });

    // 1. Filtro por tipo
    const imagesOnly = await listTenantMedia(coach.ctx, { mediaType: "IMAGE" });
    expect(imagesOnly.length).toBe(1);
    expect(imagesOnly[0]!.title).toBe("Supino Inclinado com Halteres");

    // 2. Filtro por busca textual
    const searched = await listTenantMedia(coach.ctx, { search: "Puxada" });
    expect(searched.length).toBe(1);
    expect(searched[0]!.title).toBe("Puxada Frontal na Polia");

    // 3. Filtro por tag
    const byTag = await listTenantMedia(coach.ctx, { search: "dorsal" });
    expect(byTag.length).toBe(1);
  });

  it("garante isolamento multi-tenant (anti-IDOR) absoluto na galeria", async () => {
    const coachA = await createCoach("galIsoA");
    const coachB = await createCoach("galIsoB");

    const mediaA = await createTenantMedia(coachA.ctx, {
      title: "Mídia Privada do Treinador A",
      url: "https://images.unsplash.com/photo-1517838277536-f5f99be501cd",
      mediaType: "IMAGE",
    });

    // Treinador B não lista a mídia do Treinador A
    const listB = await listTenantMedia(coachB.ctx);
    expect(listB.some((m) => m.id === mediaA.id)).toBe(false);

    // Treinador B não lê diretamente a mídia do Treinador A (erro idêntico a inexistente)
    await expect(getTenantMedia(coachB.ctx, mediaA.id)).rejects.toBeInstanceOf(
      NotFoundError
    );

    // Treinador B não atualiza a mídia do Treinador A
    await expect(
      updateTenantMedia(coachB.ctx, mediaA.id, { title: "Hacked" })
    ).rejects.toBeInstanceOf(NotFoundError);

    // Treinador B não exclui a mídia do Treinador A
    await expect(deleteTenantMedia(coachB.ctx, mediaA.id)).rejects.toBeInstanceOf(
      NotFoundError
    );

    // Treinador A exclui sua própria mídia com sucesso
    const delRes = await deleteTenantMedia(coachA.ctx, mediaA.id);
    expect(delRes.ok).toBe(true);

    await expect(getTenantMedia(coachA.ctx, mediaA.id)).rejects.toBeInstanceOf(
      NotFoundError
    );
  });
});
