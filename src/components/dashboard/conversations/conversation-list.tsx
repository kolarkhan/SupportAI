"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { cn, initials, formatRelativeTime, truncate } from "@/lib/utils";
import { MessageSquare } from "lucide-react";

interface ConversationSummary {
  id: string;
  status: string;
  lastMessageAt: string;
  customer: { name: string; avatarColor: string };
  messages: { content: string }[];
}

const FILTERS = [
  { value: "all", label: "All" },
  { value: "HUMAN_REQUIRED", label: "Needs you" },
  { value: "AI_HANDLING", label: "AI Handling" },
  { value: "RESOLVED", label: "Resolved" },
];

export function ConversationList({ activeId }: { activeId?: string }) {
  const [items, setItems] = useState<ConversationSummary[] | null>(null);
  const [error, setError] = useState(false);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("all");

  const load = useCallback(() => {
    setError(false);
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (status !== "all") params.set("status", status);
    fetch(`/api/conversations?${params.toString()}`)
      .then((r) => r.json())
      .then((json) => {
        if (!json.ok) throw new Error();
        setItems(json.data.items);
      })
      .catch(() => setError(true));
  }, [q, status]);

  useEffect(() => {
    const t = setTimeout(load, 250); // debounced search
    return () => clearTimeout(t);
  }, [load]);

  return (
    <div className="flex h-full flex-col">
      <div className="space-y-3 border-b border-border p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search conversations..." className="pl-9" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <Tabs value={status} onValueChange={setStatus}>
          <TabsList className="w-full justify-start overflow-x-auto">
            {FILTERS.map((f) => (
              <TabsTrigger key={f.value} value={f.value} className="text-xs">
                {f.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      <div className="flex-1 overflow-y-auto">
        {error ? (
          <div className="p-4">
            <ErrorState message="Couldn't load conversations." onRetry={load} />
          </div>
        ) : items === null ? (
          <div className="space-y-3 p-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="h-9 w-9 rounded-full" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-3.5 w-2/3" />
                  <Skeleton className="h-3 w-full" />
                </div>
              </div>
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="p-4">
            <EmptyState icon={<MessageSquare className="h-5 w-5" />} title="No conversations found" description="Try a different search or filter." />
          </div>
        ) : (
          <ul>
            {items.map((c) => (
              <li key={c.id}>
                <Link
                  href={`/dashboard/conversations/${c.id}`}
                  className={cn(
                    "relative flex items-start gap-3 border-b border-border/60 px-4 py-3.5 transition-colors hover:bg-accent",
                    activeId === c.id && "bg-accent"
                  )}
                >
                  {activeId === c.id && <span className="absolute left-0 top-0 h-full w-0.5 bg-primary" />}
                  <Avatar className="h-9 w-9 shrink-0">
                    <AvatarFallback style={{ backgroundColor: c.customer.avatarColor, color: "white" }}>{initials(c.customer.name)}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate text-sm font-medium">{c.customer.name}</p>
                      <span className="shrink-0 text-[11px] text-muted-foreground">{formatRelativeTime(c.lastMessageAt)}</span>
                    </div>
                    <p className="mt-0.5 truncate text-xs text-muted-foreground">{truncate(c.messages[0]?.content || "No messages yet", 52)}</p>
                  </div>
                  {c.status === "HUMAN_REQUIRED" && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-destructive" />}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
