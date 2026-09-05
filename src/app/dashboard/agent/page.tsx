import { AgentBuilder } from "@/components/dashboard/agent/agent-builder";

export default function AgentPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">AI Agent</h1>
        <p className="mt-1 text-sm text-muted-foreground">Configure your agent's personality, behavior, and escalation rules.</p>
      </div>
      <AgentBuilder />
    </div>
  );
}
