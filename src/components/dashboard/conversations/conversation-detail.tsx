"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { toast } from "sonner";
import {
  Send, UserCheck, AlertTriangle, CheckCircle2, Bot, User, Sparkles, Mail, Phone, FileText, StickyNote,
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { ErrorState } from "@/components/shared/error-state";
import { ConversationStatusBadge } from "@/components/shared/status-badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { cn, initials, formatRelativeTime } from "@/lib/utils";

interface Message {
  id: string;
  role: "CUSTOMER" | "AI" | "HUMAN" | "SYSTEM";
  content: string;
  sources?: string | null;
  confidence?: number | null;
  createdAt: string;
}

interface ConversationData {
  id: string;
  status: string;
  customer: { id: string; name: string; email: string | null; phone: string | null; avatarColor: string };
  agent: { name: string };
  assignee: { id: string; name: string } | null;
  messages: Message[];
  internalNotes: { id: string; content: string; createdAt: string; author: { name: string } }[];
  ticket: { id: string; number: number } | null;
}

export function ConversationDetail({ conversationId }: { conversationId: string }) {
  const [data, setData] = useState<ConversationData | null>(null);
  const [error, setError] = useState(false);
  const [reply, setReply] = useState("");
  const [note, setNote] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const load = useCallback(() => {
    setError(false);
    fetch(`/api/conversations/${conversationId}`)
      .then((r) => r.json())
      .then((json) => {
        if (!json.ok) throw new Error();
        setData(json.data);
      })
      .catch(() => setError(true));
  }, [conversationId]);

  useEffect(() => {
    load();
    const interval = setInterval(load, 8000);
    return () => clearInterval(interval);
  }, [load]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [data?.messages.length]);

  async function sendReply() {
    if (!reply.trim()) return;
    setSending(true);
    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversationId, content: reply.trim() }),
      });
      const json = await res.json();
      if (!json.ok) throw new Error(json.error);
      setReply("");
      load();
    } catch (e: any) {
      toast.error(e.message || "Couldn't send message");
    } finally {
      setSending(false);
    }
  }

  async function updateStatus(status: string) {
    const res = await fetch(`/api/conversations/${conversationId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    const json = await res.json();
    if (json.ok) {
      toast.success(`Marked as ${status.replace("_", " ").toLowerCase()}`);
      load();
    } else toast.error(json.error);
  }

  async function escalate() {
    const res = await fetch(`/api/conversations/${conversationId}/escalate`, { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" });
    const json = await res.json();
    if (json.ok) {
      toast.success("Escalated to human support");
      load();
    } else toast.error(json.error);
  }

  async function addNote() {
    if (!note.trim()) return;
    const res = await fetch(`/api/conversations/${conversationId}/notes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: note.trim() }),
    });
    const json = await res.json();
    if (json.ok) {
      setNote("");
      load();
    } else toast.error(json.error);
  }

  if (error) {
    return (
      <div className="p-6">
        <ErrorState message="Couldn't load this conversation." onRetry={load} />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="space-y-4 p-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col sm:flex-row">
      {/* Thread */}
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <div className="flex items-center justify-between gap-3 border-b border-border px-5 py-3.5">
          <div className="flex min-w-0 items-center gap-3">
            <Avatar className="h-9 w-9 shrink-0">
              <AvatarFallback style={{ backgroundColor: data.customer.avatarColor, color: "white" }}>{initials(data.customer.name)}</AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">{data.customer.name}</p>
              <p className="truncate text-xs text-muted-foreground">{data.customer.email || "No email on file"}</p>
            </div>
          </div>
          <span className="shrink-0">
            <ConversationStatusBadge status={data.status} />
          </span>
        </div>

        {data.status === "HUMAN_REQUIRED" && (
          <div className="flex items-center gap-2 border-b border-destructive/20 bg-destructive/10 px-5 py-2.5 text-sm font-medium text-destructive">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            AI has handed this conversation to you.
          </div>
        )}

        <div className="flex-1 overflow-y-auto px-5 py-4">
          <div className="space-y-4">
            {data.messages.map((m) => (
              <MessageBubble key={m.id} message={m} />
            ))}
            <div ref={bottomRef} />
          </div>
        </div>

        <div className="border-t border-border p-4">
          <div className="flex items-end gap-2">
            <Textarea
              placeholder="Reply as a human agent…"
              className="min-h-[44px] resize-none"
              value={reply}
              onChange={(e) => setReply(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  sendReply();
                }
              }}
            />
            <Button size="icon" onClick={sendReply} disabled={sending || !reply.trim()}>
              <Send className="h-4 w-4" />
            </Button>
          </div>
          <p className="mt-1.5 text-[11px] text-muted-foreground">Sending a reply takes over this conversation from the AI.</p>
        </div>
      </div>

      {/* Side panel */}
      <div className="w-full shrink-0 overflow-y-auto border-t border-border sm:w-80 sm:border-l sm:border-t-0">
        <div className="space-y-6 p-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Customer</p>
            <div className="mt-2 space-y-1.5 text-sm">
              <p className="flex items-center gap-2"><Mail className="h-3.5 w-3.5 text-muted-foreground" /> {data.customer.email || "Not provided"}</p>
              <p className="flex items-center gap-2"><Phone className="h-3.5 w-3.5 text-muted-foreground" /> {data.customer.phone || "Not provided"}</p>
            </div>
          </div>

          <Separator />

          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Status</p>
            <div className="mt-2">
              <Select value={data.status} onValueChange={updateStatus}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="OPEN">Open</SelectItem>
                  <SelectItem value="AI_HANDLING">AI Handling</SelectItem>
                  <SelectItem value="WAITING">Waiting</SelectItem>
                  <SelectItem value="HUMAN_REQUIRED">Human Required</SelectItem>
                  <SelectItem value="RESOLVED">Resolved</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <Button variant="outline" size="sm" onClick={escalate}>
                <UserCheck className="h-3.5 w-3.5" /> Escalate
              </Button>
              <Button variant="outline" size="sm" onClick={() => updateStatus("RESOLVED")}>
                <CheckCircle2 className="h-3.5 w-3.5" /> Resolve
              </Button>
            </div>
          </div>

          {data.ticket && (
            <>
              <Separator />
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Linked ticket</p>
                <a href="/dashboard/tickets" className="mt-2 flex items-center gap-2 text-sm text-primary hover:underline">
                  <FileText className="h-3.5 w-3.5" /> Ticket #{data.ticket.number}
                </a>
              </div>
            </>
          )}

          <Separator />

          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Internal notes</p>
            <div className="mt-2 space-y-2">
              {data.internalNotes.length === 0 && <p className="text-xs text-muted-foreground">No notes yet — only your team can see these.</p>}
              {data.internalNotes.map((n) => (
                <div key={n.id} className="rounded-lg bg-warning/10 p-2.5 text-xs">
                  <p className="text-foreground/90">{n.content}</p>
                  <p className="mt-1 text-[10px] text-muted-foreground">{n.author.name} · {formatRelativeTime(n.createdAt)}</p>
                </div>
              ))}
            </div>
            <div className="mt-2 flex items-end gap-2">
              <Textarea placeholder="Add a private note…" className="min-h-[60px] resize-none text-xs" value={note} onChange={(e) => setNote(e.target.value)} />
            </div>
            <Button size="sm" variant="secondary" className="mt-2 w-full" onClick={addNote} disabled={!note.trim()}>
              <StickyNote className="h-3.5 w-3.5" /> Add note
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function MessageBubble({ message }: { message: Message }) {
  const isCustomer = message.role === "CUSTOMER";
  const sources = message.sources ? (JSON.parse(message.sources) as { documentName: string; snippet: string; score: number }[]) : [];

  return (
    <div className={cn("flex gap-2.5", isCustomer ? "justify-end" : "justify-start")}>
      {!isCustomer && (
        <span className={cn("flex h-7 w-7 shrink-0 items-center justify-center rounded-full shadow-soft-xs", message.role === "AI" ? "bg-primary/10 text-primary" : "bg-secondary text-secondary-foreground")}>
          {message.role === "AI" ? <Bot className="h-3.5 w-3.5" /> : <User className="h-3.5 w-3.5" />}
        </span>
      )}
      <div className={cn("max-w-[75%] space-y-1.5", isCustomer && "items-end")}>
        <div className={cn("rounded-2xl px-3.5 py-2 text-sm leading-relaxed shadow-soft-xs", isCustomer ? "rounded-br-md bg-primary text-primary-foreground" : "rounded-bl-md bg-muted")}>
          {message.content}
        </div>
        <div className={cn("flex items-center gap-2 text-[10px] text-muted-foreground", isCustomer && "justify-end")}>
          <span>{formatRelativeTime(message.createdAt)}</span>
          {message.role === "AI" && message.confidence != null && (
            <Badge variant="outline" className="h-4 gap-1 px-1.5 py-0 text-[10px]">
              <Sparkles className="h-2.5 w-2.5" /> {Math.round(message.confidence * 100)}% confidence
            </Badge>
          )}
        </div>
        {sources.length > 0 && (
          <div className="space-y-1 rounded-lg border border-border/60 bg-background p-2.5">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Sources used</p>
            {sources.map((s, i) => (
              <p key={i} className="truncate text-[10px] text-muted-foreground">
                📄 {s.documentName} <span className="opacity-60">({Math.round(s.score * 100)}% match)</span>
              </p>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
