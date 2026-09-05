import { NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireWorkspaceContext, canWrite } from "@/lib/api/guard";
import { apiSuccess, apiError, handleApiError } from "@/lib/api/response";
import { z } from "zod";

const schema = z.object({
  conversationId: z.string().min(1),
  content: z.string().trim().min(1).max(4000),
});

/** Human agent sends a message while they have taken over a conversation. */
export async function POST(req: NextRequest) {
  try {
    const { ctx, response } = await requireWorkspaceContext();
    if (!ctx) return response;
    if (!canWrite(ctx.role)) return apiError("You don't have permission to reply to customers.", 403);

    const body = schema.parse(await req.json());
    const conversation = await prisma.conversation.findFirst({
      where: { id: body.conversationId, workspaceId: ctx.workspace.id },
    });
    if (!conversation) return apiError("Conversation not found", 404);

    const [message] = await prisma.$transaction([
      prisma.message.create({
        data: { conversationId: conversation.id, role: "HUMAN", content: body.content },
      }),
      prisma.conversation.update({
        where: { id: conversation.id },
        data: { lastMessageAt: new Date(), status: "WAITING", assigneeId: ctx.user.id },
      }),
    ]);

    return apiSuccess(message, 201);
  } catch (err) {
    return handleApiError(err);
  }
}
