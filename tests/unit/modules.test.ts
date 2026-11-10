import { describe, it, expect } from "vitest";
import { loginSchema, registerCoachSchema } from "@/modules/auth";
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
      });
      expect(result.success).toBe(true);
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
  });
});
