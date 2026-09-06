import { NextRequest } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/db/prisma";
import { requireWorkspaceContext, canManageWorkspace } from "@/lib/api/guard";
import { apiSuccess, apiError, handleApiError } from "@/lib/api/response";
import { teamInviteSchema } from "@/lib/validation/schemas";
import { sendEmail } from "@/lib/email/send";
import { inviteEmailHtml } from "@/lib/email/templates";

export async function GET() {
  const { ctx, response } = await requireWorkspaceContext();
  if (!ctx) return response;

  const members = await prisma.workspaceMember.findMany({
    where: { workspaceId: ctx.workspace.id },
    include: { user: { select: { id: true, name: true, email: true, avatarColor: true } } },
    orderBy: { invitedAt: "asc" },
  });
  return apiSuccess(members);
}

export async function POST(req: NextRequest) {
  try {
    const { ctx, response } = await requireWorkspaceContext();
    if (!ctx) return response;
    if (!canManageWorkspace(ctx.role)) return apiError("You don't have permission to invite team members.", 403);

    const body = teamInviteSchema.parse(await req.json());
    const email = body.email.toLowerCase();

    let user = await prisma.user.findUnique({ where: { email } });
    const isNewUser = !user;
    if (!user) {
      // Placeholder account, random unusable password — activated below via
      // the same password-reset token flow used for "forgot password".
      const { hashPassword } = await import("@/lib/auth/password");
      user = await prisma.user.create({
        data: { name: email.split("@")[0], email, passwordHash: await hashPassword(crypto.randomUUID()) },
      });
    }

    const existingMembership = await prisma.workspaceMember.findFirst({ where: { workspaceId: ctx.workspace.id, userId: user.id } });
    if (existingMembership) return apiError("This person is already a member of your workspace.", 409);

    const member = await prisma.workspaceMember.create({
      data: { workspaceId: ctx.workspace.id, userId: user.id, role: body.role },
      include: { user: { select: { id: true, name: true, email: true, avatarColor: true } } },
    });

    // New accounts need a way to set a real password before they can log in
    // at all; existing users already have working credentials, so they just
    // get a heads-up rather than another claim link.
    if (isNewUser) {
      const token = crypto.randomBytes(32).toString("hex");
      await prisma.passwordResetToken.create({
        data: { userId: user.id, token, expiresAt: new Date(Date.now() + 60 * 60 * 1000) },
      });
      const actionUrl = `${process.env.NEXT_PUBLIC_APP_URL}/reset-password?token=${token}&welcome=1`;
      await sendEmail({
        to: user.email,
        subject: `You've been invited to ${ctx.workspace.name} on SupportAI`,
        html: inviteEmailHtml({ inviterName: ctx.user.name, workspaceName: ctx.workspace.name, role: body.role, actionUrl, isNewAccount: true }),
      }).catch((err) => console.error("Failed to send invite email:", err));
    } else {
      const actionUrl = `${process.env.NEXT_PUBLIC_APP_URL}/login`;
      await sendEmail({
        to: user.email,
        subject: `You've been added to ${ctx.workspace.name} on SupportAI`,
        html: inviteEmailHtml({ inviterName: ctx.user.name, workspaceName: ctx.workspace.name, role: body.role, actionUrl, isNewAccount: false }),
      }).catch((err) => console.error("Failed to send invite notification email:", err));
    }

    return apiSuccess(member, 201);
  } catch (err) {
    return handleApiError(err);
  }
}
