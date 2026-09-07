"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { toast } from "sonner";
import {
  LayoutDashboard, MessageSquare, Bot, Ticket, BarChart3, Users,
  Settings, HelpCircle, X, LogOut, ChevronsUpDown,
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn, initials } from "@/lib/utils";

interface SidebarUser {
  name: string;
  email: string;
  avatarColor: string;
}

const primaryNav = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/conversations", label: "Conversations", icon: MessageSquare },
  { href: "/dashboard/agent", label: "AI Agent", icon: Bot },
  { href: "/dashboard/tickets", label: "Tickets", icon: Ticket },
  { href: "/dashboard/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/dashboard/team", label: "Team", icon: Users },
];

const secondaryNav = [
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
  { href: "#", label: "Help & Support", icon: HelpCircle },
];

function NavLink({
  item,
  isActive,
  onNavigate,
  layoutScope,
}: {
  item: (typeof primaryNav)[number];
  isActive: boolean;
  onNavigate?: () => void;
  layoutScope: string;
}) {
  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      className={cn(
        "group relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium outline-none transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        isActive ? "text-primary" : "text-muted-foreground hover:bg-accent hover:text-foreground"
      )}
    >
      {isActive && (
        <motion.span
          layoutId={`${layoutScope}-active`}
          transition={{ type: "spring", stiffness: 500, damping: 40 }}
          className="absolute inset-0 rounded-lg bg-primary/10"
        />
      )}
      {isActive && <span className="absolute left-0 top-1/2 h-4 w-0.5 -translate-y-1/2 rounded-full bg-primary" />}
      <item.icon className={cn("relative h-4 w-4 shrink-0 transition-transform duration-150", !isActive && "group-hover:scale-110")} />
      <span className="relative">{item.label}</span>
    </Link>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <p className="px-3 pb-1.5 pt-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60">{children}</p>;
}

/**
 * Account footer pinned to the bottom of the nav rail — the sidebar's own
 * quick-access identity/logout, independent of the topbar's avatar menu
 * (which stays for when the sidebar itself is off-screen, e.g. narrow
 * viewports). Opens upward (`side="top"`) since it sits at the bottom edge.
 */
function AccountFooter({ user }: { user: SidebarUser }) {
  const router = useRouter();

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    toast.success("Logged out");
    router.push("/login");
    router.refresh();
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="group flex w-full items-center gap-2.5 rounded-lg px-2 py-2 text-left outline-none transition-colors duration-150 hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background">
        <Avatar className="h-8 w-8 shrink-0">
          <AvatarFallback style={{ backgroundColor: user.avatarColor, color: "white" }}>{initials(user.name)}</AvatarFallback>
        </Avatar>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-medium leading-tight">{user.name}</span>
          <span className="block truncate text-xs text-muted-foreground">{user.email}</span>
        </span>
        <ChevronsUpDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground/60 transition-colors group-hover:text-muted-foreground" />
      </DropdownMenuTrigger>
      <DropdownMenuContent side="top" align="end" className="w-56">
        <DropdownMenuLabel>
          <p className="font-medium">{user.name}</p>
          <p className="text-xs font-normal text-muted-foreground">{user.email}</p>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/dashboard/settings">
            <Settings className="h-4 w-4" /> Settings
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={logout} className="text-destructive focus:text-destructive">
          <LogOut className="h-4 w-4" /> Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// `scope` namespaces the framer-motion layoutId so the always-mounted desktop
// rail and the conditionally-mounted mobile drawer never share one — sharing
// would make the active-pill animate from the hidden instance's stale box.
export function SidebarNav({ onNavigate, scope = "sidebar-desktop", user }: { onNavigate?: () => void; scope?: string; user?: SidebarUser }) {
  const pathname = usePathname();

  const isActive = (href: string) => (href === "/dashboard" ? pathname === href : pathname.startsWith(href));

  return (
    <nav className="flex min-h-0 flex-1 flex-col">
      <div className="min-h-0 flex-1 overflow-y-auto px-3 py-4">
        <SectionLabel>Menu</SectionLabel>
        <div className="space-y-0.5">
          {primaryNav.map((item) => (
            <NavLink key={item.href} item={item} isActive={isActive(item.href)} onNavigate={onNavigate} layoutScope={scope} />
          ))}
        </div>
      </div>
      <div className="shrink-0 space-y-0.5 border-t border-border px-3 py-3">
        {secondaryNav.map((item) => (
          <NavLink key={item.label} item={item} isActive={isActive(item.href)} onNavigate={onNavigate} layoutScope={scope} />
        ))}
      </div>
      {user && (
        <div className="shrink-0 border-t border-border p-3">
          <AccountFooter user={user} />
        </div>
      )}
    </nav>
  );
}

export function MobileSidebar({ open, onClose, user }: { open: boolean; onClose: () => void; user?: SidebarUser }) {
  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Navigation menu">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 bg-black/50 backdrop-blur-[2px]"
            onClick={onClose}
          />
          <motion.div
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", stiffness: 380, damping: 38 }}
            className="absolute inset-y-0 left-0 flex w-72 flex-col bg-background shadow-soft-lg"
          >
            <div className="flex h-16 shrink-0 items-center justify-between border-b border-border px-4">
              <span className="flex items-center gap-2 font-semibold tracking-[-0.01em]">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                  <Bot className="h-4 w-4" />
                </span>
                SupportAI
              </span>
              <button
                onClick={onClose}
                aria-label="Close menu"
                className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <SidebarNav onNavigate={onClose} scope="sidebar-mobile" user={user} />
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
