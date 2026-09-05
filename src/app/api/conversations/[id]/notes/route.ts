import { NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireWorkspaceContext, canWrite } from "@/lib/api/guard";
import { apiSuccess, apiError, handleApiError } from "@/lib/api/response";
import { z } from "zod";

const schema = z.object({ content: z.string().trim().min(1).max(2000) });

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { ctx, response } = await requireWorkspaceContext();
    if (!ctx) return response;
    if (!canWrite(ctx.role)) return apiError("You don't have permission to add notes.", 403);

    const { id } = await params;
    const conversation = await prisma.conversation.findFirst({ where: { id, workspaceId: ctx.workspace.id } });
    if (!conversation) return apiError("Conversation not found", 404);

    const { content } = schema.parse(await req.json());
    const note = await prisma.internalNote.create({
      data: { conversationId: id, authorId: ctx.user.id, content },
      include: { author: { select: { name: true } } },
    });

    return apiSuccess(note, 201);
  } catch (err) {
    return handleApiError(err);
  }
}
