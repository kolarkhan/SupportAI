import { NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireWorkspaceContext, canManageWorkspace } from "@/lib/api/guard";
import { apiSuccess, apiError, handleApiError } from "@/lib/api/response";
import { z } from "zod";

const schema = z.object({ name: z.string().trim().min(2).max(100) });

export async function PATCH(req: NextRequest) {
  try {
    const { ctx, response } = await requireWorkspaceContext();
    if (!ctx) return response;
    if (!canManageWorkspace(ctx.role)) return apiError("You don't have permission to update workspace settings.", 403);

    const { name } = schema.parse(await req.json());
    const workspace = await prisma.workspace.update({ where: { id: ctx.workspace.id }, data: { name } });
    return apiSuccess(workspace);
  } catch (err) {
    return handleApiError(err);
  }
}
