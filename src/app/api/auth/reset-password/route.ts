import { NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { hashPassword } from "@/lib/auth/password";
import { resetPasswordSchema } from "@/lib/validation/schemas";
import { apiSuccess, apiError, handleApiError } from "@/lib/api/response";
import { rateLimit, getClientKey } from "@/lib/api/rate-limit";

/**
 * Consumes a password-reset token issued by /api/auth/forgot-password:
 * validates it's real, unexpired, and unused, then sets the new password
 * and marks the token used (single-use). Does not log the user in — they
 * return to /login with their new password, consistent with the "always
 * generic" posture of the forgot-password step.
 */
export async function POST(req: NextRequest) {
  try {
    const limited = rateLimit(`reset:${getClientKey(req)}`, 10, 60_000);
    if (!limited.ok) return apiError("Too many attempts. Please try again shortly.", 429);

    const body = resetPasswordSchema.parse(await req.json());

    const resetToken = await prisma.passwordResetToken.findUnique({ where: { token: body.token } });
    if (!resetToken || resetToken.usedAt || resetToken.expiresAt < new Date()) {
      return apiError("This reset link is invalid or has expired. Please request a new one.", 400);
    }

    const passwordHash = await hashPassword(body.password);

    await prisma.$transaction([
      prisma.user.update({ where: { id: resetToken.userId }, data: { passwordHash } }),
      prisma.passwordResetToken.update({ where: { id: resetToken.id }, data: { usedAt: new Date() } }),
    ]);

    return apiSuccess({ reset: true });
  } catch (err) {
    return handleApiError(err);
  }
}
