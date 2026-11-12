import { logoutAction } from "@/app/(auth)/actions";
import { requireStudentContext } from "@/server/auth/session";
import { StudentShell } from "./student-shell";

export default async function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const ctx = await requireStudentContext();
  const initial = (ctx.userName ?? ctx.userEmail ?? "A").substring(0, 1).toUpperCase();

  return (
    <StudentShell
      tenantName={ctx.tenantName}
      initial={initial}
      logoutAction={logoutAction}
    >
      {children}
    </StudentShell>
  );
}
