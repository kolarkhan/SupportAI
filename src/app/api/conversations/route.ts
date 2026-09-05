import { NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireWorkspaceContext } from "@/lib/api/guard";
import { apiSuccess } from "@/lib/api/response";

export async function GET(req: NextRequest) {
  const { ctx, response } = await requireWorkspaceContext();
  if (!ctx) return response;

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const q = searchParams.get("q")?.trim();
  const cursor = searchParams.get("cursor") || undefined;
  const take = Math.min(Number(searchParams.get("take") || 30), 50);

  const conversations = await prisma.conversation.findMany({
    where: {
      workspaceId: ctx.workspace.id,
      ...(status ? { status: status as any } : {}),
      ...(q
        ? {
            OR: [
              { customer: { name: { contains: q } } },
              { customer: { email: { contains: q } } },
              { messages: { some: { content: { contains: q } } } },
            ],
          }
        : {}),
    },
    include: {
      customer: true,
      agent: { select: { id: true, name: true, avatarEmoji: true } },
      assignee: { select: { id: true, name: true } },
      messages: { orderBy: { createdAt: "desc" }, take: 1 },
      _count: { select: { messages: true } },
    },
    orderBy: { lastMessageAt: "desc" },
    take: take + 1,
    ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
  });

  const hasMore = conversations.length > take;
  const items = hasMore ? conversations.slice(0, take) : conversations;

  return apiSuccess({
    items,
    nextCursor: hasMore ? items[items.length - 1].id : null,
  });
}
