"use client";

import { useEffect } from "react";
import { AlertTriangle, RotateCw } from "lucide-react";
import { Button } from "@/components/ui/button";

// A route-segment error boundary. Next.js nests this inside the root
// layout's <html>/<body> (which already carries the Geist font variables and
// design tokens) — it must NOT render its own <html>/<body>, that's reserved
// for global-error.tsx, which replaces the root layout itself.
export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    // eslint-disable-next-line no-console
    console.error(error);
  }, [error]);

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center gap-4 overflow-hidden px-4 text-center">
      <div
        className="pointer-events-none absolute inset-0 -z-10"
        style={{ background: "radial-gradient(50% 50% at 50% 40%, hsl(var(--destructive)/0.06), transparent 70%)" }}
      />
      <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-destructive/10 text-destructive shadow-soft-sm">
        <AlertTriangle className="h-7 w-7" />
      </span>
      <h1 className="text-2xl font-semibold tracking-tight">Something went wrong</h1>
      <p className="max-w-sm text-sm text-muted-foreground">An unexpected error occurred. You can try again, or come back in a moment.</p>
      <Button onClick={reset} className="mt-2">
        <RotateCw className="h-4 w-4" /> Try again
      </Button>
    </div>
  );
}
