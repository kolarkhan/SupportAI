"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Save } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { KnowledgeTabs } from "@/components/dashboard/knowledge/knowledge-tabs";

interface AgentData {
  id: string;
  name: string;
  avatarEmoji: string;
  brandColor: string;
  personality: string;
  systemInstructions: string;
  provider: string;
  answerOnlyFromKnowledgeBase: boolean;
  allowGeneralKnowledge: boolean;
  requireHumanApproval: boolean;
  escalateUncertainQuestions: boolean;
  collectCustomerInfo: boolean;
  askForEmail: boolean;
  askForPhone: boolean;
  confidenceThreshold: number;
  escalationKeywords: string;
  businessHoursStart: string;
  businessHoursEnd: string;
  businessTimezone: string;
  escalationMessage: string;
  widgetWelcomeMessage: string;
  widgetPosition: string;
  isPublished: boolean;
}

const PERSONALITIES = [
  { value: "PROFESSIONAL", label: "Professional" },
  { value: "FRIENDLY", label: "Friendly" },
  { value: "CONCISE", label: "Concise" },
  { value: "FORMAL", label: "Formal" },
  { value: "CUSTOM", label: "Custom" },
];

export function AgentBuilder() {
  const searchParams = useSearchParams();
  const initialTab = searchParams.get("tab") === "knowledge" ? "knowledge" : "general";
  const [agent, setAgent] = useState<AgentData | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetch("/api/agents")
      .then((r) => r.json())
      .then((json) => {
        if (!json.ok || json.data.length === 0) throw new Error();
        setAgent(json.data[0]);
      })
      .catch(() => setError(true));
  }, []);

  function set<K extends keyof AgentData>(key: K, value: AgentData[K]) {
    setAgent((prev) => (prev ? { ...prev, [key]: value } : prev));
  }

  async function save() {
    if (!agent) return;
    setSaving(true);
    try {
      const { id, ...body } = agent;
      const res = await fetch(`/api/agents/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!json.ok) {
        toast.error(json.error || "Couldn't save changes");
        return;
      }
      toast.success("Agent updated");
    } finally {
      setSaving(false);
    }
  }

  if (error) return <p className="text-sm text-destructive">Couldn't load your agent. Please refresh the page.</p>;

  if (!agent) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl text-xl shadow-soft-sm" style={{ backgroundColor: `${agent.brandColor}1a` }}>
            {agent.avatarEmoji}
          </span>
          <div>
            <p className="font-semibold tracking-[-0.01em]">{agent.name}</p>
            <p className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
              <span className={cn("h-1.5 w-1.5 rounded-full", agent.isPublished ? "bg-success" : "bg-muted-foreground/40")} />
              {agent.isPublished ? "Published — live on your widget" : "Unpublished"}
            </p>
          </div>
        </div>
        <Button onClick={save} disabled={saving}>
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Save changes
        </Button>
      </div>

      <Tabs defaultValue={initialTab}>
        <TabsList className="flex-wrap">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="knowledge">Knowledge Base</TabsTrigger>
          <TabsTrigger value="behavior">Behavior</TabsTrigger>
          <TabsTrigger value="handoff">Human Handoff</TabsTrigger>
          <TabsTrigger value="widget">Widget</TabsTrigger>
        </TabsList>

        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle>Identity & personality</CardTitle>
              <CardDescription>How your agent introduces itself and speaks with customers.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label>Agent name</Label>
                  <Input value={agent.name} onChange={(e) => set("name", e.target.value)} placeholder="Acme Support Assistant" />
                </div>
                <div className="space-y-1.5">
                  <Label>Personality</Label>
                  <Select value={agent.personality} onValueChange={(v) => set("personality", v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {PERSONALITIES.map((p) => (
                        <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>System instructions</Label>
                <Textarea
                  rows={5}
                  value={agent.systemInstructions}
                  onChange={(e) => set("systemInstructions", e.target.value)}
                  placeholder="You are the customer support assistant for Acme. Always be polite and never invent information."
                />
                <p className="text-xs text-muted-foreground">These instructions always take priority over content retrieved from your knowledge base.</p>
              </div>
              <div className="space-y-1.5">
                <Label>AI provider</Label>
                <Select value={agent.provider} onValueChange={(v) => set("provider", v)}>
                  <SelectTrigger className="max-w-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MOCK">Built-in (no API key needed)</SelectItem>
                    <SelectItem value="OPENAI">OpenAI</SelectItem>
                    <SelectItem value="ANTHROPIC">Anthropic Claude</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">OpenAI/Anthropic require an API key in your environment variables — see Settings.</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="knowledge">
          <div className="space-y-1.5 pb-4">
            <p className="text-sm font-medium">Knowledge base</p>
            <p className="text-xs text-muted-foreground">Upload documents, connect websites, and write FAQs to train this agent.</p>
          </div>
          <KnowledgeTabs initialTab="documents" />
        </TabsContent>

        <TabsContent value="behavior">
          <Card>
            <CardHeader>
              <CardTitle>Behavior</CardTitle>
              <CardDescription>Control how strictly the agent sticks to your knowledge base and what it collects from customers.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-1">
              <ToggleRow
                label="Answer only from knowledge base"
                description="Never answer using general knowledge — respond with the fallback message if nothing relevant is found."
                checked={agent.answerOnlyFromKnowledgeBase}
                onChange={(v) => set("answerOnlyFromKnowledgeBase", v)}
              />
              <ToggleRow
                label="Allow general knowledge"
                description="Let the agent fill small gaps with general knowledge when the KB is incomplete."
                checked={agent.allowGeneralKnowledge}
                onChange={(v) => set("allowGeneralKnowledge", v)}
              />
              <ToggleRow
                label="Require human approval"
                description="Hold AI responses for review before they're sent to the customer."
                checked={agent.requireHumanApproval}
                onChange={(v) => set("requireHumanApproval", v)}
              />
              <ToggleRow
                label="Escalate uncertain questions"
                description="Automatically hand off to a human when confidence is below the threshold."
                checked={agent.escalateUncertainQuestions}
                onChange={(v) => set("escalateUncertainQuestions", v)}
              />
              <Separator className="my-2" />
              <ToggleRow
                label="Collect customer information"
                description="Ask the customer for contact details during the conversation."
                checked={agent.collectCustomerInfo}
                onChange={(v) => set("collectCustomerInfo", v)}
              />
              <ToggleRow label="Ask for email" description="Prompt for an email address early in the conversation." checked={agent.askForEmail} onChange={(v) => set("askForEmail", v)} />
              <ToggleRow label="Ask for phone number" description="Prompt for a phone number early in the conversation." checked={agent.askForPhone} onChange={(v) => set("askForPhone", v)} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="handoff">
          <Card>
            <CardHeader>
              <CardTitle>Human handoff</CardTitle>
              <CardDescription>Decide exactly when a conversation should be handed to your team.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-1.5">
                <Label>Confidence threshold — {Math.round(agent.confidenceThreshold * 100)}%</Label>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={Math.round(agent.confidenceThreshold * 100)}
                  onChange={(e) => set("confidenceThreshold", Number(e.target.value) / 100)}
                  className="w-full accent-primary"
                />
                <p className="text-xs text-muted-foreground">Answers below this confidence are escalated automatically.</p>
              </div>
              <div className="space-y-1.5">
                <Label>Escalation keywords</Label>
                <Input value={agent.escalationKeywords} onChange={(e) => set("escalationKeywords", e.target.value)} placeholder="refund, cancel, speak to a human" />
                <p className="text-xs text-muted-foreground">Comma-separated. Any match immediately escalates the conversation.</p>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div className="space-y-1.5">
                  <Label>Business hours start</Label>
                  <Input type="time" value={agent.businessHoursStart} onChange={(e) => set("businessHoursStart", e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label>Business hours end</Label>
                  <Input type="time" value={agent.businessHoursEnd} onChange={(e) => set("businessHoursEnd", e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label>Timezone</Label>
                  <Input value={agent.businessTimezone} onChange={(e) => set("businessTimezone", e.target.value)} placeholder="UTC" />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Escalation message</Label>
                <Textarea rows={2} value={agent.escalationMessage} onChange={(e) => set("escalationMessage", e.target.value)} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="widget">
          <Card>
            <CardHeader>
              <CardTitle>Widget</CardTitle>
              <CardDescription>Customize the embeddable chat widget's appearance and first message.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label>Widget position</Label>
                  <Select value={agent.widgetPosition} onValueChange={(v) => set("widgetPosition", v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="bottom-right">Bottom right</SelectItem>
                      <SelectItem value="bottom-left">Bottom left</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Brand color</Label>
                  <div className="flex items-center gap-2">
                    <input type="color" value={agent.brandColor} onChange={(e) => set("brandColor", e.target.value)} className="h-9 w-12 rounded border border-input" />
                    <Input value={agent.brandColor} onChange={(e) => set("brandColor", e.target.value)} />
                  </div>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Welcome message</Label>
                <Textarea rows={2} value={agent.widgetWelcomeMessage} onChange={(e) => set("widgetWelcomeMessage", e.target.value)} />
              </div>
              <div className="rounded-lg border border-border bg-muted/40 p-4">
                <p className="text-xs font-medium text-muted-foreground">Embed this on your website</p>
                <pre className="mt-2 overflow-x-auto rounded-md bg-background p-3 text-xs">
{`<script src="${typeof window !== "undefined" ? window.location.origin : ""}/widget.js" data-agent-id="${agent.id}"></script>`}
                </pre>
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={agent.isPublished} onCheckedChange={(v) => set("isPublished", v)} />
                <span className="text-sm">Agent is published and reachable by customers</span>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function ToggleRow({ label, description, checked, onChange }: { label: string; description: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between gap-4 py-3">
      <div>
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );
}
