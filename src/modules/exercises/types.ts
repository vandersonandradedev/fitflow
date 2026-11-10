import { z } from "zod";

export const equipmentTypeSchema = z.enum([
  "BARBELL",
  "DUMBBELL",
  "MACHINE",
  "CABLE",
  "BODYWEIGHT",
  "KETTLEBELL",
  "BAND",
  "OTHER",
]);

export const difficultySchema = z.enum(["BEGINNER", "INTERMEDIATE", "ADVANCED"]);

export const mediaTypeSchema = z.enum(["VIDEO", "IMAGE", "GIF"]);

export const exerciseScopeSchema = z.enum(["ALL", "GLOBAL", "CUSTOM"]);

/**
 * Aceita apenas caminhos locais seguros sob /images/ ou URLs HTTPS válidas.
 * Rejeita esquemas perigosos (javascript:, data:, file:, http:).
 */
export const safeMediaUrlSchema = z
  .string()
  .trim()
  .min(1, "Informe uma URL de mídia")
  .max(500, "URL muito longa")
  .refine((val) => {
    if (val.startsWith("/images/")) {
      return !val.includes("..") && /^\/images\/[a-zA-Z0-9/_.-]+$/.test(val);
    }
    try {
      const parsed = new URL(val);
      return parsed.protocol === "https:";
    } catch {
      return false;
    }
  }, "A URL da mídia deve usar https:// ou ser um ativo oficial (/images/...)");

export const exerciseInstructionInputSchema = z.object({
  instruction: z.string().trim().min(3, "A instrução deve ter ao menos 3 caracteres").max(1000),
  safetyTip: z
    .string()
    .trim()
    .max(500)
    .optional()
    .transform((v) => (v ? v : undefined)),
});

export const exerciseMediaInputSchema = z.object({
  mediaType: mediaTypeSchema.default("IMAGE"),
  url: safeMediaUrlSchema,
  thumbnailUrl: safeMediaUrlSchema.optional(),
});

/**
 * Schema para criação/edição de exercício personalizado pelo treinador.
 * `tenantId` e `isGlobal` NUNCA entram pelo cliente: são fixados no servidor.
 */
export const customExerciseSchema = z.object({
  categoryId: z.string().uuid("Categoria inválida"),
  name: z.string().trim().min(2, "O nome deve ter no mínimo 2 caracteres").max(120),
  description: z
    .string()
    .trim()
    .max(1500)
    .optional()
    .transform((v) => (v ? v : undefined)),
  primaryMuscleGroup: z.string().trim().min(2, "Informe o grupo muscular principal").max(100),
  secondaryMuscleGroups: z
    .array(z.string().trim().min(1).max(100))
    .max(8)
    .default([]),
  equipment: equipmentTypeSchema.default("BODYWEIGHT"),
  difficulty: difficultySchema.default("BEGINNER"),
  instructions: z.array(exerciseInstructionInputSchema).max(15).default([]),
  media: z.array(exerciseMediaInputSchema).max(6).default([]),
});

export const exerciseFilterSchema = z.object({
  search: z.string().trim().max(100).optional(),
  categoryId: z.string().uuid().optional(),
  categorySlug: z.string().trim().max(100).optional(),
  muscleGroup: z.string().trim().max(100).optional(),
  equipment: equipmentTypeSchema.optional(),
  scope: exerciseScopeSchema.default("ALL"),
  take: z.number().int().min(1).max(200).default(100),
});

export type EquipmentTypeInput = z.infer<typeof equipmentTypeSchema>;
export type CustomExerciseInput = z.input<typeof customExerciseSchema>;
export type ExerciseFilterInput = z.input<typeof exerciseFilterSchema>;

export const EQUIPMENT_LABELS: Record<EquipmentTypeInput, string> = {
  BARBELL: "Barra",
  DUMBBELL: "Halteres",
  MACHINE: "Máquina",
  CABLE: "Cabo / Polia",
  BODYWEIGHT: "Peso Corporal",
  KETTLEBELL: "Kettlebell",
  BAND: "Elástico",
  OTHER: "Outro",
};

export const DIFFICULTY_LABELS: Record<z.infer<typeof difficultySchema>, string> = {
  BEGINNER: "Iniciante",
  INTERMEDIATE: "Intermediário",
  ADVANCED: "Avançado",
};
