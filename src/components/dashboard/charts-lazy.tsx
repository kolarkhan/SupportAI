"use client";

// A client-side lazy-loading wrapper around the recharts-based chart
// components. This file exists so Server Components (like the dashboard
// overview page) can defer loading recharts until after the initial page
// paint instead of shipping it in the route's first-load bundle — a
// Server Component can't pass `ssr: false` to next/dynamic itself (that's
// only allowed inside a Client Component), so this thin boundary is what
// makes that possible.
import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";

const chartLoading = <Skeleton className="h-64 w-full rounded-xl" />;

export const ConversationsChart = dynamic(() => import("./charts").then((m) => m.ConversationsChart), {
  ssr: false,
  loading: () => chartLoading,
});
export const ResolutionChart = dynamic(() => import("./charts").then((m) => m.ResolutionChart), {
  ssr: false,
  loading: () => chartLoading,
});
export const TopQuestionsChart = dynamic(() => import("./charts").then((m) => m.TopQuestionsChart), {
  ssr: false,
  loading: () => chartLoading,
});
export const EscalationPie = dynamic(() => import("./charts").then((m) => m.EscalationPie), {
  ssr: false,
  loading: () => chartLoading,
});
export const SatisfactionTrend = dynamic(() => import("./charts").then((m) => m.SatisfactionTrend), {
  ssr: false,
  loading: () => chartLoading,
});
