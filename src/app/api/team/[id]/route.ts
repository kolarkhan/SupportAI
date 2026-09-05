import { NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireWorkspaceContext, canManageWorkspace } from "@/lib/api/guard";
import { apiSuccess, apiError, handleApiError } from "@/lib/api/response";
import { z } from "zod";

const schema = z.object({ role: z.enum(["OWNER", "ADMIN", "AGENT", "VIEWER"]) });

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { ctx, response } = await requireWorkspaceContext();
    if (!ctx) return response;
    if (!canManageWorkspace(ctx.role)) return apiError("You don't have permission to change roles.", 403);

    const { id } = await params;
    const member = await prisma.workspaceMember.findFirst({ where: { id, workspaceId: ctx.workspace.id } });
    if (!member) return apiError("Team member not found", 404);

    const { role } = schema.parse(await req.json());
    const updated = await prisma.workspaceMember.update({
      where: { id },
      data: { role },
      include: { user: { select: { id: true, name: true, email: true, avatarColor: true } } },
    });
    return apiSuccess(updated);
  } catch (err) {
    return handleApiError(err);
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { ctx, response } = await requireWorkspaceContext();
    if (!ctx) return response;
    if (!canManageWorkspace(ctx.role)) return apiError("You don't have permission to remove team members.", 403);

    const { id } = await params;
    const member = await prisma.workspaceMember.findFirst({ where: { id, workspaceId: ctx.workspace.id } });
    if (!member) return apiError("Team member not found", 404);
    if (member.role === "OWNER") return apiError("The workspace owner cannot be removed.", 400);

    await prisma.workspaceMember.delete({ where: { id } });
    return apiSuccess({ deleted: true });
  } catch (err) {
    return handleApiError(err);
  }
}
