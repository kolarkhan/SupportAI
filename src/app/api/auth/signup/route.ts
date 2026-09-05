import { NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { hashPassword } from "@/lib/auth/password";
import { createSessionToken, setSessionCookie } from "@/lib/auth/session";
import { signupSchema } from "@/lib/validation/schemas";
import { apiSuccess, handleApiError, apiError } from "@/lib/api/response";
import { rateLimit, getClientKey } from "@/lib/api/rate-limit";
import { slugify } from "@/lib/utils";

export async function POST(req: NextRequest) {
  try {
    const limited = rateLimit(`signup:${getClientKey(req)}`, 10, 60_000);
    if (!limited.ok) return apiError("Too many attempts. Please try again shortly.", 429);

    const body = signupSchema.parse(await req.json());

    const existing = await prisma.user.findUnique({ where: { email: body.email.toLowerCase() } });
    if (existing) return apiError("An account with this email already exists.", 409);

    const passwordHash = await hashPassword(body.password);

    let slug = slugify(body.companyName) || "workspace";
    const slugTaken = await prisma.workspace.findUnique({ where: { slug } });
    if (slugTaken) slug = `${slug}-${Math.random().toString(36).slice(2, 6)}`;

    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: { name: body.name, email: body.email.toLowerCase(), passwordHash },
      });
      const workspace = await tx.workspace.create({
        data: { name: body.companyName, slug },
      });
      await tx.workspaceMember.create({
        data: { workspaceId: workspace.id, userId: user.id, role: "OWNER", joinedAt: new Date() },
      });
      const agent = await tx.agent.create({
        data: {
          workspaceId: workspace.id,
          name: `${body.companyName} Support Assistant`,
          systemInstructions: `You are the customer support assistant for ${body.companyName}. Always be polite and never invent information.`,
        },
      });
      await tx.notification.create({
        data: {
          workspaceId: workspace.id,
          userId: user.id,
          type: "system",
          title: "Welcome to SupportAI",
          body: "Your workspace is ready. Upload documents or add a website to start training your AI agent.",
          href: "/dashboard/knowledge",
        },
      });
      return { user, workspace, agent };
    });

    const token = await createSessionToken({ userId: result.user.id, workspaceId: result.workspace.id });
    await setSessionCookie(token);

    return apiSuccess({ userId: result.user.id, workspaceId: result.workspace.id }, 201);
  } catch (err) {
    return handleApiError(err);
  }
}
