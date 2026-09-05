"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Users, UserPlus, Trash2, Loader2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { initials } from "@/lib/utils";

interface Member {
  id: string;
  role: "OWNER" | "ADMIN" | "AGENT" | "VIEWER";
  user: { id: string; name: string; email: string; avatarColor: string };
}

export function TeamPanel() {
  const [members, setMembers] = useState<Member[] | null>(null);
  const [error, setError] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ email: "", role: "AGENT" });
  const [inviting, setInviting] = useState(false);

  const load = useCallback(() => {
    setError(false);
    fetch("/api/team")
      .then((r) => r.json())
      .then((json) => {
        if (!json.ok) throw new Error();
        setMembers(json.data);
      })
      .catch(() => setError(true));
  }, []);

  useEffect(load, [load]);

  async function invite() {
    if (!form.email.trim()) return;
    setInviting(true);
    try {
      const res = await fetch("/api/team", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const json = await res.json();
      if (!json.ok) {
        toast.error(json.error);
        return;
      }
      toast.success(`Invited ${form.email}`);
      setDialogOpen(false);
      setForm({ email: "", role: "AGENT" });
      load();
    } finally {
      setInviting(false);
    }
  }

  async function changeRole(id: string, role: string) {
    const res = await fetch(`/api/team/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role }),
    });
    const json = await res.json();
    if (json.ok) {
      toast.success("Role updated");
      load();
    } else toast.error(json.error);
  }

  async function remove(id: string) {
    const res = await fetch(`/api/team/${id}`, { method: "DELETE" });
    const json = await res.json();
    if (json.ok) {
      toast.success("Member removed");
      setMembers((prev) => prev?.filter((m) => m.id !== id) ?? null);
    } else toast.error(json.error);
  }

  return (
    <div className="space-y-5">
      <div className="flex justify-end">
        <Button onClick={() => setDialogOpen(true)}>
          <UserPlus className="h-4 w-4" /> Invite member
        </Button>
      </div>

      {error ? (
        <ErrorState message="Couldn't load your team." onRetry={load} />
      ) : members === null ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full rounded-xl" />
          ))}
        </div>
      ) : members.length === 0 ? (
        <EmptyState icon={<Users className="h-5 w-5" />} title="No team members yet" description="Invite teammates to help manage conversations and tickets." action={{ label: "Invite member", onClick: () => setDialogOpen(true) }} />
      ) : (
        <Card className="divide-y divide-border overflow-hidden">
          {members.map((m) => (
            <div key={m.id} className="flex items-center justify-between gap-3 p-4 transition-colors hover:bg-accent/40">
              <div className="flex min-w-0 items-center gap-3">
                <Avatar className="h-9 w-9"><AvatarFallback style={{ backgroundColor: m.user.avatarColor, color: "white" }}>{initials(m.user.name)}</AvatarFallback></Avatar>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{m.user.name}</p>
                  <p className="truncate text-xs text-muted-foreground">{m.user.email}</p>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                {m.role === "OWNER" ? (
                  <Badge>Owner</Badge>
                ) : (
                  <Select value={m.role} onValueChange={(v) => changeRole(m.id, v)}>
                    <SelectTrigger className="h-8 w-32 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ADMIN">Admin</SelectItem>
                      <SelectItem value="AGENT">Support Agent</SelectItem>
                      <SelectItem value="VIEWER">Viewer</SelectItem>
                    </SelectContent>
                  </Select>
                )}
                {m.role !== "OWNER" && (
                  <Button variant="ghost" size="icon" onClick={() => remove(m.id)} aria-label="Remove member">
                    <Trash2 className="h-4 w-4 text-muted-foreground" />
                  </Button>
                )}
              </div>
            </div>
          ))}
        </Card>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invite team member</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label>Email</Label>
              <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="teammate@company.com" />
            </div>
            <div className="space-y-1.5">
              <Label>Role</Label>
              <Select value={form.role} onValueChange={(v) => setForm({ ...form, role: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ADMIN">Admin — manage workspace & team</SelectItem>
                  <SelectItem value="AGENT">Support Agent — handle conversations</SelectItem>
                  <SelectItem value="VIEWER">Viewer — read-only access</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={invite} disabled={inviting}>
              {inviting && <Loader2 className="h-4 w-4 animate-spin" />} Send invite
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
