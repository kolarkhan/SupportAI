import { NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireWorkspaceContext, canWrite } from "@/lib/api/guard";
import { apiSuccess, apiError, handleApiError } from "@/lib/api/response";
import { faqSchema } from "@/lib/validation/schemas";
import { getAIProvider } from "@/lib/ai";
import { encodeEmbedding } from "@/lib/rag/vector-search";
import { z } from "zod";

async function getOwnedFaq(workspaceId: string, id: string) {
  return prisma.fAQ.findFirst({ where: { id, workspaceId } });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { ctx, response } = await requireWorkspaceContext();
    if (!ctx) return response;
    if (!canWrite(ctx.role)) return apiError("You don't have permission to edit FAQs.", 403);

    const { id } = await params;
    const existing = await getOwnedFaq(ctx.workspace.id, id);
    if (!existing) return apiError("FAQ not found", 404);

    const schema = faqSchema.partial().extend({ isActive: z.boolean().optional() });
    const body = schema.parse(await req.json());

    let embedding = existing.embedding;
    if (body.question || body.answer) {
      const provider = await getAIProvider("mock");
      const vec = await provider.embed(`Q: ${body.question ?? existing.question}\nA: ${body.answer ?? existing.answer}`);
      embedding = encodeEmbedding(vec);
    }

    const faq = await prisma.fAQ.update({ where: { id }, data: { ...body, embedding } });
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
    return apiSuccess({ deleted: true });
  } catch (err) {
    return handleApiError(err);
  }
}
