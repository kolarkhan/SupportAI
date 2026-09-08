import { NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireWorkspaceContext, canWrite } from "@/lib/api/guard";
import { apiSuccess, apiError, handleApiError } from "@/lib/api/response";
import { faqSchema } from "@/lib/validation/schemas";
import { embedOne } from "@/lib/ai/embeddings";
import { isPineconeConfigured, upsertVectors } from "@/lib/rag/pinecone";

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

    if (!isPineconeConfigured()) return apiError("Pinecone is not configured — set PINECONE_API_KEY to enable FAQs.", 500);

    const body = faqSchema.parse(await req.json());
    const embedding = await embedOne(`Q: ${body.question}\nA: ${body.answer}`, "document");

    const faq = await prisma.fAQ.create({
      data: { workspaceId: ctx.workspace.id, question: body.question, answer: body.answer },
    });

    try {
      await upsertVectors(ctx.workspace.id, [{ id: faq.id, values: embedding, content: `Q: ${faq.question}\nA: ${faq.answer}`, documentName: "FAQ" }]);
    } catch (err) {
      // Roll back the Mongo row rather than leave a FAQ that exists but is
      // silently unsearchable — this is an interactive save, so the user
      // should see it failed and just retry, not end up with a half-saved
      // FAQ nobody can find via chat.
      await prisma.fAQ.delete({ where: { id: faq.id } }).catch(() => {});
      throw err;
    }

    return apiSuccess(faq, 201);
  } catch (err) {
    return handleApiError(err);
  }
}
