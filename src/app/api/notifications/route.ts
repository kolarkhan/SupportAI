import { NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireWorkspaceContext } from "@/lib/api/guard";
import { apiSuccess } from "@/lib/api/response";

export async function GET() {
  const { ctx, response } = await requireWorkspaceContext();
  if (!ctx) return response;

  const notifications = await prisma.notification.findMany({
    where: { workspaceId: ctx.workspace.id, OR: [{ userId: ctx.user.id }, { userId: null }] },
    orderBy: { createdAt: "desc" },
    take: 20,
  });
  return apiSuccess(notifications);
}

export async function PATCH(req: NextRequest) {
  const { ctx, response } = await requireWorkspaceContext();
  if (!ctx) return response;
  const body = await req.json().catch(() => ({}));

  if (body.markAllRead) {
    await prisma.notification.updateMany({
      where: { workspaceId: ctx.workspace.id, OR: [{ userId: ctx.user.id }, { userId: null }] },
      data: { read: true },
    });
    return apiSuccess({ ok: true });
  }
  if (body.id) {
    const notification = await prisma.notification.findFirst({
      where: { id: body.id, workspaceId: ctx.workspace.id, OR: [{ userId: ctx.user.id }, { userId: null }] },
    });
    if (!notification) return apiSuccess({ ok: true }); // nothing to do — not this user's notification
    await prisma.notification.update({ where: { id: body.id }, data: { read: true } });
    return apiSuccess({ ok: true });
  }
  return apiSuccess({ ok: true });
}
