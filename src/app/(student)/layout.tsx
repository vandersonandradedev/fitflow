import { logoutAction } from "@/app/(auth)/actions";
import { prisma } from "@/lib/db";
import { requireStudentContext } from "@/server/auth/session";
import { StudentShell } from "./student-shell";

export default async function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const ctx = await requireStudentContext();

  const [tenant, studentUser] = await Promise.all([
    prisma.tenant.findUniqueOrThrow({ where: { id: ctx.tenantId }, select: { name: true } }),
    prisma.user.findUniqueOrThrow({ where: { id: ctx.userId }, select: { name: true, email: true } }),
  ]);

  const initial = (studentUser.name ?? studentUser.email).substring(0, 1).toUpperCase();

  return (
    <StudentShell
      tenantName={tenant.name}
      initial={initial}
      logoutAction={logoutAction}
    >
      {children}
    </StudentShell>
  );
}
