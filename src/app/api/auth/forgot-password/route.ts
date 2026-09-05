import { NextRequest } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/db/prisma";
import { forgotPasswordSchema } from "@/lib/validation/schemas";
import { apiSuccess, handleApiError, apiError } from "@/lib/api/response";
import { rateLimit, getClientKey } from "@/lib/api/rate-limit";

/**
 * Password reset architecture: issues a single-use, time-limited token tied
 * to the user and stores it. In production this route would email a reset
 * link (https://app/reset-password?token=...) via a transactional email
 * provider — the token issuance/consumption logic is fully wired here so
 * that integration is a one-line swap.
 *
 * Always responds with the same generic success message whether or not the
 * email exists, to avoid leaking which addresses have accounts.
 */
export async function POST(req: NextRequest) {
  try {
    const limited = rateLimit(`forgot:${getClientKey(req)}`, 5, 60_000);
    if (!limited.ok) return apiError("Too many requests. Please try again shortly.", 429);

    const body = forgotPasswordSchema.parse(await req.json());
    const user = await prisma.user.findUnique({ where: { email: body.email.toLowerCase() } });

    if (user) {
      const token = crypto.randomBytes(32).toString("hex");
      await prisma.passwordResetToken.create({
        data: { userId: user.id, token, expiresAt: new Date(Date.now() + 60 * 60 * 1000) },
      });
      // TODO(production): send email via provider with link `${APP_URL}/reset-password?token=${token}`
    }

    return apiSuccess({ message: "If an account exists for that email, a reset link has been sent." });
  } catch (err) {
    return handleApiError(err);
  }
}
