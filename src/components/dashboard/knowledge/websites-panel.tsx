"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Globe, Trash2, Loader2, CheckCircle2, XCircle, Clock, RotateCw, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { formatRelativeTime } from "@/lib/utils";

interface WebsiteItem {
  id: string;
  url: string;
  status: "PENDING" | "CRAWLING" | "PROCESSED" | "FAILED";
  chunkCount: number;
  errorMessage: string | null;
  createdAt: string;
}

const STATUS_META: Record<string, { label: string; icon: React.ReactNode; className: string }> = {
  PENDING: { label: "Queued", icon: <Clock className="h-3 w-3" />, className: "text-muted-foreground border-border" },
  CRAWLING: { label: "Crawling…", icon: <Loader2 className="h-3 w-3 animate-spin" />, className: "text-primary border-primary/30 bg-primary/5" },
  PROCESSED: { label: "Indexed", icon: <CheckCircle2 className="h-3 w-3" />, className: "text-success border-success/30 bg-success/5" },
  FAILED: { label: "Failed", icon: <XCircle className="h-3 w-3" />, className: "text-destructive border-destructive/30 bg-destructive/5" },
};

export function WebsitesPanel() {
  const [items, setItems] = useState<WebsiteItem[] | null>(null);
  const [error, setError] = useState(false);
  const [url, setUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(() => {
    setError(false);
    fetch("/api/websites")
      .then((r) => r.json())
      .then((json) => {
        if (!json.ok) throw new Error();
        setItems(json.data);
      })
      .catch(() => setError(true));
  }, []);

  useEffect(() => {
    load();
    const interval = setInterval(() => {
      setItems((prev) => {
        if (prev?.some((s) => s.status === "PENDING" || s.status === "CRAWLING")) load();
        return prev;
      });
    }, 3000);
    return () => clearInterval(interval);
  }, [load]);

  async function addWebsite(e: React.FormEvent) {
    e.preventDefault();
    if (!url.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/websites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url.trim() }),
      });
      const json = await res.json();
      if (!json.ok) {
        toast.error(json.error);
        return;
      }
      toast.success("Website added — crawling started");
      setUrl("");
      load();
    } finally {
      setSubmitting(false);
    }
  }

  async function remove(id: string) {
    const res = await fetch(`/api/websites/${id}`, { method: "DELETE" });
    const json = await res.json();
    if (json.ok) {
      toast.success("Website removed");
      setItems((prev) => prev?.filter((s) => s.id !== id) ?? null);
    } else toast.error(json.error);
  }

  async function retry(id: string) {
    const res = await fetch(`/api/websites/${id}`, { method: "POST" });
    const json = await res.json();
    if (json.ok) {
      toast.success("Recrawl started");
      load();
    } else toast.error(json.error);
  }

  return (
    <div className="space-y-5">
      <form onSubmit={addWebsite} className="flex flex-col gap-2 sm:flex-row">
        <Input placeholder="https://example.com/help" value={url} onChange={(e) => setUrl(e.target.value)} />
        <Button type="submit" disabled={submitting}>
          {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
          Add website
        </Button>
      </form>

      {error ? (
        <ErrorState message="Couldn't load website sources." onRetry={load} />
      ) : items === null ? (
        <div className="space-y-3">
          {Array.from({ length: 2 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full rounded-xl" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <EmptyState icon={<Globe className="h-5 w-5" />} title="No websites connected" description="Add a URL above to crawl and index your site's content." />
      ) : (
        <div className="space-y-2.5">
          {items.map((site) => {
            const meta = STATUS_META[site.status];
            return (
              <Card key={site.id} className="flex items-center justify-between gap-3 p-4">
                <div className="flex min-w-0 items-center gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                    <Globe className="h-4.5 w-4.5" />
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{site.url}</p>
                    <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted-foreground">
                      <span>Added {formatRelativeTime(site.createdAt)}</span>
                      {site.status === "PROCESSED" && (
                        <>
                          <span>·</span>
                          <span>{site.chunkCount} chunks</span>
                        </>
                      )}
                    </div>
                    {site.status === "FAILED" && site.errorMessage && <p className="mt-1 text-xs text-destructive">{site.errorMessage}</p>}
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <Badge variant="outline" className={meta.className}>
                    {meta.icon} {meta.label}
                  </Badge>
                  {site.status === "FAILED" && (
                    <Button variant="ghost" size="icon" onClick={() => retry(site.id)} aria-label="Retry crawl">
                      <RotateCw className="h-4 w-4 text-muted-foreground" />
                    </Button>
                  )}
                  <Button variant="ghost" size="icon" onClick={() => remove(site.id)} aria-label="Remove website">
                    <Trash2 className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
