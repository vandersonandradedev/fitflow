import { z } from "zod";

export const dayOfWeekSchema = z.enum([
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
  "SUNDAY",
  "ANY",
]);

export const sectionTypeSchema = z.enum(["WARMUP", "MAIN", "COOLDOWN"]);

export const prescribedSetSchema = z.object({
  setNumber: z.number().int().positive(),
  repsTarget: z.string().trim().min(1, "Informe a meta de repetições").max(50),
  suggestedLoadKg: z.number().nonnegative().max(1000).optional(),
  restSeconds: z.number().int().min(0).max(1800).default(60),
  tempo: z
    .string()
    .trim()
    .max(20)
    .optional()
    .transform((v) => (v ? v : undefined)),
  targetRpe: z.number().min(1).max(10).optional(),
});

export const workoutExerciseSchema = z.object({
  exerciseId: z.string().uuid("Exercício inválido"),
  supersetGroupId: z
    .string()
    .trim()
    .max(50)
    .optional()
    .transform((v) => (v ? v : undefined)),
  sectionType: sectionTypeSchema.default("MAIN"),
  orderIndex: z.number().int().nonnegative().default(0),
  coachNotes: z
    .string()
    .trim()
    .max(1000)
    .optional()
    .transform((v) => (v ? v : undefined)),
  sets: z.array(prescribedSetSchema).min(1, "Adicione ao menos uma série").max(20),
});

export const trainingDaySchema = z.object({
  name: z.string().trim().min(1, "Informe o nome do treino").max(100),
  dayOfWeek: dayOfWeekSchema.default("ANY"),
  description: z
    .string()
    .trim()
    .max(500)
    .optional()
    .transform((v) => (v ? v : undefined)),
  orderIndex: z.number().int().nonnegative().default(0),
  exercises: z.array(workoutExerciseSchema).max(30).default([]),
});

export const createProgramSchema = z.object({
  studentProfileId: z.string().uuid("Selecione um aluno válido"),
  title: z.string().trim().min(2, "O título deve ter ao menos 2 caracteres").max(255),
  description: z
    .string()
    .trim()
    .max(1500)
    .optional()
    .transform((v) => (v ? v : undefined)),
  goal: z
    .string()
    .trim()
    .max(100)
    .optional()
    .transform((v) => (v ? v : undefined)),
  notes: z
    .string()
    .trim()
    .max(1000)
    .optional()
    .transform((v) => (v ? v : undefined)),
  initialDays: z.array(trainingDaySchema).max(14).default([]),
});

export const addTrainingDaySchema = z.object({
  name: z.string().trim().min(1, "Informe o nome do dia de treino").max(100),
  dayOfWeek: dayOfWeekSchema.default("ANY"),
  description: z
    .string()
    .trim()
    .max(500)
    .optional()
    .transform((v) => (v ? v : undefined)),
});

export const updateTrainingDaySchema = z.object({
  name: z.string().trim().min(1, "Informe o nome do dia de treino").max(100),
  dayOfWeek: dayOfWeekSchema.default("ANY"),
  description: z
    .string()
    .trim()
    .max(500)
    .optional()
    .transform((v) => (v ? v : undefined)),
});

export const reorderTrainingDaysSchema = z.object({
  orderedDayIds: z.array(z.string().uuid()).min(1),
});

export const addWorkoutExerciseSchema = z.object({
  exerciseId: z.string().uuid("Selecione um exercício válido"),
  sectionType: sectionTypeSchema.default("MAIN"),
  supersetGroupId: z
    .string()
    .trim()
    .max(50)
    .optional()
    .transform((v) => (v ? v : undefined)),
  coachNotes: z
    .string()
    .trim()
    .max(1000)
    .optional()
    .transform((v) => (v ? v : undefined)),
  sets: z.array(prescribedSetSchema).min(1, "Adicione ao menos uma série").max(20),
});

export const updateWorkoutExerciseSchema = z.object({
  sectionType: sectionTypeSchema.default("MAIN"),
  supersetGroupId: z
    .string()
    .trim()
    .max(50)
    .optional()
    .transform((v) => (v ? v : undefined)),
  coachNotes: z
    .string()
    .trim()
    .max(1000)
    .optional()
    .transform((v) => (v ? v : undefined)),
  sets: z.array(prescribedSetSchema).min(1, "Adicione ao menos uma série").max(20),
});

export const reorderWorkoutExercisesSchema = z.object({
  orderedWorkoutExerciseIds: z.array(z.string().uuid()).min(1),
});

export const saveTemplateSchema = z.object({
  title: z.string().trim().min(2, "Informe um título para o template").max(255),
  category: z
    .string()
    .trim()
    .max(100)
    .optional()
    .transform((v) => (v ? v : undefined)),
});

export type DayOfWeekInput = z.infer<typeof dayOfWeekSchema>;
export type SectionTypeInput = z.infer<typeof sectionTypeSchema>;
export type PrescribedSetInput = z.infer<typeof prescribedSetSchema>;
export type WorkoutExerciseInput = z.infer<typeof workoutExerciseSchema>;
export type TrainingDayInput = z.infer<typeof trainingDaySchema>;
export type CreateProgramInput = z.input<typeof createProgramSchema>;

export const DAY_OF_WEEK_LABELS: Record<DayOfWeekInput, string> = {
  MONDAY: "Segunda-feira",
  TUESDAY: "Terça-feira",
  WEDNESDAY: "Quarta-feira",
  THURSDAY: "Quinta-feira",
  FRIDAY: "Sexta-feira",
  SATURDAY: "Sábado",
  SUNDAY: "Domingo",
  ANY: "Livre / Rotativo",
};

export const DAY_OF_WEEK_SHORT: Record<DayOfWeekInput, string> = {
  MONDAY: "SEG",
  TUESDAY: "TER",
  WEDNESDAY: "QUA",
  THURSDAY: "QUI",
  FRIDAY: "SEX",
  SATURDAY: "SÁB",
  SUNDAY: "DOM",
  ANY: "LIVRE",
};

export const SECTION_TYPE_LABELS: Record<SectionTypeInput, string> = {
  WARMUP: "Aquecimento & Mobilidade",
  MAIN: "Bloco Principal",
  COOLDOWN: "Volta à Calma",
};
