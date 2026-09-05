import { NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireWorkspaceContext, canWrite } from "@/lib/api/guard";
import { apiSuccess, apiError, handleApiError } from "@/lib/api/response";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { ctx, response } = await requireWorkspaceContext();
  if (!ctx) return response;
  const { id } = await params;
  const document = await prisma.document.findFirst({ where: { id, workspaceId: ctx.workspace.id } });
  if (!document) return apiError("Document not found", 404);
  return apiSuccess(document);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { ctx, response } = await requireWorkspaceContext();
    if (!ctx) return response;
    if (!canWrite(ctx.role)) return apiError("You don't have permission to delete documents.", 403);

    const { id } = await params;
    const document = await prisma.document.findFirst({ where: { id, workspaceId: ctx.workspace.id } });
    if (!document) return apiError("Document not found", 404);

    await prisma.document.delete({ where: { id } });
    return apiSuccess({ deleted: true });
  } catch (err) {
    return handleApiError(err);
  }
}
