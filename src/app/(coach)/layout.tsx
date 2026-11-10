import { logoutAction } from "@/app/(auth)/actions";
import { prisma } from "@/lib/db";
import { requireCoachContext } from "@/server/auth/session";
import { CoachShell } from "./coach-shell";

export default async function CoachLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const ctx = await requireCoachContext();

  const [tenant, coach] = await Promise.all([
    prisma.tenant.findUniqueOrThrow({ where: { id: ctx.tenantId }, select: { name: true } }),
    prisma.user.findUniqueOrThrow({ where: { id: ctx.userId }, select: { name: true, email: true } }),
  ]);

  const initials = (coach.name ?? coach.email).substring(0, 2).toUpperCase();

  return (
    <CoachShell
      tenantName={tenant.name}
      coachLabel={coach.name ?? coach.email}
      initials={initials}
      logoutAction={logoutAction}
    >
      {children}
    </CoachShell>
  );
}
