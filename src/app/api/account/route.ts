import { NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireWorkspaceContext } from "@/lib/api/guard";
import { apiSuccess, handleApiError } from "@/lib/api/response";
import { z } from "zod";

const schema = z.object({ name: z.string().trim().min(2).max(80) });

export async function PATCH(req: NextRequest) {
  try {
    const { ctx, response } = await requireWorkspaceContext();
    if (!ctx) return response;

    const { name } = schema.parse(await req.json());
    const user = await prisma.user.update({ where: { id: ctx.user.id }, data: { name } });
    return apiSuccess({ id: user.id, name: user.name, email: user.email });
  } catch (err) {
    return handleApiError(err);
  }
}
