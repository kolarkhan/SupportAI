import { NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireWorkspaceContext, canWrite } from "@/lib/api/guard";
import { apiSuccess, apiError, handleApiError } from "@/lib/api/response";
import { detectDocumentType, validateFile } from "@/lib/rag/extract";
import { processDocument } from "@/lib/rag/process-document";
import { isPineconeConfigured } from "@/lib/rag/pinecone";

export async function GET() {
  const { ctx, response } = await requireWorkspaceContext();
  if (!ctx) return response;

  const documents = await prisma.document.findMany({
    where: { workspaceId: ctx.workspace.id, storagePath: null }, // exclude synthetic website docs
    orderBy: { createdAt: "desc" },
  });
  // Lets the UI say "Indexed in Pinecone" only when that's actually true,
  // instead of hardcoding a vendor name that may not reflect the real
  // (possibly fallback) storage backend.
  return apiSuccess({ items: documents, vectorStore: isPineconeConfigured() ? "pinecone" : "mongodb" });
}

export async function POST(req: NextRequest) {
  try {
    const { ctx, response } = await requireWorkspaceContext();
    if (!ctx) return response;
    if (!canWrite(ctx.role)) return apiError("You don't have permission to upload documents.", 403);

    const formData = await req.formData();
    const file = formData.get("file");
    if (!file || !(file instanceof File)) return apiError("No file was provided.", 422);

    const type = detectDocumentType(file.name, file.type);
    const validation = validateFile(file.size, type);
    if (!validation.ok || !type) return apiError(validation.error || "Invalid file.", 422);

    const buffer = Buffer.from(await file.arrayBuffer());

    const document = await prisma.document.create({
      data: {
        workspaceId: ctx.workspace.id,
        name: file.name,
        type,
        status: "PENDING",
        fileSize: file.size,
        // Explicit, not left absent: Prisma's MongoDB connector only matches
        // `storagePath: null` filters (used below and in dashboard/page.tsx
        // to exclude synthetic website documents) against fields that are
        // actually present and null — an absent field silently fails to
        // match at all, which is exactly the bug that made every regular
        // upload invisible in the list despite processing successfully.
        storagePath: null,
      },
    });

    // Fire-and-forget ingestion pipeline; UI polls status.
    processDocument(document.id, buffer, type).catch(() => {});

    return apiSuccess(document, 201);
  } catch (err) {
    return handleApiError(err);
  }
}
