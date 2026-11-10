import { z } from "zod";

export interface TenantContext {
  userId: string;
  tenantId: string;
  role: "OWNER" | "COACH" | "STUDENT";
}

export const tenantContextSchema = z.object({
  userId: z.string().uuid(),
  tenantId: z.string().uuid(),
  role: z.enum(["OWNER", "COACH", "STUDENT"]),
});
