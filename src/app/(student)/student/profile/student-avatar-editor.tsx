"use client";

import { useState, useRef, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Camera, Loader2, Trash2, UploadCloud } from "lucide-react";
import { Button } from "@/components/ui/button";
import { requestPresignedUploadAction } from "@/modules/media/actions";
import { updateStudentAvatarAction } from "./actions";

interface StudentAvatarEditorProps {
  initialImage: string | null;
  name: string | null;
  email: string;
}

export function StudentAvatarEditor({
  initialImage,
  name,
  email,
}: StudentAvatarEditorProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [currentImage, setCurrentImage] = useState<string | null>(initialImage);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const displayName = name ?? email;
  const initials = displayName.substring(0, 2).toUpperCase();

  const handleSelectFile = () => {
    setErrorMessage(null);
    setStatusMessage(null);
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset input value to allow selecting same file again if needed
    e.target.value = "";

    // Validação de tipo de arquivo
    const filename = file.name.toLowerCase();
    let effectiveContentType = file.type;
    if (!effectiveContentType) {
      if (filename.endsWith(".jpg") || filename.endsWith(".jpeg")) effectiveContentType = "image/jpeg";
      else if (filename.endsWith(".png")) effectiveContentType = "image/png";
      else if (filename.endsWith(".webp")) effectiveContentType = "image/webp";
      else if (filename.endsWith(".heic")) effectiveContentType = "image/heic";
      else effectiveContentType = "image/jpeg";
    }

    if (!effectiveContentType.startsWith("image/")) {
      setErrorMessage("Por favor, selecione uma imagem válida (JPEG, PNG, WebP ou HEIC).");
      return;
    }

    // Validação de tamanho (máximo 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setErrorMessage("A imagem deve ter no máximo 10MB.");
      return;
    }

    // Preview imediato
    const localPreview = URL.createObjectURL(file);
    setPreviewUrl(localPreview);
    setIsUploading(true);
    setStatusMessage("Enviando foto para o Cloudflare R2...");
    setErrorMessage(null);

    try {
      const presignedRes = await requestPresignedUploadAction({
        resourceFolder: "avatars",
        contentType: effectiveContentType,
      });

      if (!presignedRes.ok || !presignedRes.data) {
        throw new Error(presignedRes.message || "Falha ao obter permissão de upload seguro.");
      }

      setStatusMessage("Transferindo imagem diretamente...");

      const uploadHttp = await fetch(presignedRes.data.uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": effectiveContentType },
        body: file,
      });

      if (!uploadHttp.ok) {
        throw new Error(`Erro na transferência (${uploadHttp.status}). Verifique a conexão.`);
      }

      setStatusMessage("Salvando no seu perfil...");

      const saveRes = await updateStudentAvatarAction(presignedRes.data.publicUrl);
      if (!saveRes.ok) {
        throw new Error(saveRes.message || "Erro ao atualizar a foto no seu cadastro.");
      }

      setCurrentImage(presignedRes.data.publicUrl);
      setPreviewUrl(null);
      setStatusMessage("Foto de perfil atualizada com sucesso!");
      setTimeout(() => setStatusMessage(null), 3500);

      startTransition(() => {
        router.refresh();
      });
    } catch (err) {
      setPreviewUrl(null);
      setErrorMessage(
        err instanceof Error ? err.message : "Erro inesperado ao salvar foto de perfil."
      );
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveAvatar = async () => {
    if (!currentImage) return;
    if (!confirm("Deseja realmente remover sua foto de perfil?")) return;

    setErrorMessage(null);
    setStatusMessage("Removendo foto...");
    setIsUploading(true);

    try {
      const saveRes = await updateStudentAvatarAction(null);
      if (!saveRes.ok) {
        throw new Error(saveRes.message || "Erro ao remover foto de perfil.");
      }

      setCurrentImage(null);
      setPreviewUrl(null);
      setStatusMessage("Foto de perfil removida.");
      setTimeout(() => setStatusMessage(null), 3000);

      startTransition(() => {
        router.refresh();
      });
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Erro ao remover foto.");
    } finally {
      setIsUploading(false);
    }
  };

  const activeImage = previewUrl || currentImage;

  return (
    <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 p-4 border-b border-border bg-card/50">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/heic,image/*"
        onChange={handleFileChange}
        className="hidden"
        aria-hidden="true"
      />

      {/* Avatar Container with Hover Overlay */}
      <div className="relative group shrink-0">
        {activeImage ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={activeImage}
            alt={displayName}
            className="h-20 w-20 sm:h-24 sm:w-24 rounded-full object-cover ring-2 ring-primary/40 shadow-lg"
          />
        ) : (
          <div className="flex h-20 w-20 sm:h-24 sm:w-24 items-center justify-center rounded-full bg-secondary text-xl sm:text-2xl font-bold text-primary ring-2 ring-border shadow-inner">
            {initials}
          </div>
        )}

        {/* Overlay trigger on click */}
        <button
          type="button"
          onClick={handleSelectFile}
          disabled={isUploading || isPending}
          className="absolute inset-0 flex flex-col items-center justify-center rounded-full bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-white cursor-pointer focus:opacity-100 focus:outline-none"
          title="Clique para alterar foto"
          aria-label="Alterar foto de perfil"
        >
          {isUploading ? (
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          ) : (
            <>
              <Camera className="h-6 w-6 mb-0.5 text-primary" />
              <span className="text-[10px] font-semibold">Alterar</span>
            </>
          )}
        </button>

        {/* Small Camera badge for mobile/touch users */}
        <button
          type="button"
          onClick={handleSelectFile}
          disabled={isUploading || isPending}
          className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-md ring-2 ring-background hover:scale-105 active:scale-95 transition-transform"
          aria-label="Escolher foto de perfil"
        >
          {isUploading ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Camera className="h-3.5 w-3.5" />
          )}
        </button>
      </div>

      {/* Info & Action Buttons */}
      <div className="flex-1 min-w-0 text-center sm:text-left space-y-1.5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-foreground truncate">
              {name ?? "Aluno"}
            </h2>
            <p className="text-xs text-muted-foreground truncate">{email}</p>
          </div>
        </div>

        <p className="text-[11px] text-muted-foreground">
          Sua foto de perfil fica visível para você e para o seu professor/treinador.
        </p>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleSelectFile}
            disabled={isUploading || isPending}
            className="h-8 text-xs gap-1.5"
          >
            {isUploading ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Enviando...
              </>
            ) : (
              <>
                <UploadCloud className="h-3.5 w-3.5 text-primary" />
                {currentImage ? "Trocar foto" : "Adicionar foto"}
              </>
            )}
          </Button>

          {currentImage && !isUploading && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleRemoveAvatar}
              disabled={isPending}
              className="h-8 text-xs text-destructive hover:bg-destructive/10 hover:text-destructive gap-1"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Remover
            </Button>
          )}
        </div>

        {/* Feedback Messages */}
        {statusMessage && (
          <p className="text-xs font-medium text-primary pt-1 animate-fadeIn">
            {statusMessage}
          </p>
        )}
        {errorMessage && (
          <p className="text-xs font-medium text-destructive pt-1">
            {errorMessage}
          </p>
        )}
      </div>
    </div>
  );
}
