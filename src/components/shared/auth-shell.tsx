import Link from "next/link";
import { Bot, Star } from "lucide-react";

export function AuthShell({ title, subtitle, children, footer }: { title: string; subtitle: string; children: React.ReactNode; footer: React.ReactNode }) {
  return (
    <div className="grid min-h-screen grid-cols-1 lg:grid-cols-2">
      <div className="flex flex-col justify-center px-6 py-12 sm:px-12 lg:px-20">
        <Link href="/" className="mb-10 flex items-center gap-2 font-semibold tracking-[-0.01em]">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-soft-sm">
            <Bot className="h-4.5 w-4.5" />
          </span>
          SupportAI
        </Link>
        <div className="mx-auto w-full max-w-sm animate-fade-in-up">
          <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
          <p className="mt-1.5 text-sm text-muted-foreground">{subtitle}</p>
          <div className="mt-8">{children}</div>
          <div className="mt-6 text-center text-sm text-muted-foreground">{footer}</div>
        </div>
      </div>
      <div className="relative hidden overflow-hidden bg-primary lg:block">
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(70% 60% at 20% 15%, hsl(var(--primary-foreground)/0.18), transparent), radial-gradient(60% 50% at 90% 90%, hsl(var(--primary-foreground)/0.12), transparent)",
          }}
        />
        <div
          className="absolute inset-0 opacity-[0.07]"
          style={{ backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 0)", backgroundSize: "26px 26px" }}
        />
        <div className="relative flex h-full flex-col items-center justify-center p-16 text-center text-primary-foreground">
          <div className="flex gap-0.5 text-primary-foreground/90">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star key={i} className="h-4 w-4 fill-current" />
            ))}
          </div>
          <p className="mt-5 text-3xl font-semibold leading-tight text-balance">"SupportAI cut our average response time from hours to seconds."</p>
          <p className="mt-6 text-sm text-primary-foreground/80">Priya Anand — Head of Support, Northwind Retail</p>
        </div>
      </div>
    </div>
  );
}
