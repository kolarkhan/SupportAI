import { NextRequest } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/db/prisma";
import { forgotPasswordSchema } from "@/lib/validation/schemas";
import { apiSuccess, handleApiError, apiError } from "@/lib/api/response";
import { rateLimit, getClientKey } from "@/lib/api/rate-limit";
import { sendEmail } from "@/lib/email/send";
import { resetPasswordEmailHtml } from "@/lib/email/templates";

/**
 * Issues a single-use, time-limited token tied to the user and emails a
 * reset link (see src/lib/email/send.ts — logs to the console instead of
 * sending when RESEND_API_KEY isn't set, so this still works in local dev).
 *
 * Always responds with the same generic success message whether or not the
 * email exists, to avoid leaking which addresses have accounts. Email
 * send failures are logged, not surfaced — the token is already created and
 * usable, so a transient provider hiccup shouldn't turn into a scary error
 * for a request that otherwise succeeded.
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
      const actionUrl = `${process.env.NEXT_PUBLIC_APP_URL}/reset-password?token=${token}`;
      await sendEmail({
        to: user.email,
        subject: "Reset your SupportAI password",
        html: resetPasswordEmailHtml({ actionUrl }),
      }).catch((err) => console.error("Failed to send password reset email:", err));
    }

    return apiSuccess({ message: "If an account exists for that email, a reset link has been sent." });
  } catch (err) {
    return handleApiError(err);
  }
}
