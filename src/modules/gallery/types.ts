import { z } from "zod";
import { safeMediaUrlSchema } from "@/modules/exercises/types";

export const mediaTypeEnum = z.enum(["IMAGE", "VIDEO", "GIF"]);

export const createTenantMediaSchema = z.object({
  title: z
    .string()
    .trim()
    .min(2, "O título deve ter no mínimo 2 caracteres")
    .max(120, "Título muito longo"),
  description: z
    .string()
    .trim()
    .max(1000)
    .optional()
    .transform((v) => (v ? v : undefined)),
  mediaType: mediaTypeEnum.default("IMAGE"),
  url: safeMediaUrlSchema,
  thumbnailUrl: safeMediaUrlSchema.optional(),
  category: z
    .string()
    .trim()
    .max(80)
    .optional()
    .transform((v) => (v ? v : undefined)),
  tags: z
    .array(z.string().trim().min(1).max(40))
    .max(10)
    .default([]),
});

export const updateTenantMediaSchema = z.object({
  title: z
    .string()
    .trim()
    .min(2, "O título deve ter no mínimo 2 caracteres")
    .max(120, "Título muito longo")
    .optional(),
  description: z.string().trim().max(1000).nullish(),
  mediaType: mediaTypeEnum.optional(),
  url: safeMediaUrlSchema.optional(),
  thumbnailUrl: safeMediaUrlSchema.nullish(),
  category: z.string().trim().max(80).nullish(),
  tags: z.array(z.string().trim().min(1).max(40)).max(10).optional(),
});

export const listTenantMediaFilterSchema = z.object({
  search: z.string().trim().max(100).optional(),
  mediaType: mediaTypeEnum.optional(),
  category: z.string().trim().max(80).optional(),
  take: z.number().int().min(1).max(200).default(60),
});

export type CreateTenantMediaInput = z.infer<typeof createTenantMediaSchema>;
export type UpdateTenantMediaInput = z.infer<typeof updateTenantMediaSchema>;
export type ListTenantMediaFilterInput = z.input<typeof listTenantMediaFilterSchema>;
