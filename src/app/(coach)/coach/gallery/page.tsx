import { PageHeader } from "@/components/ui/page-header";
import { listTenantMedia } from "@/modules/gallery/service";
import { requireCoachContext } from "@/server/auth/session";
import { GalleryManager, type GalleryMediaItem } from "./gallery-manager";

export const metadata = {
  title: "Galeria de Mídias | FitFlow",
};

export default async function CoachGalleryPage() {
  const ctx = await requireCoachContext();
  const rawItems = await listTenantMedia(ctx, { take: 100 });

  const items: GalleryMediaItem[] = rawItems.map((item) => ({
    id: item.id,
    title: item.title,
    description: item.description,
    mediaType: item.mediaType as "IMAGE" | "VIDEO" | "GIF",
    url: item.url,
    thumbnailUrl: item.thumbnailUrl,
    storageProvider: item.storageProvider as
      | "R2"
      | "YOUTUBE"
      | "VIMEO"
      | "EXTERNAL",
    category: item.category,
    tags: item.tags,
    createdAt: item.createdAt.toISOString(),
  }));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Galeria de Mídia do Estúdio"
        description="Armazene fotos e vídeos de exercícios por link ou upload direto. Reutilize qualquer mídia rapidamente na prescrição de treinos."
      />

      <GalleryManager initialItems={items} />
    </div>
  );
}
