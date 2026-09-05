import { NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireWorkspaceContext, canWrite } from "@/lib/api/guard";
import { apiSuccess, apiError, handleApiError } from "@/lib/api/response";
import { processWebsite } from "@/lib/rag/process-document";

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { ctx, response } = await requireWorkspaceContext();
    if (!ctx) return response;
    if (!canWrite(ctx.role)) return apiError("You don't have permission to remove websites.", 403);

    const { id } = await params;
    const source = await prisma.websiteSource.findFirst({ where: { id, workspaceId: ctx.workspace.id } });
    if (!source) return apiError("Website source not found", 404);

    const marker = `website:${source.id}`;
    await prisma.document.deleteMany({ where: { workspaceId: ctx.workspace.id, storagePath: marker } });
    await prisma.websiteSource.delete({ where: { id } });

    return apiSuccess({ deleted: true });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  // Re-crawl / retry action for a failed or stale website source.
  try {
    const { ctx, response } = await requireWorkspaceContext();
    if (!ctx) return response;
    if (!canWrite(ctx.role)) return apiError("You don't have permission to recrawl websites.", 403);

    const { id } = await params;
    const source = await prisma.websiteSource.findFirst({ where: { id, workspaceId: ctx.workspace.id } });
    if (!source) return apiError("Website source not found", 404);

    await prisma.websiteSource.update({ where: { id }, data: { status: "PENDING", errorMessage: null } });
    processWebsite(id).catch(() => {});

    return apiSuccess({ started: true });
  } catch (err) {
    return handleApiError(err);
  }
}
