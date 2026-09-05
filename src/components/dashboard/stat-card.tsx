import { cn } from "@/lib/utils";
import { ArrowDown, ArrowUp } from "lucide-react";
import { Card } from "@/components/ui/card";

export function StatCard({
  label,
  value,
  delta,
  icon,
}: {
  label: string;
  value: string;
  delta?: string;
  icon?: React.ReactNode;
}) {
  const positive = delta?.startsWith("+");
  const negativeIsGood = delta?.startsWith("-") && /response|time/i.test(label);
  const good = positive || negativeIsGood;

  return (
    <Card className="group p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-soft-md">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{label}</p>
        {icon && (
          <span className="flex h-7 w-7 items-center justify-center rounded-md bg-primary/8 text-primary/70 transition-colors group-hover:bg-primary/12 group-hover:text-primary">
            {icon}
          </span>
        )}
      </div>
      {/* Proportional figures at display size — tabular-nums is reserved for
          columns that must align vertically, not a standalone stat value. */}
      <p className="mt-2.5 text-[1.75rem] font-semibold leading-none tracking-tight">{value}</p>
      {delta && (
        <p className={cn("mt-2.5 flex items-center gap-1 text-xs font-medium", good ? "text-success" : "text-destructive")}>
          <span className={cn("flex h-4 w-4 items-center justify-center rounded-full", good ? "bg-success/10" : "bg-destructive/10")}>
            {delta.startsWith("+") ? <ArrowUp className="h-2.5 w-2.5" /> : <ArrowDown className="h-2.5 w-2.5" />}
          </span>
          {delta} <span className="font-normal text-muted-foreground">vs last period</span>
        </p>
      )}
    </Card>
  );
}
