import { NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireWorkspaceContext, canWrite } from "@/lib/api/guard";
import { apiSuccess, apiError, handleApiError } from "@/lib/api/response";
import { z } from "zod";

async function getOwnedConversation(workspaceId: string, id: string) {
  return prisma.conversation.findFirst({ where: { id, workspaceId } });
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { ctx, response } = await requireWorkspaceContext();
  if (!ctx) return response;
  const { id } = await params;

  const conversation = await prisma.conversation.findFirst({
    where: { id, workspaceId: ctx.workspace.id },
    include: {
      customer: true,
      agent: true,
      assignee: { select: { id: true, name: true, avatarColor: true } },
      messages: { orderBy: { createdAt: "asc" } },
      internalNotes: { include: { author: { select: { name: true } } }, orderBy: { createdAt: "asc" } },
      ticket: true,
    },
  });
  if (!conversation) return apiError("Conversation not found", 404);
  return apiSuccess(conversation);
}

const patchSchema = z.object({
  status: z.enum(["OPEN", "AI_HANDLING", "WAITING", "HUMAN_REQUIRED", "RESOLVED"]).optional(),
  assigneeId: z.string().nullable().optional(),
  satisfaction: z.number().min(1).max(5).optional(),
});

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { ctx, response } = await requireWorkspaceContext();
    if (!ctx) return response;
    if (!canWrite(ctx.role)) return apiError("You don't have permission to update conversations.", 403);

    const { id } = await params;
    const existing = await getOwnedConversation(ctx.workspace.id, id);
    if (!existing) return apiError("Conversation not found", 404);

    const body = patchSchema.parse(await req.json());
    const conversation = await prisma.conversation.update({ where: { id }, data: body });

    if (body.status) {
      await prisma.analyticsEvent.create({
        data: {
          workspaceId: ctx.workspace.id,
          type: body.status === "RESOLVED" ? "human_resolved" : "status_change",
          metadata: JSON.stringify({ conversationId: id, status: body.status }),
        },
      });
    }

    return apiSuccess(conversation);
  } catch (err) {
    return handleApiError(err);
  }
}
