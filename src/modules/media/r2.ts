import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { ValidationError } from "@/server/errors";

const ALLOWED_CONTENT_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/heic",
  "image/heif",
  "video/mp4",
  "video/webm",
  "video/quicktime",
  "video/x-m4v",
  "video/ogg",
  "video/3gpp",
] as const;

export type AllowedContentType = (typeof ALLOWED_CONTENT_TYPES)[number];

const EXTENSION_MAP: Record<AllowedContentType, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/heic": "heic",
  "image/heif": "heif",
  "video/mp4": "mp4",
  "video/webm": "webm",
  "video/quicktime": "mov",
  "video/x-m4v": "m4v",
  "video/ogg": "ogv",
  "video/3gpp": "3gp",
};

/**
 * Normaliza o Account ID caso o usuário tenha colado a URL completa do dashboard.
 */
function cleanAccountId(rawId?: string): string | null {
  if (!rawId) return null;
  const trimmed = rawId.trim();
  const match = trimmed.match(/dash\.cloudflare\.com\/([a-f0-9]+)/i);
  if (match) return match[1];
  return trimmed.replace(/^https?:\/\//i, "").replace(/\/.*$/, "");
}

/**
 * Cria o cliente S3 apontando para o Cloudflare R2.
 * O Cloudflare R2 tem taxa de EGRESS ZERO (transferência de dados de saída gratuita).
 */
function getR2Client(): S3Client | null {
  const accountId = cleanAccountId(process.env.CLOUDFLARE_R2_ACCOUNT_ID);
  const accessKeyId = process.env.CLOUDFLARE_R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY;

  if (!accountId || !accessKeyId || !secretAccessKey) {
    return null;
  }

  return new S3Client({
    region: "auto",
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
  });
}

export interface PresignedUploadOptions {
  tenantId: string;
  resourceFolder: "exercises" | "assessments" | "avatars";
  contentType: string;
  maxSizeBytes?: number;
}

export interface PresignedUploadResult {
  uploadUrl: string;
  publicUrl: string;
  key: string;
  expiresInSeconds: number;
}

/**
 * Gera uma URL pré-assinada para upload DIRETO do navegador para o Cloudflare R2.
 * - Zero bytes transitam pela Vercel (economiza memória, payload limit de 4.5MB e tempo de função serverless).
 * - O arquivo recebe um UUID único e fica isolado dentro do prefixo do tenant (`tenants/<tenantId>/...`).
 */
export async function generatePresignedUploadUrl({
  tenantId,
  resourceFolder,
  contentType,
}: PresignedUploadOptions): Promise<PresignedUploadResult> {
  if (!ALLOWED_CONTENT_TYPES.includes(contentType as AllowedContentType)) {
    throw new ValidationError(
      `Tipo de arquivo não permitido: ${contentType}. Use vídeos MP4, WebM, MOV ou imagens JPEG, PNG, WebP.`
    );
  }

  const s3 = getR2Client();
  const bucket = process.env.CLOUDFLARE_R2_BUCKET_NAME || "fitflow-media";
  const rawBaseUrl =
    process.env.CLOUDFLARE_R2_PUBLIC_URL || "https://media.fitflow.app";
  const publicBaseUrl = rawBaseUrl.replace(/\/+$/, "");

  const ext = EXTENSION_MAP[contentType as AllowedContentType] || "bin";
  const fileId = crypto.randomUUID();
  const key = `tenants/${tenantId}/${resourceFolder}/${fileId}.${ext}`;

  if (!s3) {
    // Modo simulação para desenvolvimento local caso as credenciais R2 não estejam preenchidas
    return {
      uploadUrl: `https://mock-upload.fitflow.local/${key}`,
      publicUrl: `${publicBaseUrl}/${key}`,
      key,
      expiresInSeconds: 900,
    };
  }

  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    ContentType: contentType,
  });

  const expiresInSeconds = 900; // 15 minutos
  const uploadUrl = await getSignedUrl(s3, command, {
    expiresIn: expiresInSeconds,
  });
  const publicUrl = `${publicBaseUrl}/${key}`;

  return {
    uploadUrl,
    publicUrl,
    key,
    expiresInSeconds,
  };
}
