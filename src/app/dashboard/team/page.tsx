import { TeamPanel } from "@/components/dashboard/team/team-panel";

export default function TeamPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Team</h1>
        <p className="mt-1 text-sm text-muted-foreground">Manage who has access to your workspace and what they can do.</p>
      </div>
      <TeamPanel />
    </div>
  );
}
