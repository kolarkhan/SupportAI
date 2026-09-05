import { NextRequest } from "next/server";
import { requireWorkspaceContext } from "@/lib/api/guard";
import { apiSuccess } from "@/lib/api/response";
import { getAnalyticsSummary, type AnalyticsRange } from "@/lib/analytics/get-summary";

export async function GET(req: NextRequest) {
  const { ctx, response } = await requireWorkspaceContext();
  if (!ctx) return response;

  const { searchParams } = new URL(req.url);
  const range = (searchParams.get("range") as AnalyticsRange) || "30d";

  const summary = await getAnalyticsSummary(ctx.workspace.id, range);
  return apiSuccess(summary);
}
