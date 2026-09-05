import { NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireWorkspaceContext, canWrite } from "@/lib/api/guard";
import { apiSuccess, apiError, handleApiError } from "@/lib/api/response";
import { detectDocumentType, validateFile } from "@/lib/rag/extract";
import { processDocument } from "@/lib/rag/process-document";

export async function GET() {
  const { ctx, response } = await requireWorkspaceContext();
  if (!ctx) return response;

  const documents = await prisma.document.findMany({
    where: { workspaceId: ctx.workspace.id, storagePath: null }, // exclude synthetic website docs
    orderBy: { createdAt: "desc" },
  });
  return apiSuccess(documents);
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
      },
    });

    // Fire-and-forget ingestion pipeline; UI polls status.
    processDocument(document.id, buffer, type).catch(() => {});

    return apiSuccess(document, 201);
  } catch (err) {
    return handleApiError(err);
  }
}
