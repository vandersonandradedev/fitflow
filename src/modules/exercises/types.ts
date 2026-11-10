import { z } from "zod";

export const exerciseFilterSchema = z.object({
  search: z.string().optional(),
  muscleGroup: z.string().optional(),
  equipment: z.string().optional(),
  categoryId: z.string().optional(),
});

export type ExerciseFilterInput = z.infer<typeof exerciseFilterSchema>;
