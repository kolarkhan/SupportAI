import { requireUser } from "@/lib/auth/current-user";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ProfileSettings, WorkspaceSettings, AIProviderStatus, DangerZone } from "@/components/dashboard/settings/settings-panels";

export default async function SettingsPage() {
  const { user, workspace, role } = await requireUser();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">Manage your profile, workspace, and AI provider configuration.</p>
      </div>

      <Tabs defaultValue="profile">
        <TabsList>
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="workspace">Workspace</TabsTrigger>
          <TabsTrigger value="ai">AI Providers</TabsTrigger>
          {role === "OWNER" && <TabsTrigger value="danger">Danger Zone</TabsTrigger>}
        </TabsList>
        <TabsContent value="profile" className="max-w-xl">
          <ProfileSettings initialName={user.name} email={user.email} />
        </TabsContent>
        <TabsContent value="workspace" className="max-w-xl">
          <WorkspaceSettings initialName={workspace.name} plan={workspace.plan} />
        </TabsContent>
        <TabsContent value="ai" className="max-w-xl">
          <AIProviderStatus openaiConfigured={!!process.env.OPENAI_API_KEY} anthropicConfigured={!!process.env.ANTHROPIC_API_KEY} />
        </TabsContent>
        {role === "OWNER" && (
          <TabsContent value="danger" className="max-w-xl">
            <DangerZone />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
