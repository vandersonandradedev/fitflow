"use client";

import { useActionState, useState, useTransition } from "react";
import {
  Check,
  Copy,
  ExternalLink,
  Image as ImageIcon,
  Images,
  Link as LinkIcon,
  Plus,
  Search,
  UploadCloud,
  Video,
} from "lucide-react";
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
import { Badge } from "@/components/ui/badge";
import { SafeImage } from "@/components/ui/safe-image";
import { MediaPreview } from "@/components/ui/media-preview";
import { DeleteConfirmDialog } from "@/components/ui/delete-confirm-dialog";
import {
  createTenantMediaAction,
  deleteTenantMediaAction,
} from "@/modules/gallery/actions";
import { requestPresignedUploadAction } from "@/modules/media/actions";
import { parseMediaUrl } from "@/modules/media/links";
import type { ActionState } from "@/server/actions";

export interface GalleryMediaItem {
  id: string;
  title: string;
  description: string | null;
  mediaType: "IMAGE" | "VIDEO" | "GIF";
  url: string;
  thumbnailUrl: string | null;
  storageProvider: "R2" | "YOUTUBE" | "VIMEO" | "EXTERNAL";
  category: string | null;
  tags: string[];
  createdAt: string;
}

interface GalleryManagerProps {
  initialItems: GalleryMediaItem[];
}

export function GalleryManager({ initialItems }: GalleryManagerProps) {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("ALL");
  const [categoryFilter, setCategoryFilter] = useState<string>("ALL");

  // Dialogs state
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [previewItem, setPreviewItem] = useState<GalleryMediaItem | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Form tab: 'LINK' vs 'UPLOAD'
  const [addMode, setAddMode] = useState<"LINK" | "UPLOAD">("LINK");
  const [linkUrl, setLinkUrl] = useState("");
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const [createState, createAction, isCreatePending] = useActionState(
    createTenantMediaAction,
    {} as ActionState
  );
  const [, startTransition] = useTransition();

  // Categories list
  const categories = Array.from(
    new Set(initialItems.map((i) => i.category).filter(Boolean) as string[])
  ).sort();

  // Filter items
  const filteredItems = initialItems.filter((item) => {
    if (typeFilter !== "ALL" && item.mediaType !== typeFilter) return false;
    if (categoryFilter !== "ALL" && item.category !== categoryFilter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      const inTitle = item.title.toLowerCase().includes(q);
      const inCat = (item.category ?? "").toLowerCase().includes(q);
      const inTags = item.tags.some((t) => t.toLowerCase().includes(q));
      if (!inTitle && !inCat && !inTags) return false;
    }
    return true;
  });

  const parsedLiveLink = linkUrl.trim() ? parseMediaUrl(linkUrl) : null;

  const handleCopyLink = async (item: GalleryMediaItem) => {
    try {
      await navigator.clipboard.writeText(item.url);
      setCopiedId(item.id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {}
  };

  const handleDelete = (id: string) => {
    startTransition(async () => {
      await deleteTenantMediaAction(id);
    });
  };

  const handleDirectUploadSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!uploadFile) {
      setUploadError("Selecione um arquivo de imagem ou vídeo.");
      return;
    }

    setUploadError(null);
    setUploadProgress("Solicitando upload seguro ao Cloudflare R2...");

    try {
      const filename = uploadFile.name.toLowerCase();
      let effectiveContentType = uploadFile.type;
      if (!effectiveContentType) {
        if (filename.endsWith(".mp4")) effectiveContentType = "video/mp4";
        else if (filename.endsWith(".mov")) effectiveContentType = "video/quicktime";
        else if (filename.endsWith(".webm")) effectiveContentType = "video/webm";
        else if (filename.endsWith(".m4v")) effectiveContentType = "video/x-m4v";
        else if (filename.endsWith(".jpg") || filename.endsWith(".jpeg")) effectiveContentType = "image/jpeg";
        else if (filename.endsWith(".png")) effectiveContentType = "image/png";
        else if (filename.endsWith(".webp")) effectiveContentType = "image/webp";
        else if (filename.endsWith(".gif")) effectiveContentType = "image/gif";
        else effectiveContentType = "video/mp4";
      }

      const res = await requestPresignedUploadAction({
        resourceFolder: "exercises",
        contentType: effectiveContentType,
      });

      if (!res.ok || !res.data) {
        throw new Error(res.message || "Erro ao obter permissão de upload.");
      }

      setUploadProgress("Enviando arquivo diretamente para o Cloudflare R2...");

      const uploadHttp = await fetch(res.data.uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": effectiveContentType },
        body: uploadFile,
      });

      if (!uploadHttp.ok) {
        throw new Error(
          `Falha na transferência (${uploadHttp.status}: ${uploadHttp.statusText}). Verifique a política de CORS do bucket R2.`
        );
      }

      setUploadProgress("Registrando na sua galeria...");

      const isVideo =
        effectiveContentType.startsWith("video/") ||
        /\.(mp4|mov|webm|m4v|ogv|3gp)$/i.test(filename);

      const form = e.currentTarget;
      const formData = new FormData(form);
      formData.set("url", res.data.publicUrl);
      formData.set("mediaType", isVideo ? "VIDEO" : "IMAGE");

      startTransition(async () => {
        await createTenantMediaAction({} as ActionState, formData);
        setUploadProgress(null);
        setUploadFile(null);
        setCreateDialogOpen(false);
      });
    } catch (err) {
      setUploadProgress(null);
      let errorMsg =
        err instanceof Error ? err.message : "Erro no upload do arquivo.";
      if (errorMsg === "Failed to fetch") {
        errorMsg =
          "Falha na conexão ao Cloudflare R2 (Failed to fetch). Verifique se a política de CORS no bucket R2 permite a origem da aplicação e se as credenciais na Vercel estão ativas.";
      }
      setUploadError(errorMsg);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Filter and Actions Bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-wrap items-center gap-2.5">
          {/* Search */}
          <div className="relative min-w-[200px] flex-1 sm:max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar título, categoria ou tags..."
              className="pl-9 h-9 text-xs"
            />
          </div>

          {/* Type Filter */}
          <Select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="w-[130px] h-9 text-xs"
          >
            <option value="ALL">Todos os tipos</option>
            <option value="IMAGE">Imagens</option>
            <option value="VIDEO">Vídeos</option>
            <option value="GIF">GIFs</option>
          </Select>

          {/* Category Filter */}
          {categories.length > 0 && (
            <Select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-[140px] h-9 text-xs"
            >
              <option value="ALL">Todas categorias</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </Select>
          )}

          {(search || typeFilter !== "ALL" || categoryFilter !== "ALL") && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSearch("");
                setTypeFilter("ALL");
                setCategoryFilter("ALL");
              }}
              className="h-9 px-2 text-xs text-muted-foreground hover:text-foreground"
            >
              Limpar filtros
            </Button>
          )}
        </div>

        {/* Create Media Dialog */}
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-1.5 shrink-0">
              <Plus className="h-4 w-4" />
              Adicionar Mídia
            </Button>
          </DialogTrigger>

          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Images className="h-5 w-5 text-primary" />
                Adicionar à Galeria
              </DialogTitle>
              <DialogDescription>
                Armazene vídeos do YouTube, Vimeo, imagens externas ou faça upload direto no SaaS.
              </DialogDescription>
            </DialogHeader>

            {/* Mode Selector Tabs */}
            <div className="flex rounded-lg bg-secondary p-1 text-xs font-medium my-2">
              <button
                type="button"
                onClick={() => setAddMode("LINK")}
                className={`flex-1 py-1.5 rounded-md transition-all flex items-center justify-center gap-1.5 ${
                  addMode === "LINK"
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <LinkIcon className="h-3.5 w-3.5" />
                Link Externo (YouTube / Imagem)
              </button>
              <button
                type="button"
                onClick={() => setAddMode("UPLOAD")}
                className={`flex-1 py-1.5 rounded-md transition-all flex items-center justify-center gap-1.5 ${
                  addMode === "UPLOAD"
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <UploadCloud className="h-3.5 w-3.5" />
                Upload no SaaS (Cloudflare R2)
              </button>
            </div>

            {/* MODE 1: EXTERNAL LINK */}
            {addMode === "LINK" && (
              <form
                action={async (fd) => {
                  await createAction(fd);
                  setLinkUrl("");
                  setCreateDialogOpen(false);
                }}
                className="space-y-3.5"
              >
                {createState.error && (
                  <div className="rounded-md border border-destructive/30 bg-destructive/10 p-2.5 text-xs text-destructive">
                    {createState.error}
                  </div>
                )}

                <div className="space-y-1">
                  <Label htmlFor="media-url" className="text-xs">
                    URL da Mídia (YouTube, Vimeo, Unsplash, CDN) *
                  </Label>
                  <Input
                    id="media-url"
                    name="url"
                    required
                    value={linkUrl}
                    onChange={(e) => setLinkUrl(e.target.value)}
                    placeholder="https://www.youtube.com/watch?v=... ou https://..."
                    className="text-xs"
                  />
                  <p className="text-[10px] text-muted-foreground">
                    Vídeos do YouTube e Vimeo geram thumbnail automática sem custos de servidor.
                  </p>
                </div>

                {/* Real-time Link Preview */}
                {parsedLiveLink && (
                  <div className="rounded-lg border border-border p-2 bg-secondary/30">
                    <p className="text-[10px] uppercase font-semibold text-muted-foreground mb-1">
                      Preview Detectado ({parsedLiveLink.provider}):
                    </p>
                    <div className="h-44 sm:h-52 w-full rounded overflow-hidden">
                      <MediaPreview
                        url={linkUrl}
                        alt="Preview"
                        aspectRatio="4/3"
                        fit="contain"
                        className="w-full h-full"
                      />
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label htmlFor="media-title" className="text-xs">
                      Título identificador *
                    </Label>
                    <Input
                      id="media-title"
                      name="title"
                      required
                      placeholder="Ex: Supino Reto com Barra"
                      className="text-xs"
                    />
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="media-type" className="text-xs">
                      Tipo de mídia
                    </Label>
                    <Select
                      id="media-type"
                      name="mediaType"
                      defaultValue={parsedLiveLink?.mediaType || "IMAGE"}
                      className="text-xs"
                    >
                      <option value="IMAGE">Imagem</option>
                      <option value="VIDEO">Vídeo</option>
                      <option value="GIF">GIF</option>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label htmlFor="media-cat" className="text-xs">
                      Categoria / Grupo Muscular
                    </Label>
                    <Input
                      id="media-cat"
                      name="category"
                      placeholder="Ex: Peito, Costas, Pernas"
                      className="text-xs"
                    />
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="media-tags" className="text-xs">
                      Tags (separadas por vírgula)
                    </Label>
                    <Input
                      id="media-tags"
                      name="tags"
                      placeholder="barra, livre, peitoral"
                      className="text-xs"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setCreateDialogOpen(false)}
                  >
                    Cancelar
                  </Button>
                  <Button type="submit" size="sm" disabled={isCreatePending}>
                    {isCreatePending ? "Cadastrando..." : "Salvar na Galeria"}
                  </Button>
                </div>
              </form>
            )}

            {/* MODE 2: DIRECT UPLOAD TO R2 */}
            {addMode === "UPLOAD" && (
              <form onSubmit={handleDirectUploadSubmit} className="space-y-3.5">
                {uploadError && (
                  <div className="rounded-md border border-destructive/30 bg-destructive/10 p-2.5 text-xs text-destructive">
                    {uploadError}
                  </div>
                )}

                {uploadProgress && (
                  <div className="rounded-md border border-primary/30 bg-primary/10 p-2.5 text-xs text-primary animate-pulse">
                    {uploadProgress}
                  </div>
                )}

                <div className="space-y-1">
                  <Label htmlFor="upload-file" className="text-xs">
                    Arquivo de Vídeo ou Imagem (MP4, MOV, WebM, JPEG, PNG, WebP) *
                  </Label>
                  <Input
                    id="upload-file"
                    type="file"
                    accept="video/mp4,video/quicktime,video/webm,video/x-m4v,video/*,image/jpeg,image/png,image/webp,image/gif,image/*"
                    required
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) setUploadFile(f);
                    }}
                    className="text-xs"
                  />
                  <p className="text-[10px] text-muted-foreground">
                    Upload direto para o bucket Cloudflare R2 com taxa de transferência zero.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label htmlFor="upload-title" className="text-xs">
                      Título identificador *
                    </Label>
                    <Input
                      id="upload-title"
                      name="title"
                      required
                      placeholder="Ex: Agachamento Livre 4K"
                      className="text-xs"
                    />
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="upload-cat" className="text-xs">
                      Categoria / Grupo Muscular
                    </Label>
                    <Input
                      id="upload-cat"
                      name="category"
                      placeholder="Ex: Pernas, Glúteos"
                      className="text-xs"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <Label htmlFor="upload-tags" className="text-xs">
                    Tags (separadas por vírgula)
                  </Label>
                  <Input
                    id="upload-tags"
                    name="tags"
                    placeholder="agachamento, barra, quadriceps"
                    className="text-xs"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setCreateDialogOpen(false)}
                    disabled={!!uploadProgress}
                  >
                    Cancelar
                  </Button>
                  <Button type="submit" size="sm" disabled={!!uploadProgress || !uploadFile}>
                    {uploadProgress ? "Processando..." : "Fazer Upload e Salvar"}
                  </Button>
                </div>
              </form>
            )}
          </DialogContent>
        </Dialog>
      </div>

      {/* Media Cards Grid */}
      {filteredItems.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border p-12 text-center bg-card/40">
          <Images className="h-12 w-12 text-muted-foreground/30 mb-3" />
          <h3 className="text-base font-medium text-foreground">
            {initialItems.length === 0
              ? "Sua galeria de mídias está vazia"
              : "Nenhuma mídia corresponde aos filtros"}
          </h3>
          <p className="mt-1 text-xs text-muted-foreground max-w-sm">
            {initialItems.length === 0
              ? "Armazene fotos e vídeos de demonstração de exercícios por link ou upload para reutilizar em qualquer treino."
              : "Tente alterar os termos de busca ou filtros selecionados acima."}
          </p>
          {initialItems.length === 0 && (
            <Button
              size="sm"
              onClick={() => setCreateDialogOpen(true)}
              className="mt-4 gap-1.5"
            >
              <Plus className="h-4 w-4" />
              Adicionar primeira mídia
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {filteredItems.map((item) => {
            const previewSrc =
              item.thumbnailUrl || (item.mediaType === "IMAGE" ? item.url : null);
            return (
              <div
                key={item.id}
                className="group relative flex flex-col rounded-xl border border-border bg-card overflow-hidden hover:border-primary/60 hover:shadow-md transition-all"
              >
                {/* Media Image / Video Banner */}
                <div
                  onClick={() => setPreviewItem(item)}
                  className="relative aspect-video w-full bg-secondary/60 cursor-pointer overflow-hidden"
                  role="button"
                  tabIndex={0}
                  aria-label={`Visualizar ${item.title}`}
                >
                  <SafeImage
                    src={previewSrc}
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    fallbackText={item.title}
                  />

                  {item.mediaType === "VIDEO" && (
                    <div className="absolute inset-0 bg-black/35 flex items-center justify-center group-hover:bg-black/20 transition-colors">
                      <div className="h-10 w-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                        <Video className="h-5 w-5" />
                      </div>
                    </div>
                  )}

                  {/* Provider & Type Badge */}
                  <div className="absolute top-2 left-2 flex gap-1">
                    <span className="px-1.5 py-0.5 rounded bg-black/75 text-[10px] text-white font-medium">
                      {item.storageProvider}
                    </span>
                    <span className="px-1.5 py-0.5 rounded bg-primary/90 text-[10px] text-primary-foreground font-semibold">
                      {item.mediaType}
                    </span>
                  </div>
                </div>

                {/* Card Info */}
                <div className="flex flex-1 flex-col justify-between p-3.5 space-y-2">
                  <div>
                    <h4
                      onClick={() => setPreviewItem(item)}
                      className="font-medium text-xs text-foreground line-clamp-1 cursor-pointer hover:text-primary transition-colors"
                      title={item.title}
                    >
                      {item.title}
                    </h4>

                    {item.category && (
                      <p className="text-[11px] font-medium text-muted-foreground mt-0.5">
                        {item.category}
                      </p>
                    )}

                    {item.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {item.tags.slice(0, 3).map((tag) => (
                          <span
                            key={tag}
                            className="px-1.5 py-0.2 rounded bg-secondary text-[10px] text-muted-foreground"
                          >
                            #{tag}
                          </span>
                        ))}
                        {item.tags.length > 3 && (
                          <span className="text-[10px] text-muted-foreground">
                            +{item.tags.length - 3}
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Actions Row */}
                  <div className="flex items-center justify-between pt-2 border-t border-border/60">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleCopyLink(item)}
                      className="h-7 px-2 text-[11px] gap-1 text-muted-foreground hover:text-foreground"
                    >
                      {copiedId === item.id ? (
                        <>
                          <Check className="h-3 w-3 text-emerald-400" />
                          Copiado
                        </>
                      ) : (
                        <>
                          <Copy className="h-3 w-3" />
                          Copiar link
                        </>
                      )}
                    </Button>

                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setPreviewItem(item)}
                        className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
                        aria-label="Abrir pré-visualização"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                      </Button>

                      <DeleteConfirmDialog
                        title="Excluir da Galeria"
                        description={`Tem certeza que deseja excluir "${item.title}" da sua galeria? Esta ação não pode ser desfeita.`}
                        onConfirm={() => handleDelete(item.id)}
                        triggerSize="sm"
                        triggerVariant="ghost"
                        iconOnly
                      />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Full Expanded Preview Dialog */}
      {previewItem && (
        <Dialog open={!!previewItem} onOpenChange={() => setPreviewItem(null)}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                {previewItem.mediaType === "VIDEO" ? (
                  <Video className="h-5 w-5 text-primary" />
                ) : (
                  <ImageIcon className="h-5 w-5 text-primary" />
                )}
                {previewItem.title}
              </DialogTitle>
              <DialogDescription>
                {previewItem.category ? `Categoria: ${previewItem.category} · ` : ""}
                Provedor: {previewItem.storageProvider}
              </DialogDescription>
            </DialogHeader>

            <div className="mt-2 rounded-xl overflow-hidden bg-black/90 max-h-[70vh] flex items-center justify-center">
              <MediaPreview
                url={previewItem.url}
                alt={previewItem.title}
                aspectRatio="4/3"
                fit="contain"
                className="w-full h-full min-h-[300px] sm:min-h-[400px]"
              />
            </div>

            <div className="flex items-center justify-between pt-2">
              <div className="flex flex-wrap gap-1">
                {previewItem.tags.map((t) => (
                  <Badge key={t} variant="outline" className="text-xs">
                    #{t}
                  </Badge>
                ))}
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => handleCopyLink(previewItem)}
                className="gap-1.5 text-xs"
              >
                {copiedId === previewItem.id ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-emerald-400" />
                    Link copiado!
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" />
                    Copiar URL
                  </>
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
