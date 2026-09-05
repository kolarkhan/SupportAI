"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { FileText, Upload, Trash2, Loader2, CheckCircle2, XCircle, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { formatRelativeTime } from "@/lib/utils";

interface DocumentItem {
  id: string;
  name: string;
  type: string;
  status: "PENDING" | "PROCESSING" | "PROCESSED" | "FAILED";
  chunkCount: number;
  fileSize: number;
  errorMessage: string | null;
  createdAt: string;
}

const STATUS_META: Record<string, { label: string; icon: React.ReactNode; className: string }> = {
  PENDING: { label: "Queued", icon: <Clock className="h-3 w-3" />, className: "text-muted-foreground border-border" },
  PROCESSING: { label: "Processing…", icon: <Loader2 className="h-3 w-3 animate-spin" />, className: "text-primary border-primary/30 bg-primary/5" },
  PROCESSED: { label: "Processed", icon: <CheckCircle2 className="h-3 w-3" />, className: "text-success border-success/30 bg-success/5" },
  FAILED: { label: "Failed", icon: <XCircle className="h-3 w-3" />, className: "text-destructive border-destructive/30 bg-destructive/5" },
};

export function DocumentsPanel() {
  const [items, setItems] = useState<DocumentItem[] | null>(null);
  const [error, setError] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<DocumentItem | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const load = useCallback(() => {
    setError(false);
    fetch("/api/documents")
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
      // Poll while anything is still processing so the UI reflects pipeline progress.
      setItems((prev) => {
        if (prev?.some((d) => d.status === "PENDING" || d.status === "PROCESSING")) load();
        return prev;
      });
    }, 3000);
    return () => clearInterval(interval);
  }, [load]);

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        const formData = new FormData();
        formData.append("file", file);
        const res = await fetch("/api/documents", { method: "POST", body: formData });
        const json = await res.json();
        if (!json.ok) {
          toast.error(`${file.name}: ${json.error}`);
        } else {
          toast.success(`${file.name} uploaded — processing started`);
        }
      }
      load();
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    const res = await fetch(`/api/documents/${deleteTarget.id}`, { method: "DELETE" });
    const json = await res.json();
    if (json.ok) {
      toast.success("Document removed");
      setItems((prev) => prev?.filter((d) => d.id !== deleteTarget.id) ?? null);
    } else toast.error(json.error);
    setDeleteTarget(null);
  }

  return (
    <div className="space-y-5">
      <div
        className="group flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-border p-8 text-center transition-all duration-200 hover:border-primary/40 hover:bg-primary/[0.02]"
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          handleFiles(e.dataTransfer.files);
        }}
      >
        <span className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/10 text-primary transition-transform duration-200 group-hover:scale-110">
          {uploading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Upload className="h-5 w-5" />}
        </span>
        <div>
          <p className="text-sm font-medium">Drag & drop files, or click to browse</p>
          <p className="mt-1 text-xs text-muted-foreground">PDF, DOCX, TXT, CSV — up to 15MB each</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => inputRef.current?.click()} disabled={uploading}>
          Choose files
        </Button>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept=".pdf,.docx,.txt,.csv"
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
      </div>

      {error ? (
        <ErrorState message="Couldn't load documents." onRetry={load} />
      ) : items === null ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full rounded-xl" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          icon={<FileText className="h-5 w-5" />}
          title="Your knowledge base is empty"
          description="Upload documents or connect your website to train your AI agent."
        />
      ) : (
        <div className="space-y-2.5">
          {items.map((doc) => {
            const meta = STATUS_META[doc.status];
            return (
              <Card key={doc.id} className="flex items-center justify-between gap-3 p-4">
                <div className="flex min-w-0 items-center gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                    <FileText className="h-4.5 w-4.5" />
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{doc.name}</p>
                    <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted-foreground">
                      <span>{doc.type}</span>
                      <span>·</span>
                      <span>{formatRelativeTime(doc.createdAt)}</span>
                      {doc.status === "PROCESSED" && (
                        <>
                          <span>·</span>
                          <span>{doc.chunkCount} chunks</span>
                        </>
                      )}
                    </div>
                    {doc.status === "FAILED" && doc.errorMessage && <p className="mt-1 text-xs text-destructive">{doc.errorMessage}</p>}
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <Badge variant="outline" className={meta.className}>
                    {meta.icon} {meta.label}
                  </Badge>
                  <Button variant="ghost" size="icon" onClick={() => setDeleteTarget(doc)} aria-label="Delete document">
                    <Trash2 className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete "{deleteTarget?.name}"?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            This removes the document and all {deleteTarget?.chunkCount ?? 0} indexed chunks from your agent's knowledge base. This can't be undone.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>Cancel</Button>
            <Button variant="destructive" onClick={confirmDelete}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
