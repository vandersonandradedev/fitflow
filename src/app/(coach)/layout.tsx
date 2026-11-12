import { logoutAction } from "@/app/(auth)/actions";
import { requireCoachContext } from "@/server/auth/session";
import { CoachShell } from "./coach-shell";

export default async function CoachLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const ctx = await requireCoachContext();
  const coachLabel = ctx.userName ?? ctx.userEmail ?? "Treinador";
  const initials = coachLabel.substring(0, 2).toUpperCase();

  return (
    <CoachShell
      tenantName={ctx.tenantName}
      coachLabel={coachLabel}
      initials={initials}
      logoutAction={logoutAction}
    >
      {children}
    </CoachShell>
  );
}
