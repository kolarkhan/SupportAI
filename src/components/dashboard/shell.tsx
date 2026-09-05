"use client";

import { useState } from "react";
import { Bot } from "lucide-react";
import { SidebarNav, MobileSidebar } from "./sidebar";
import { Topbar } from "./topbar";

export function DashboardShell({
  user,
  workspace,
  children,
}: {
  user: { name: string; email: string; avatarColor: string };
  workspace: { name: string; plan: string };
  children: React.ReactNode;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-muted/25">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-primary focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-primary-foreground focus:shadow-soft-lg"
      >
        Skip to content
      </a>
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-border bg-background lg:flex">
        <div className="flex h-16 shrink-0 items-center gap-2.5 border-b border-border px-5 font-semibold tracking-[-0.01em]">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-soft-sm">
            <Bot className="h-4.5 w-4.5" />
          </span>
          SupportAI
        </div>
        <SidebarNav user={user} />
      </aside>

      <MobileSidebar open={mobileOpen} onClose={() => setMobileOpen(false)} user={user} />

      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar user={user} workspace={workspace} onMenuClick={() => setMobileOpen(true)} />
        <main id="main-content" className="flex-1 p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
