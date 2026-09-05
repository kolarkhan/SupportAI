import { NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireWorkspaceContext, canManageWorkspace } from "@/lib/api/guard";
import { apiSuccess, apiError, handleApiError } from "@/lib/api/response";
import { teamInviteSchema } from "@/lib/validation/schemas";

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
    if (!user) {
      // Placeholder account until the invitee signs up — architecture only;
      // production would send a real invite email with a claim link.
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

    return apiSuccess(member, 201);
  } catch (err) {
    return handleApiError(err);
  }
}
