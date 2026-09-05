import { NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { verifyPassword } from "@/lib/auth/password";
import { createSessionToken, setSessionCookie } from "@/lib/auth/session";
import { loginSchema } from "@/lib/validation/schemas";
import { apiSuccess, apiError, handleApiError } from "@/lib/api/response";
import { rateLimit, getClientKey } from "@/lib/api/rate-limit";

export async function POST(req: NextRequest) {
  try {
    const limited = rateLimit(`login:${getClientKey(req)}`, 15, 60_000);
    if (!limited.ok) return apiError("Too many login attempts. Please try again shortly.", 429);

    const body = loginSchema.parse(await req.json());

    const user = await prisma.user.findUnique({ where: { email: body.email.toLowerCase() } });
    if (!user) return apiError("Invalid email or password.", 401);

    const valid = await verifyPassword(body.password, user.passwordHash);
    if (!valid) return apiError("Invalid email or password.", 401);

    const membership = await prisma.workspaceMember.findFirst({ where: { userId: user.id } });
    if (!membership) return apiError("This account is not linked to a workspace.", 403);

    const token = await createSessionToken({ userId: user.id, workspaceId: membership.workspaceId });
    await setSessionCookie(token);

    return apiSuccess({ userId: user.id, workspaceId: membership.workspaceId });
  } catch (err) {
    return handleApiError(err);
  }
}
