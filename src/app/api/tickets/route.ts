import { NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireWorkspaceContext } from "@/lib/api/guard";
import { apiSuccess } from "@/lib/api/response";

export async function GET(req: NextRequest) {
  const { ctx, response } = await requireWorkspaceContext();
  if (!ctx) return response;

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const priority = searchParams.get("priority");

  const tickets = await prisma.ticket.findMany({
    where: {
      workspaceId: ctx.workspace.id,
      ...(status ? { status: status as any } : {}),
      ...(priority ? { priority: priority as any } : {}),
    },
    include: { customer: true, assignee: { select: { id: true, name: true, avatarColor: true } } },
    orderBy: { createdAt: "desc" },
  });
  return apiSuccess(tickets);
}
