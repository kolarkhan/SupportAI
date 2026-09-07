import { NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireWorkspaceContext, canWrite } from "@/lib/api/guard";
import { apiSuccess, apiError, handleApiError } from "@/lib/api/response";
import { isPineconeConfigured, deleteVectors } from "@/lib/rag/pinecone";

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

    // Chunks cascade-delete with the document in Mongo, but Pinecone has no
    // knowledge of that relationship — grab their ids first so the matching
    // vectors don't linger as orphans in the index.
    const chunkIds = isPineconeConfigured() ? (await prisma.documentChunk.findMany({ where: { documentId: id }, select: { id: true } })).map((c) => c.id) : [];

    await prisma.document.delete({ where: { id } });

    if (chunkIds.length > 0) {
      await deleteVectors(ctx.workspace.id, chunkIds).catch((err) => console.error("Failed to remove document vectors from Pinecone:", err));
    }

    return apiSuccess({ deleted: true });
  } catch (err) {
    return handleApiError(err);
  }
}
