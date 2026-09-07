import { NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireWorkspaceContext, canWrite } from "@/lib/api/guard";
import { apiSuccess, apiError, handleApiError } from "@/lib/api/response";
import { processWebsite } from "@/lib/rag/process-document";
import { isPineconeConfigured, deleteVectors } from "@/lib/rag/pinecone";

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { ctx, response } = await requireWorkspaceContext();
    if (!ctx) return response;
    if (!canWrite(ctx.role)) return apiError("You don't have permission to remove websites.", 403);

    const { id } = await params;
    const source = await prisma.websiteSource.findFirst({ where: { id, workspaceId: ctx.workspace.id } });
    if (!source) return apiError("Website source not found", 404);

    const marker = `website:${source.id}`;
    const chunkIds = isPineconeConfigured()
      ? (await prisma.documentChunk.findMany({ where: { workspaceId: ctx.workspace.id, document: { storagePath: marker } }, select: { id: true } })).map((c) => c.id)
      : [];

    await prisma.document.deleteMany({ where: { workspaceId: ctx.workspace.id, storagePath: marker } });
    await prisma.websiteSource.delete({ where: { id } });

    if (chunkIds.length > 0) {
      await deleteVectors(ctx.workspace.id, chunkIds).catch((err) => console.error("Failed to remove website vectors from Pinecone:", err));
    }

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
