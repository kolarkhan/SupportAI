import { NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireWorkspaceContext, canWrite } from "@/lib/api/guard";
import { apiSuccess, apiError, handleApiError } from "@/lib/api/response";
import { ticketUpdateSchema } from "@/lib/validation/schemas";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { ctx, response } = await requireWorkspaceContext();
  if (!ctx) return response;
  const { id } = await params;
  const ticket = await prisma.ticket.findFirst({
    where: { id, workspaceId: ctx.workspace.id },
    include: { customer: true, assignee: true, conversation: { include: { messages: true } } },
  });
  if (!ticket) return apiError("Ticket not found", 404);
  return apiSuccess(ticket);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { ctx, response } = await requireWorkspaceContext();
    if (!ctx) return response;
    if (!canWrite(ctx.role)) return apiError("You don't have permission to update tickets.", 403);

    const { id } = await params;
    const existing = await prisma.ticket.findFirst({ where: { id, workspaceId: ctx.workspace.id } });
    if (!existing) return apiError("Ticket not found", 404);

    const body = ticketUpdateSchema.parse(await req.json());
    const ticket = await prisma.ticket.update({ where: { id }, data: body });
    return apiSuccess(ticket);
  } catch (err) {
    return handleApiError(err);
  }
}
