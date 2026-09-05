import { NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireWorkspaceContext, canWrite } from "@/lib/api/guard";
import { apiSuccess, apiError, handleApiError } from "@/lib/api/response";
import { agentUpdateSchema } from "@/lib/validation/schemas";

async function getOwnedAgent(workspaceId: string, id: string) {
  const agent = await prisma.agent.findFirst({ where: { id, workspaceId } });
  return agent;
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { ctx, response } = await requireWorkspaceContext();
  if (!ctx) return response;
  const { id } = await params;

  const agent = await getOwnedAgent(ctx.workspace.id, id);
  if (!agent) return apiError("Agent not found", 404);
  return apiSuccess(agent);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { ctx, response } = await requireWorkspaceContext();
    if (!ctx) return response;
    if (!canWrite(ctx.role)) return apiError("You don't have permission to edit this agent.", 403);

    const { id } = await params;
    const existing = await getOwnedAgent(ctx.workspace.id, id);
    if (!existing) return apiError("Agent not found", 404);

    const body = agentUpdateSchema.parse(await req.json());
    const agent = await prisma.agent.update({ where: { id }, data: body });
    return apiSuccess(agent);
  } catch (err) {
    return handleApiError(err);
  }
}
