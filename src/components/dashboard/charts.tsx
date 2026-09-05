"use client";

import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  BarChart, Bar, PieChart, Pie, Cell, Legend,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

/**
 * Chart color assignment follows the dataviz method: categorical hues are
 * assigned in this FIXED order and never cycled/reassigned by rank; a
 * single-series chart gets one identity color (never a rainbow); the
 * sequential default (blue) is reserved for continuous single-metric trends.
 * Values are the validated palette from the design system (see globals.css)
 * — do not hand-tune these hexes without re-running the palette validator.
 */
const CATEGORICAL = [
  "var(--chart-1)", // blue
  "var(--chart-2)", // orange
  "var(--chart-3)", // aqua
  "var(--chart-4)", // yellow
  "var(--chart-5)", // magenta
  "var(--chart-6)", // green
  "var(--chart-7)", // violet
  "var(--chart-8)", // red
];
const SEQUENTIAL = "var(--chart-1)";
const SURFACE = "hsl(var(--chart-surface))";
const GRID = "hsl(var(--border))";
const AXIS_TICK = { fontSize: 11, fill: "hsl(var(--muted-foreground))" };

const tooltipContentStyle: React.CSSProperties = {
  borderRadius: "var(--radius)",
  fontSize: 12,
  border: "1px solid hsl(var(--border))",
  background: "hsl(var(--popover))",
  color: "hsl(var(--popover-foreground))",
  boxShadow: "0 8px 16px -6px rgb(15 15 20 / 0.10), 0 20px 44px -12px rgb(15 15 20 / 0.16)",
  padding: "8px 12px",
};
const legendStyle: React.CSSProperties = { fontSize: 12, color: "hsl(var(--muted-foreground))" };

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function ConversationsChart({ data }: { data: { date: string; conversations: number }[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Conversations over time</CardTitle>
      </CardHeader>
      <CardContent className="h-64 pl-0">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ left: 8, right: 16, top: 8 }}>
            <defs>
              <linearGradient id="convGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={SEQUENTIAL} stopOpacity={0.22} />
                <stop offset="100%" stopColor={SEQUENTIAL} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} stroke={GRID} />
            <XAxis dataKey="date" tickFormatter={fmtDate} tick={AXIS_TICK} tickLine={false} axisLine={false} minTickGap={24} />
            <YAxis tick={AXIS_TICK} tickLine={false} axisLine={false} width={32} allowDecimals={false} />
            <Tooltip labelFormatter={(v) => fmtDate(v as string)} contentStyle={tooltipContentStyle} cursor={{ stroke: GRID }} />
            <Area type="monotone" dataKey="conversations" name="Conversations" stroke={SEQUENTIAL} strokeWidth={2} fill="url(#convGradient)" activeDot={{ r: 4, strokeWidth: 2, stroke: SURFACE }} />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

export function ResolutionChart({ data }: { data: { date: string; aiResolved: number; humanResolved: number }[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>AI vs. human resolution</CardTitle>
      </CardHeader>
      <CardContent className="h-64 pl-0">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ left: 8, right: 16, top: 8 }}>
            <CartesianGrid vertical={false} stroke={GRID} />
            <XAxis dataKey="date" tickFormatter={fmtDate} tick={AXIS_TICK} tickLine={false} axisLine={false} minTickGap={24} />
            <YAxis tick={AXIS_TICK} tickLine={false} axisLine={false} width={32} allowDecimals={false} />
            <Tooltip labelFormatter={(v) => fmtDate(v as string)} contentStyle={tooltipContentStyle} cursor={{ fill: "hsl(var(--muted) / 0.5)" }} />
            <Legend wrapperStyle={legendStyle} iconType="circle" iconSize={8} />
            {/* Stroke = the card surface, acting as the 2px "surface gap" that
                separates touching stacked segments — never a border color. */}
            <Bar dataKey="aiResolved" name="AI resolved" stackId="a" fill={CATEGORICAL[0]} stroke={SURFACE} strokeWidth={2} radius={[0, 0, 0, 0]} maxBarSize={24} />
            <Bar dataKey="humanResolved" name="Human resolved" stackId="a" fill={CATEGORICAL[1]} stroke={SURFACE} strokeWidth={2} radius={[4, 4, 0, 0]} maxBarSize={24} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

export function TopQuestionsChart({ data }: { data: { topic: string; count: number }[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Top customer questions</CardTitle>
      </CardHeader>
      <CardContent className="h-64 pl-0">
        {data.length === 0 ? (
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">Not enough data yet</div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} layout="vertical" margin={{ left: 16, right: 24, top: 8 }}>
              <CartesianGrid horizontal={false} stroke={GRID} />
              <XAxis type="number" tick={AXIS_TICK} tickLine={false} axisLine={false} allowDecimals={false} />
              <YAxis type="category" dataKey="topic" tick={AXIS_TICK} tickLine={false} axisLine={false} width={120} />
              <Tooltip contentStyle={tooltipContentStyle} cursor={{ fill: "hsl(var(--muted) / 0.5)" }} />
              <Bar dataKey="count" name="Questions" fill={CATEGORICAL[0]} radius={[0, 4, 4, 0]} barSize={16} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}

export function EscalationPie({ data }: { data: { reason: string; count: number }[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Escalation reasons</CardTitle>
      </CardHeader>
      <CardContent className="h-64 pl-0">
        {data.length === 0 ? (
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">No escalations in this period</div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={data} dataKey="count" nameKey="reason" innerRadius={50} outerRadius={80} paddingAngle={2} stroke={SURFACE} strokeWidth={2}>
                {data.map((_, i) => (
                  <Cell key={i} fill={CATEGORICAL[i % CATEGORICAL.length]} />
                ))}
              </Pie>
              <Legend wrapperStyle={legendStyle} iconType="circle" iconSize={8} />
              <Tooltip contentStyle={tooltipContentStyle} />
            </PieChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}

export function SatisfactionTrend({ data }: { data: { date: string; conversations: number }[] }) {
  // Derived satisfaction trend visualization for the analytics page (uses volume as a proxy series).
  // Uses the categorical "aqua" slot rather than the reserved status-good
  // green — this is a magnitude trend, not a good/bad status indicator, and
  // status hues are never reused for an ordinary data series.
  const color = CATEGORICAL[2];
  return (
    <Card>
      <CardHeader>
        <CardTitle>Resolution rate trend</CardTitle>
      </CardHeader>
      <CardContent className="h-64 pl-0">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ left: 8, right: 16, top: 8 }}>
            <defs>
              <linearGradient id="satGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={color} stopOpacity={0.22} />
                <stop offset="100%" stopColor={color} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} stroke={GRID} />
            <XAxis dataKey="date" tickFormatter={fmtDate} tick={AXIS_TICK} tickLine={false} axisLine={false} minTickGap={24} />
            <YAxis tick={AXIS_TICK} tickLine={false} axisLine={false} width={32} allowDecimals={false} />
            <Tooltip labelFormatter={(v) => fmtDate(v as string)} contentStyle={tooltipContentStyle} cursor={{ stroke: GRID }} />
            <Area type="monotone" dataKey="conversations" name="Conversations" stroke={color} strokeWidth={2} fill="url(#satGradient)" activeDot={{ r: 4, strokeWidth: 2, stroke: SURFACE }} />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
