import { NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireWorkspaceContext, canWrite } from "@/lib/api/guard";
import { apiSuccess, apiError, handleApiError } from "@/lib/api/response";
import { websiteSchema } from "@/lib/validation/schemas";
import { processWebsite } from "@/lib/rag/process-document";
import { isPineconeConfigured } from "@/lib/rag/pinecone";

export async function GET() {
  const { ctx, response } = await requireWorkspaceContext();
  if (!ctx) return response;
  const sources = await prisma.websiteSource.findMany({
    where: { workspaceId: ctx.workspace.id },
    orderBy: { createdAt: "desc" },
  });
  return apiSuccess({ items: sources, vectorStore: isPineconeConfigured() ? "pinecone" : "mongodb" });
}

export async function POST(req: NextRequest) {
  try {
    const { ctx, response } = await requireWorkspaceContext();
    if (!ctx) return response;
    if (!canWrite(ctx.role)) return apiError("You don't have permission to add websites.", 403);

    const { url } = websiteSchema.parse(await req.json());

    const existing = await prisma.websiteSource.findFirst({ where: { workspaceId: ctx.workspace.id, url } });
    if (existing) return apiError("This website has already been added.", 409);

    const source = await prisma.websiteSource.create({
      data: { workspaceId: ctx.workspace.id, url, status: "PENDING" },
    });

    processWebsite(source.id).catch(() => {});

    return apiSuccess(source, 201);
  } catch (err) {
    return handleApiError(err);
  }
}
