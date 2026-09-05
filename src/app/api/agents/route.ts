import { prisma } from "@/lib/db/prisma";
import { requireWorkspaceContext } from "@/lib/api/guard";
import { apiSuccess } from "@/lib/api/response";

export async function GET() {
  const { ctx, response } = await requireWorkspaceContext();
  if (!ctx) return response;

  const agents = await prisma.agent.findMany({
    where: { workspaceId: ctx.workspace.id },
    orderBy: { createdAt: "asc" },
  });
  return apiSuccess(agents);
}
