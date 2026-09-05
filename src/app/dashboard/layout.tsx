import { requireUser } from "@/lib/auth/current-user";
import { DashboardShell } from "@/components/dashboard/shell";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, workspace } = await requireUser();

  return (
    <DashboardShell
      user={{ name: user.name, email: user.email, avatarColor: user.avatarColor }}
      workspace={{ name: workspace.name, plan: workspace.plan }}
    >
      {children}
    </DashboardShell>
  );
}
