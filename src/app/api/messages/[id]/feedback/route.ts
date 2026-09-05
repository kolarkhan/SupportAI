import { NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { apiSuccess, apiError, handleApiError } from "@/lib/api/response";
import { z } from "zod";

const schema = z.object({ feedback: z.union([z.literal(1), z.literal(-1)]) });

/** Public endpoint — customers rate an individual AI answer (thumbs up/down). */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { feedback } = schema.parse(await req.json());

    const message = await prisma.message.findUnique({ where: { id } });
    if (!message) return apiError("Message not found", 404);

    const updated = await prisma.message.update({ where: { id }, data: { feedback } });
    return apiSuccess(updated);
  } catch (err) {
    return handleApiError(err);
  }
}
