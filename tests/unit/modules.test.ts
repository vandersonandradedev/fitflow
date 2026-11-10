import { describe, it, expect } from "vitest";
import { loginSchema, registerCoachSchema } from "@/modules/auth";
import { customExerciseSchema, safeMediaUrlSchema } from "@/modules/exercises";
import { createStudentInviteSchema } from "@/modules/students";
import { prescribedSetSchema } from "@/modules/workouts";
import { logSetSchema } from "@/modules/sessions";

describe("Domain Schemas & Validation Rules", () => {
  describe("Auth Schemas", () => {
    it("validates valid login input", () => {
      const result = loginSchema.safeParse({
        email: "lucas@fitflow.app",
        password: "password123",
      });
      expect(result.success).toBe(true);
    });

    it("rejects invalid email in login", () => {
      const result = loginSchema.safeParse({
        email: "invalid-email",
        password: "password123",
      });
      expect(result.success).toBe(false);
    });

    it("validates coach registration", () => {
      const result = registerCoachSchema.safeParse({
        name: "Lucas Personal",
        tenantName: "Lucas Training Studio",
        email: "lucas@fitflow.app",
        password: "securePassword123",
        acceptTerms: "on",
      });
      expect(result.success).toBe(true);
    });

    it("rejects coach registration without terms acceptance", () => {
      const result = registerCoachSchema.safeParse({
        name: "Lucas Personal",
        tenantName: "Lucas Training Studio",
        email: "lucas@fitflow.app",
        password: "securePassword123",
      });
      expect(result.success).toBe(false);
    });
  });

  describe("Student & Workout Schemas", () => {
    it("validates student invite schema with defaults", () => {
      const result = createStudentInviteSchema.safeParse({
        name: "Mariana Costa",
        email: "mariana@gmail.com",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.fitnessGoal).toBe("HYPERTROPHY");
        expect(result.data.experienceLevel).toBe("BEGINNER");
      }
    });

    it("validates prescribed set schema", () => {
      const result = prescribedSetSchema.safeParse({
        setNumber: 1,
        repsTarget: "10-12",
        suggestedLoadKg: 60,
        restSeconds: 90,
      });
      expect(result.success).toBe(true);
    });

    it("validates set execution log schema", () => {
      const result = logSetSchema.safeParse({
        setNumber: 1,
        actualLoadKg: 62.5,
        actualReps: 10,
        completed: true,
      });
      expect(result.success).toBe(true);
    });

    it("validates custom exercise schema and strips unknown fields like tenantId/isGlobal", () => {
      const result = customExerciseSchema.safeParse({
        categoryId: "11111111-1111-4111-8111-111111111111",
        name: "Agachamento Búlgaro com Halteres",
        primaryMuscleGroup: "Quadríceps e Glúteos",
        secondaryMuscleGroups: ["Core"],
        equipment: "DUMBBELL",
        difficulty: "INTERMEDIATE",
        tenantId: "fake-tenant",
        isGlobal: true,
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect("tenantId" in result.data).toBe(false);
        expect("isGlobal" in result.data).toBe(false);
      }
    });

    it("validates safe media URLs and rejects unsafe schemes", () => {
      expect(safeMediaUrlSchema.safeParse("https://www.youtube.com/watch?v=abc").success).toBe(true);
      expect(safeMediaUrlSchema.safeParse("/images/exercises/push.svg").success).toBe(true);
      expect(safeMediaUrlSchema.safeParse("javascript:alert(1)").success).toBe(false);
      expect(safeMediaUrlSchema.safeParse("http://insecure.com/img.png").success).toBe(false);
      expect(safeMediaUrlSchema.safeParse("/images/../etc/passwd").success).toBe(false);
    });
  });
});
