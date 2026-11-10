"use client";

import { useEffect, useState, useTransition } from "react";
import { Images, Play, Search, Video } from "lucide-react";
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
import { SafeImage } from "@/components/ui/safe-image";
import { searchTenantGalleryAction } from "@/modules/gallery/actions";

export interface SelectedMediaItem {
  id: string;
  title: string;
  url: string;
  thumbnailUrl: string | null;
  mediaType: "IMAGE" | "VIDEO" | "GIF";
  category: string | null;
}

interface GalleryPickerDialogProps {
  onSelect: (media: SelectedMediaItem) => void;
  triggerLabel?: string;
  allowedType?: "IMAGE" | "VIDEO" | "GIF";
}

export function GalleryPickerDialog({
  onSelect,
  triggerLabel = "Escolher da Galeria",
  allowedType,
}: GalleryPickerDialogProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [items, setItems] = useState<SelectedMediaItem[]>([]);
  const [isPending, startTransition] = useTransition();

  const loadMedia = (query = "") => {
    startTransition(async () => {
      try {
        const res = await searchTenantGalleryAction(query, allowedType);
        setItems(
          res.map((m) => ({
            id: m.id,
            title: m.title,
            url: m.url,
            thumbnailUrl: m.thumbnailUrl,
            mediaType: m.mediaType as "IMAGE" | "VIDEO" | "GIF",
            category: m.category,
          }))
        );
      } catch {
        setItems([]);
      }
    });
  };

  useEffect(() => {
    if (open) {
      loadMedia(search);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadMedia(search);
  };

  const handlePick = (item: SelectedMediaItem) => {
    onSelect(item);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button" variant="outline" size="sm" className="gap-1.5 text-xs">
          <Images className="h-3.5 w-3.5 text-primary" />
          {triggerLabel}
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col">
        <DialogHeader className="shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <Images className="h-5 w-5 text-primary" />
            Galeria de Mídia do Estúdio
          </DialogTitle>
          <DialogDescription>
            Selecione uma imagem ou vídeo cadastrado na sua galeria para vincular instantaneamente.
          </DialogDescription>
        </DialogHeader>

        {/* Search Bar */}
        <form onSubmit={handleSearchSubmit} className="flex gap-2 my-2 shrink-0">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por título, categoria ou tag..."
              className="pl-9 h-9 text-xs"
            />
          </div>
          <Button type="submit" size="sm" disabled={isPending} className="h-9 text-xs">
            {isPending ? "Buscando..." : "Buscar"}
          </Button>
        </form>

        {/* Grid of Media Items */}
        <div className="flex-1 overflow-y-auto pr-1 min-h-[300px]">
          {isPending ? (
            <div className="flex items-center justify-center h-48 text-muted-foreground text-xs">
              Carregando mídias da galeria...
            </div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-center text-muted-foreground">
              <Images className="h-8 w-8 text-muted-foreground/40 mb-2" />
              <p className="text-sm font-medium">Nenhuma mídia encontrada</p>
              <p className="text-xs text-muted-foreground/80 mt-1">
                Cadastre links ou faça upload na aba &quot;Galeria de Mídia&quot; para reutilizá-los aqui.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {items.map((item) => {
                const previewSrc = item.thumbnailUrl || (item.mediaType === "IMAGE" ? item.url : null);
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handlePick(item)}
                    className="group flex flex-col text-left rounded-lg border border-border bg-card overflow-hidden hover:border-primary hover:shadow-md transition-all focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <div className="relative aspect-video w-full bg-secondary/50 overflow-hidden">
                      <SafeImage
                        src={previewSrc}
                        alt={item.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                        fallbackText={item.title}
                      />
                      {item.mediaType === "VIDEO" && (
                        <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                          <div className="h-7 w-7 rounded-full bg-primary/90 text-primary-foreground flex items-center justify-center shadow">
                            <Play className="h-3.5 w-3.5 fill-current ml-0.5" />
                          </div>
                        </div>
                      )}
                      <div className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded bg-black/75 text-[9px] text-white font-medium flex items-center gap-0.5">
                        {item.mediaType === "VIDEO" ? (
                          <Video className="h-2.5 w-2.5 text-red-400" />
                        ) : (
                          <Images className="h-2.5 w-2.5 text-emerald-400" />
                        )}
                        {item.mediaType}
                      </div>
                    </div>

                    <div className="p-2 min-w-0">
                      <p className="truncate text-xs font-medium text-foreground group-hover:text-primary">
                        {item.title}
                      </p>
                      {item.category && (
                        <p className="text-[10px] text-muted-foreground truncate mt-0.5">
                          {item.category}
                        </p>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
