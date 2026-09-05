"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { HelpCircle, Plus, Trash2, Pencil, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

interface FAQItem {
  id: string;
  question: string;
  answer: string;
  isActive: boolean;
}

export function FAQsPanel() {
  const [items, setItems] = useState<FAQItem[] | null>(null);
  const [error, setError] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<FAQItem | null>(null);
  const [form, setForm] = useState({ question: "", answer: "" });
  const [saving, setSaving] = useState(false);

  const load = useCallback(() => {
    setError(false);
    fetch("/api/faqs")
      .then((r) => r.json())
      .then((json) => {
        if (!json.ok) throw new Error();
        setItems(json.data);
      })
      .catch(() => setError(true));
  }, []);

  useEffect(load, [load]);

  function openCreate() {
    setEditing(null);
    setForm({ question: "", answer: "" });
    setDialogOpen(true);
  }
  function openEdit(faq: FAQItem) {
    setEditing(faq);
    setForm({ question: faq.question, answer: faq.answer });
    setDialogOpen(true);
  }

  async function save() {
    if (!form.question.trim() || !form.answer.trim()) return;
    setSaving(true);
    try {
      const res = await fetch(editing ? `/api/faqs/${editing.id}` : "/api/faqs", {
        method: editing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const json = await res.json();
      if (!json.ok) {
        toast.error(json.error);
        return;
      }
      toast.success(editing ? "FAQ updated" : "FAQ added");
      setDialogOpen(false);
      load();
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(faq: FAQItem) {
    const res = await fetch(`/api/faqs/${faq.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !faq.isActive }),
    });
    const json = await res.json();
    if (json.ok) setItems((prev) => prev?.map((f) => (f.id === faq.id ? { ...f, isActive: !faq.isActive } : f)) ?? null);
  }

  async function remove(id: string) {
    const res = await fetch(`/api/faqs/${id}`, { method: "DELETE" });
    const json = await res.json();
    if (json.ok) {
      toast.success("FAQ removed");
      setItems((prev) => prev?.filter((f) => f.id !== id) ?? null);
    } else toast.error(json.error);
  }

  return (
    <div className="space-y-5">
      <div className="flex justify-end">
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4" /> Add FAQ
        </Button>
      </div>

      {error ? (
        <ErrorState message="Couldn't load FAQs." onRetry={load} />
      ) : items === null ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full rounded-xl" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <EmptyState icon={<HelpCircle className="h-5 w-5" />} title="No FAQs yet" description="Add common questions and answers to give your agent quick, reliable responses." action={{ label: "Add FAQ", onClick: openCreate }} />
      ) : (
        <div className="space-y-2.5">
          {items.map((faq) => (
            <Card key={faq.id} className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">{faq.question}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{faq.answer}</p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <Badge variant={faq.isActive ? "success" : "outline"}>{faq.isActive ? "Active" : "Inactive"}</Badge>
                </div>
              </div>
              <div className="mt-3 flex items-center justify-between border-t border-border/60 pt-3">
                <div className="flex items-center gap-2">
                  <Switch checked={faq.isActive} onCheckedChange={() => toggleActive(faq)} />
                  <span className="text-xs text-muted-foreground">Visible to agent</span>
                </div>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="icon" onClick={() => openEdit(faq)} aria-label="Edit"><Pencil className="h-3.5 w-3.5" /></Button>
                  <Button variant="ghost" size="icon" onClick={() => remove(faq.id)} aria-label="Delete"><Trash2 className="h-3.5 w-3.5" /></Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Edit FAQ" : "Add FAQ"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label>Question</Label>
              <Input value={form.question} onChange={(e) => setForm({ ...form, question: e.target.value })} placeholder="What is your refund policy?" />
            </div>
            <div className="space-y-1.5">
              <Label>Answer</Label>
              <Textarea value={form.answer} onChange={(e) => setForm({ ...form, answer: e.target.value })} placeholder="Customers can request a refund within 30 days." rows={4} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={save} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 animate-spin" />} Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
