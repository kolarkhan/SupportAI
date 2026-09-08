import { NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireWorkspaceContext, canWrite } from "@/lib/api/guard";
import { apiSuccess, apiError, handleApiError } from "@/lib/api/response";
import { faqSchema } from "@/lib/validation/schemas";
import { embedOne } from "@/lib/ai/embeddings";
import { isPineconeConfigured, upsertVectors, deleteVectors } from "@/lib/rag/pinecone";
import { z } from "zod";

async function getOwnedFaq(workspaceId: string, id: string) {
  return prisma.fAQ.findFirst({ where: { id, workspaceId } });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { ctx, response } = await requireWorkspaceContext();
    if (!ctx) return response;
    if (!canWrite(ctx.role)) return apiError("You don't have permission to edit FAQs.", 403);
    if (!isPineconeConfigured()) return apiError("Pinecone is not configured — set PINECONE_API_KEY to enable FAQs.", 500);

    const { id } = await params;
    const existing = await getOwnedFaq(ctx.workspace.id, id);
    if (!existing) return apiError("FAQ not found", 404);

    const schema = faqSchema.partial().extend({ isActive: z.boolean().optional() });
    const body = schema.parse(await req.json());

    const faq = await prisma.fAQ.update({ where: { id }, data: body });

    try {
      // Inactive FAQs are removed from the index entirely rather than just
      // left there — Pinecone has no per-record "isActive" filter here, so
      // "not searchable" has to mean "not in the index". Mongo no longer
      // has a cached embedding to reuse, so re-embed whenever the FAQ ends
      // up active — cheap (one short string) and always correct, including
      // when only `isActive` flips back to true with no content change.
      if (faq.isActive) {
        const vec = await embedOne(`Q: ${faq.question}\nA: ${faq.answer}`, "document");
        await upsertVectors(ctx.workspace.id, [{ id: faq.id, values: vec, content: `Q: ${faq.question}\nA: ${faq.answer}`, documentName: "FAQ" }]);
      } else {
        await deleteVectors(ctx.workspace.id, [faq.id]);
      }
    } catch (err) {
      // Roll back to the pre-edit state so the user sees the edit actually
      // failed, rather than a FAQ that looks saved but isn't searchable.
      await prisma.fAQ.update({ where: { id }, data: { question: existing.question, answer: existing.answer, isActive: existing.isActive } }).catch(() => {});
      throw err;
    }

    return apiSuccess(faq);
  } catch (err) {
    return handleApiError(err);
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { ctx, response } = await requireWorkspaceContext();
    if (!ctx) return response;
    if (!canWrite(ctx.role)) return apiError("You don't have permission to delete FAQs.", 403);

    const { id } = await params;
    const existing = await getOwnedFaq(ctx.workspace.id, id);
    if (!existing) return apiError("FAQ not found", 404);

    await prisma.fAQ.delete({ where: { id } });
    if (isPineconeConfigured()) {
      await deleteVectors(ctx.workspace.id, [id]).catch((err) => console.error("Failed to remove FAQ vector from Pinecone:", err));
    }
    return apiSuccess({ deleted: true });
  } catch (err) {
    return handleApiError(err);
  }
}
