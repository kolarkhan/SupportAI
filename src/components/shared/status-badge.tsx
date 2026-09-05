import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const CONVERSATION_STATUS: Record<string, { label: string; className: string }> = {
  OPEN: { label: "Open", className: "bg-sky-500/10 text-sky-600 border-sky-500/20 dark:text-sky-400" },
  AI_HANDLING: { label: "AI Handling", className: "bg-primary/10 text-primary border-primary/20" },
  WAITING: { label: "Waiting", className: "bg-warning/10 text-warning border-warning/20" },
  HUMAN_REQUIRED: { label: "Human Required", className: "bg-destructive/10 text-destructive border-destructive/20" },
  RESOLVED: { label: "Resolved", className: "bg-success/10 text-success border-success/20" },
};

const TICKET_STATUS: Record<string, { label: string; className: string }> = {
  OPEN: { label: "Open", className: "bg-sky-500/10 text-sky-600 border-sky-500/20 dark:text-sky-400" },
  IN_PROGRESS: { label: "In Progress", className: "bg-primary/10 text-primary border-primary/20" },
  WAITING: { label: "Waiting", className: "bg-warning/10 text-warning border-warning/20" },
  RESOLVED: { label: "Resolved", className: "bg-success/10 text-success border-success/20" },
  CLOSED: { label: "Closed", className: "bg-muted text-muted-foreground border-border" },
};

const PRIORITY: Record<string, { label: string; className: string }> = {
  LOW: { label: "Low", className: "bg-muted text-muted-foreground border-border" },
  MEDIUM: { label: "Medium", className: "bg-sky-500/10 text-sky-600 border-sky-500/20 dark:text-sky-400" },
  HIGH: { label: "High", className: "bg-warning/10 text-warning border-warning/20" },
  URGENT: { label: "Urgent", className: "bg-destructive/10 text-destructive border-destructive/20" },
};

export function ConversationStatusBadge({ status }: { status: string }) {
  const s = CONVERSATION_STATUS[status] ?? CONVERSATION_STATUS.OPEN;
  return <Badge variant="outline" className={cn("font-medium", s.className)}>{s.label}</Badge>;
}

export function TicketStatusBadge({ status }: { status: string }) {
  const s = TICKET_STATUS[status] ?? TICKET_STATUS.OPEN;
  return <Badge variant="outline" className={cn("font-medium", s.className)}>{s.label}</Badge>;
}

export function PriorityBadge({ priority }: { priority: string }) {
  const s = PRIORITY[priority] ?? PRIORITY.MEDIUM;
  return <Badge variant="outline" className={cn("font-medium", s.className)}>{s.label}</Badge>;
}
