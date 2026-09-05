import { getCurrentUser } from "@/lib/auth/current-user";
import { apiSuccess } from "@/lib/api/response";

export async function GET() {
  const ctx = await getCurrentUser();
  if (!ctx) return apiSuccess({ authenticated: false });
  return apiSuccess({
    authenticated: true,
    user: { id: ctx.user.id, name: ctx.user.name, email: ctx.user.email, avatarColor: ctx.user.avatarColor },
    workspace: { id: ctx.workspace.id, name: ctx.workspace.name, slug: ctx.workspace.slug, plan: ctx.workspace.plan },
    role: ctx.role,
  });
}
