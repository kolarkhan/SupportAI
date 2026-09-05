import { NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireWorkspaceContext, canWrite } from "@/lib/api/guard";
import { apiSuccess, apiError, handleApiError } from "@/lib/api/response";
import { z } from "zod";

const schema = z.object({
  subject: z.string().trim().min(2).max(200).optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).optional(),
});

/**
 * Human-handoff pipeline (spec §11): AI -> low confidence / escalation ->
 * conversation flips to HUMAN_REQUIRED -> a support ticket is created ->
 * (in production) the assigned team is notified.
 */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { ctx, response } = await requireWorkspaceContext();
    if (!ctx) return response;
    if (!canWrite(ctx.role)) return apiError("You don't have permission to escalate conversations.", 403);

    const { id } = await params;
    const conversation = await prisma.conversation.findFirst({
      where: { id, workspaceId: ctx.workspace.id },
      include: { customer: true, ticket: true, messages: { orderBy: { createdAt: "desc" }, take: 1 } },
    });
    if (!conversation) return apiError("Conversation not found", 404);

    const body = schema.parse(await req.json().catch(() => ({})));

    const [updated, ticket] = await prisma.$transaction(async (tx) => {
      const updatedConv = await tx.conversation.update({
        where: { id },
        data: { status: "HUMAN_REQUIRED" },
      });

      let ticket = conversation.ticket;
      if (!ticket) {
        const count = await tx.ticket.count({ where: { workspaceId: ctx.workspace.id } });
        ticket = await tx.ticket.create({
          data: {
            workspaceId: ctx.workspace.id,
            number: count + 1001,
            subject: body.subject || conversation.messages[0]?.content?.slice(0, 80) || "Escalated conversation",
            priority: body.priority || "MEDIUM",
            status: "OPEN",
            customerId: conversation.customerId,
            conversationId: conversation.id,
          },
        });
      }

      await tx.notification.create({
        data: {
          workspaceId: ctx.workspace.id,
          type: "escalation",
          title: "Conversation needs human attention",
          body: `${conversation.customer.name} needs help — AI handed off this conversation.`,
          href: `/dashboard/conversations/${conversation.id}`,
        },
      });

      await tx.analyticsEvent.create({
        data: { workspaceId: ctx.workspace.id, type: "escalated", metadata: JSON.stringify({ conversationId: id }) },
      });

      return [updatedConv, ticket];
    });

    return apiSuccess({ conversation: updated, ticket });
  } catch (err) {
    return handleApiError(err);
  }
}
