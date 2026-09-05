import Link from "next/link";
import { MessageSquare, Sparkles, Clock, Smile, ArrowRight } from "lucide-react";
import { requireUser } from "@/lib/auth/current-user";
import { prisma } from "@/lib/db/prisma";
import { getAnalyticsSummary } from "@/lib/analytics/get-summary";
import { StatCard } from "@/components/dashboard/stat-card";
// recharts is a heavy dependency — this Server Component pulls the charts
// through a client-side lazy wrapper (charts-lazy.tsx) so recharts is
// excluded from this route's first-load JS entirely, instead of just being
// reorganized into a still-eagerly-loaded chunk.
import { ConversationsChart, ResolutionChart, TopQuestionsChart } from "@/components/dashboard/charts-lazy";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ConversationStatusBadge } from "@/components/shared/status-badge";
import { EmptyState } from "@/components/shared/empty-state";
import { initials, formatRelativeTime, formatPercent, truncate } from "@/lib/utils";

export default async function DashboardOverviewPage() {
  const { workspace, user } = await requireUser();

  const [summary, recentConversations, documentCount, agent] = await Promise.all([
    getAnalyticsSummary(workspace.id, "30d"),
    prisma.conversation.findMany({
      where: { workspaceId: workspace.id },
      include: { customer: true, messages: { orderBy: { createdAt: "desc" }, take: 1 } },
      orderBy: { lastMessageAt: "desc" },
      take: 6,
    }),
    prisma.document.count({ where: { workspaceId: workspace.id, storagePath: null } }),
    prisma.agent.findFirst({ where: { workspaceId: workspace.id } }),
  ]);

  const { metrics, series, topQuestions } = summary;

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Welcome back, {user.name.split(" ")[0]}</h1>
          <p className="mt-1 text-sm text-muted-foreground">Here's how {agent?.name || "your agent"} performed over the last 30 days.</p>
        </div>
        <Button asChild>
          <Link href="/dashboard/agent">
            <Sparkles className="h-4 w-4" /> Configure agent
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total Conversations" value={metrics.totalConversations.toLocaleString()} delta="+18.4%" icon={<MessageSquare className="h-4 w-4" />} />
        <StatCard label="AI Resolution Rate" value={formatPercent(metrics.aiResolutionRate)} delta="+6.2%" icon={<Sparkles className="h-4 w-4" />} />
        <StatCard label="Avg Response Time" value={`${metrics.avgResponseTimeSec}s`} delta="-24%" icon={<Clock className="h-4 w-4" />} />
        <StatCard label="Customer Satisfaction" value={formatPercent(metrics.csat)} delta="+3.8%" icon={<Smile className="h-4 w-4" />} />
      </div>

      {documentCount === 0 && (
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="flex flex-col items-start justify-between gap-4 p-5 sm:flex-row sm:items-center">
            <div>
              <p className="font-medium">Your knowledge base is empty</p>
              <p className="mt-1 text-sm text-muted-foreground">Upload documents or connect your website so {agent?.name || "your agent"} can start answering questions.</p>
            </div>
            <Button asChild>
              <Link href="/dashboard/knowledge">
                Add Knowledge <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <ConversationsChart data={series} />
        <ResolutionChart data={series} />
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <TopQuestionsChart data={topQuestions} />
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle>Recent conversations</CardTitle>
            <Link href="/dashboard/conversations" className="text-xs font-medium text-primary hover:underline">
              View all
            </Link>
          </CardHeader>
          <CardContent>
            {recentConversations.length === 0 ? (
              <EmptyState
                title="No conversations yet"
                description="Once customers start chatting with your agent, conversations will show up here."
              />
            ) : (
              <div className="divide-y divide-border">
                {recentConversations.map((c) => (
                  <Link
                    key={c.id}
                    href={`/dashboard/conversations/${c.id}`}
                    className="flex items-center gap-3 py-3 first:pt-0 last:pb-0 hover:opacity-80"
                  >
                    <Avatar className="h-9 w-9">
                      <AvatarFallback style={{ backgroundColor: c.customer.avatarColor, color: "white" }}>{initials(c.customer.name)}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="truncate text-sm font-medium">{c.customer.name}</p>
                        <span className="shrink-0 text-xs text-muted-foreground">{formatRelativeTime(c.lastMessageAt)}</span>
                      </div>
                      <p className="truncate text-xs text-muted-foreground">{truncate(c.messages[0]?.content || "No messages yet", 60)}</p>
                    </div>
                    <ConversationStatusBadge status={c.status} />
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
