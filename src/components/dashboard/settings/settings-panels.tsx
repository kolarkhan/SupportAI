"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Loader2, KeyRound, ShieldCheck } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useRouter } from "next/navigation";

export function ProfileSettings({ initialName, email }: { initialName: string; email: string }) {
  const [name, setName] = useState(initialName);
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  async function save() {
    setSaving(true);
    try {
      const res = await fetch("/api/account", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name }) });
      const json = await res.json();
      if (!json.ok) return toast.error(json.error);
      toast.success("Profile updated");
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Profile</CardTitle>
        <CardDescription>Your personal account details.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-1.5">
          <Label>Full name</Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label>Email</Label>
          <Input value={email} disabled />
        </div>
      </CardContent>
      <CardFooter>
        <Button onClick={save} disabled={saving || name === initialName}>
          {saving && <Loader2 className="h-4 w-4 animate-spin" />} Save changes
        </Button>
      </CardFooter>
    </Card>
  );
}

export function WorkspaceSettings({ initialName, plan }: { initialName: string; plan: string }) {
  const [name, setName] = useState(initialName);
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  async function save() {
    setSaving(true);
    try {
      const res = await fetch("/api/workspace", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name }) });
      const json = await res.json();
      if (!json.ok) return toast.error(json.error);
      toast.success("Workspace updated");
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Workspace</CardTitle>
        <CardDescription>General settings for your organization.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-1.5">
          <Label>Workspace name</Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label>Current plan</Label>
          <div>
            <Badge variant="secondary" className="uppercase">{plan}</Badge>
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Button onClick={save} disabled={saving || name === initialName}>
          {saving && <Loader2 className="h-4 w-4 animate-spin" />} Save changes
        </Button>
      </CardFooter>
    </Card>
  );
}

export function AIProviderStatus({ openaiConfigured, anthropicConfigured }: { openaiConfigured: boolean; anthropicConfigured: boolean }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>AI providers</CardTitle>
        <CardDescription>API keys are configured via environment variables and never exposed to the browser.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <ProviderRow name="Built-in (Mock)" configured status="Always available — zero setup, great for demos" />
        <ProviderRow name="OpenAI" configured={openaiConfigured} status={openaiConfigured ? "API key detected" : "Add OPENAI_API_KEY to your .env file"} />
        <ProviderRow name="Anthropic Claude" configured={anthropicConfigured} status={anthropicConfigured ? "API key detected" : "Add ANTHROPIC_API_KEY to your .env file"} />
      </CardContent>
      <CardFooter>
        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <ShieldCheck className="h-3.5 w-3.5" /> Keys are read server-side only — nothing is sent to the client.
        </p>
      </CardFooter>
    </Card>
  );
}

function ProviderRow({ name, configured, status }: { name: string; configured: boolean; status: string }) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-border p-3">
      <div className="flex items-center gap-2.5">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted"><KeyRound className="h-4 w-4 text-muted-foreground" /></span>
        <div>
          <p className="text-sm font-medium">{name}</p>
          <p className="text-xs text-muted-foreground">{status}</p>
        </div>
      </div>
      <Badge variant={configured ? "success" : "outline"}>{configured ? "Active" : "Not configured"}</Badge>
    </div>
  );
}

export function DangerZone() {
  return (
    <Card className="border-destructive/30">
      <CardHeader>
        <CardTitle className="text-destructive">Danger zone</CardTitle>
        <CardDescription>Irreversible actions — proceed with caution.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between rounded-lg border border-destructive/30 bg-destructive/5 p-4">
          <div>
            <p className="text-sm font-medium">Delete workspace</p>
            <p className="text-xs text-muted-foreground">Permanently deletes all conversations, documents, and settings.</p>
          </div>
          <Button variant="destructive" onClick={() => toast.error("Workspace deletion is disabled in this demo.")}>
            Delete workspace
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
