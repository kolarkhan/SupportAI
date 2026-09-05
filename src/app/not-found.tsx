import Link from "next/link";
import { Bot, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center gap-4 overflow-hidden px-4 text-center">
      <div
        className="pointer-events-none absolute inset-0 -z-10"
        style={{ background: "radial-gradient(50% 50% at 50% 40%, hsl(var(--primary)/0.08), transparent 70%)" }}
      />
      <p className="font-mono text-sm font-medium tracking-[0.2em] text-muted-foreground">404</p>
      <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary shadow-soft-sm">
        <Bot className="h-7 w-7" />
      </span>
      <h1 className="text-3xl font-semibold tracking-tight">Page not found</h1>
      <p className="max-w-sm text-sm text-muted-foreground">The page you're looking for doesn't exist or may have been moved.</p>
      <Button asChild className="mt-2">
        <Link href="/">
          <ArrowLeft className="h-4 w-4" /> Back to home
        </Link>
      </Button>
    </div>
  );
}
