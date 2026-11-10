import { describe, it, expect } from "vitest";
import { formatTime, formatWeight, cn } from "@/lib/utils";

describe("FitFlow Utility Functions", () => {
  describe("formatTime", () => {
    it("formats 0 seconds properly", () => {
      expect(formatTime(0)).toBe("00:00");
    });

    it("formats 60 seconds as 01:00", () => {
      expect(formatTime(60)).toBe("01:00");
    });

    it("formats 95 seconds as 01:35", () => {
      expect(formatTime(95)).toBe("01:35");
    });

    it("formats 600 seconds as 10:00", () => {
      expect(formatTime(600)).toBe("10:00");
    });
  });

  describe("formatWeight", () => {
    it("formats valid kilograms", () => {
      const formatted = formatWeight(82.5);
      expect(formatted).toContain("82");
      expect(formatted).toContain("kg");
    });

    it("returns placeholder for null or undefined", () => {
      expect(formatWeight(null)).toBe("--");
      expect(formatWeight(undefined)).toBe("--");
    });
  });

  describe("cn (tailwind merge)", () => {
    it("merges classes cleanly", () => {
      const result = cn("p-4", "text-white", { "bg-red-500": true, "bg-blue-500": false });
      expect(result).toBe("p-4 text-white bg-red-500");
    });

    it("resolves conflicting tailwind padding classes", () => {
      const result = cn("p-2", "p-4");
      expect(result).toBe("p-4");
    });
  });
});
