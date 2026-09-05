import { TicketsTable } from "@/components/dashboard/tickets/tickets-table";

export default function TicketsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Tickets</h1>
        <p className="mt-1 text-sm text-muted-foreground">Support tickets created automatically from escalated conversations.</p>
      </div>
      <TicketsTable />
    </div>
  );
}
