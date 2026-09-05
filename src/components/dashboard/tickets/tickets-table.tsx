"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import Link from "next/link";
import { Ticket as TicketIcon, ExternalLink } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { TicketStatusBadge, PriorityBadge } from "@/components/shared/status-badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { initials, formatRelativeTime } from "@/lib/utils";

interface TicketItem {
  id: string;
  number: number;
  subject: string;
  priority: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  conversationId: string | null;
  customer: { name: string; avatarColor: string; email: string | null };
  assignee: { id: string; name: string; avatarColor: string } | null;
}

const STATUS_FILTERS = ["all", "OPEN", "IN_PROGRESS", "WAITING", "RESOLVED", "CLOSED"];

export function TicketsTable() {
  const [items, setItems] = useState<TicketItem[] | null>(null);
  const [error, setError] = useState(false);
  const [status, setStatus] = useState("all");
  const [selected, setSelected] = useState<TicketItem | null>(null);

  const load = useCallback(() => {
    setError(false);
    const params = new URLSearchParams();
    if (status !== "all") params.set("status", status);
    fetch(`/api/tickets?${params.toString()}`)
      .then((r) => r.json())
      .then((json) => {
        if (!json.ok) throw new Error();
        setItems(json.data);
      })
      .catch(() => setError(true));
  }, [status]);

  useEffect(load, [load]);

  async function updateTicket(id: string, patch: Record<string, unknown>) {
    const res = await fetch(`/api/tickets/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    const json = await res.json();
    if (json.ok) {
      toast.success("Ticket updated");
      setItems((prev) => prev?.map((t) => (t.id === id ? { ...t, ...json.data } : t)) ?? null);
      setSelected((prev) => (prev ? { ...prev, ...json.data } : prev));
    } else toast.error(json.error);
  }

  return (
    <div className="space-y-5">
      <Tabs value={status} onValueChange={setStatus}>
        <TabsList className="flex-wrap">
          {STATUS_FILTERS.map((s) => (
            <TabsTrigger key={s} value={s} className="text-xs">
              {s === "all" ? "All" : s.replace("_", " ")}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {error ? (
        <ErrorState message="Couldn't load tickets." onRetry={load} />
      ) : items === null ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full rounded-xl" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <EmptyState icon={<TicketIcon className="h-5 w-5" />} title="No tickets here" description="Escalated conversations automatically create tickets for your team." />
      ) : (
        <>
          {/* Table on desktop */}
          <Card className="hidden overflow-hidden md:block">
            <div className="grid grid-cols-12 gap-3 border-b border-border bg-muted/40 px-4 py-2.5 text-xs font-medium text-muted-foreground">
              <div className="col-span-1">ID</div>
              <div className="col-span-4">Subject</div>
              <div className="col-span-2">Customer</div>
              <div className="col-span-1">Priority</div>
              <div className="col-span-2">Status</div>
              <div className="col-span-2">Updated</div>
            </div>
            <div className="divide-y divide-border">
              {items.map((t) => (
                <button key={t.id} onClick={() => setSelected(t)} className="grid w-full grid-cols-12 items-center gap-3 px-4 py-3 text-left text-sm transition-colors hover:bg-accent">
                  <div className="tabular col-span-1 font-mono text-xs text-muted-foreground">#{t.number}</div>
                  <div className="col-span-4 truncate font-medium">{t.subject}</div>
                  <div className="col-span-2 flex items-center gap-2 truncate">
                    <Avatar className="h-6 w-6"><AvatarFallback style={{ backgroundColor: t.customer.avatarColor, color: "white" }} className="text-[10px]">{initials(t.customer.name)}</AvatarFallback></Avatar>
                    <span className="truncate">{t.customer.name}</span>
                  </div>
                  <div className="col-span-1"><PriorityBadge priority={t.priority} /></div>
                  <div className="col-span-2"><TicketStatusBadge status={t.status} /></div>
                  <div className="col-span-2 text-xs text-muted-foreground">{formatRelativeTime(t.updatedAt)}</div>
                </button>
              ))}
            </div>
          </Card>

          {/* Cards on mobile */}
          <div className="space-y-2.5 md:hidden">
            {items.map((t) => (
              <Card key={t.id} className="cursor-pointer p-4 transition-all hover:-translate-y-0.5 hover:shadow-soft-md" onClick={() => setSelected(t)}>
                <div className="flex items-center justify-between">
                  <span className="tabular font-mono text-xs text-muted-foreground">#{t.number}</span>
                  <PriorityBadge priority={t.priority} />
                </div>
                <p className="mt-1.5 text-sm font-medium">{t.subject}</p>
                <div className="mt-2 flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">{t.customer.name}</span>
                  <TicketStatusBadge status={t.status} />
                </div>
              </Card>
            ))}
          </div>
        </>
      )}

      <Dialog open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent>
          {selected && (
            <>
              <DialogHeader>
                <DialogTitle>#{selected.number} — {selected.subject}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <Avatar className="h-9 w-9"><AvatarFallback style={{ backgroundColor: selected.customer.avatarColor, color: "white" }}>{initials(selected.customer.name)}</AvatarFallback></Avatar>
                  <div>
                    <p className="text-sm font-medium">{selected.customer.name}</p>
                    <p className="text-xs text-muted-foreground">{selected.customer.email || "No email on file"}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <p className="text-xs font-medium text-muted-foreground">Status</p>
                    <Select value={selected.status} onValueChange={(v) => updateTicket(selected.id, { status: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {["OPEN", "IN_PROGRESS", "WAITING", "RESOLVED", "CLOSED"].map((s) => (
                          <SelectItem key={s} value={s}>{s.replace("_", " ")}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <p className="text-xs font-medium text-muted-foreground">Priority</p>
                    <Select value={selected.priority} onValueChange={(v) => updateTicket(selected.id, { priority: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {["LOW", "MEDIUM", "HIGH", "URGENT"].map((p) => (
                          <SelectItem key={p} value={p}>{p}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">Created {formatRelativeTime(selected.createdAt)} · Updated {formatRelativeTime(selected.updatedAt)}</p>
                {selected.conversationId && (
                  <Link href={`/dashboard/conversations/${selected.conversationId}`} className="flex items-center gap-1.5 text-sm text-primary hover:underline">
                    View conversation <ExternalLink className="h-3.5 w-3.5" />
                  </Link>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
