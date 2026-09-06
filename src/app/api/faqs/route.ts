import { NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireWorkspaceContext, canWrite } from "@/lib/api/guard";
import { apiSuccess, apiError, handleApiError } from "@/lib/api/response";
import { faqSchema } from "@/lib/validation/schemas";
import { embedOne } from "@/lib/ai/embeddings";
import { encodeEmbedding } from "@/lib/rag/vector-search";

export async function GET() {
  const { ctx, response } = await requireWorkspaceContext();
  if (!ctx) return response;
  const faqs = await prisma.fAQ.findMany({ where: { workspaceId: ctx.workspace.id }, orderBy: { createdAt: "desc" } });
  return apiSuccess(faqs);
}

export async function POST(req: NextRequest) {
  try {
    const { ctx, response } = await requireWorkspaceContext();
    if (!ctx) return response;
    if (!canWrite(ctx.role)) return apiError("You don't have permission to add FAQs.", 403);

    const body = faqSchema.parse(await req.json());
    const embedding = await embedOne(`Q: ${body.question}\nA: ${body.answer}`, "document");

    const faq = await prisma.fAQ.create({
      data: { workspaceId: ctx.workspace.id, question: body.question, answer: body.answer, embedding: encodeEmbedding(embedding) },
    });
    return apiSuccess(faq, 201);
  } catch (err) {
    return handleApiError(err);
  }
}
