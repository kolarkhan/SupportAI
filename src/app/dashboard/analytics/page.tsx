"use client";

import { useCallback, useEffect, useState } from "react";
import { MessageSquare, Sparkles, Clock, Smile, Users, Timer } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StatCard } from "@/components/dashboard/stat-card";
import {
  ConversationsChart, ResolutionChart, TopQuestionsChart, EscalationPie, SatisfactionTrend,
} from "@/components/dashboard/charts-lazy";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/shared/error-state";
import { formatPercent } from "@/lib/utils";
import type { AnalyticsSummary } from "@/lib/analytics/get-summary";

const RANGES = [
  { value: "today", label: "Today" },
  { value: "7d", label: "7 days" },
  { value: "30d", label: "30 days" },
  { value: "90d", label: "90 days" },
];

export default function AnalyticsPage() {
  const [range, setRange] = useState("30d");
  const [data, setData] = useState<AnalyticsSummary | null>(null);
  const [error, setError] = useState(false);

  const load = useCallback(() => {
    setError(false);
    fetch(`/api/analytics?range=${range}`)
      .then((r) => r.json())
      .then((json) => {
        if (!json.ok) throw new Error();
        setData(json.data);
      })
      .catch(() => setError(true));
  }, [range]);

  useEffect(load, [load]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Analytics</h1>
          <p className="mt-1 text-sm text-muted-foreground">Deep-dive into how your agent is performing.</p>
        </div>
        <Tabs value={range} onValueChange={setRange}>
          <TabsList>
            {RANGES.map((r) => (
              <TabsTrigger key={r.value} value={r.value} className="text-xs">{r.label}</TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      {error ? (
        <ErrorState message="Couldn't load analytics." onRetry={load} />
      ) : !data ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28 w-full rounded-xl" />
          ))}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Total Conversations" value={data.metrics.totalConversations.toLocaleString()} icon={<MessageSquare className="h-4 w-4" />} />
            <StatCard label="AI Resolution Rate" value={formatPercent(data.metrics.aiResolutionRate)} icon={<Sparkles className="h-4 w-4" />} />
            <StatCard label="Human Handoff Rate" value={formatPercent(data.metrics.handoffRate)} icon={<Users className="h-4 w-4" />} />
            <StatCard label="Avg Response Time" value={`${data.metrics.avgResponseTimeSec}s`} icon={<Clock className="h-4 w-4" />} />
            <StatCard label="Avg Resolution Time" value={`${data.metrics.avgResolutionTimeMin}m`} icon={<Timer className="h-4 w-4" />} />
            <StatCard label="Customer Satisfaction" value={formatPercent(data.metrics.csat)} icon={<Smile className="h-4 w-4" />} />
            <StatCard label="Messages / Conversation" value={data.metrics.avgMessagesPerConversation.toFixed(1)} icon={<MessageSquare className="h-4 w-4" />} />
            <StatCard label="Open Tickets" value={String(data.metrics.openTickets)} icon={<Users className="h-4 w-4" />} />
          </div>

          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
            <ConversationsChart data={data.series} />
            <ResolutionChart data={data.series} />
          </div>
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
            <TopQuestionsChart data={data.topQuestions} />
            <EscalationPie data={data.escalationReasons} />
          </div>
          <SatisfactionTrend data={data.series} />
        </>
      )}
    </div>
  );
}
