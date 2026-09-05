import "server-only";
import { prisma } from "@/lib/db/prisma";
import { getSession } from "./session";
import { redirect } from "next/navigation";

/**
 * Returns the current authenticated user + active workspace, or null.
 * Use in server components / route handlers. Never trusts client input.
 */
export async function getCurrentUser() {
  const session = await getSession();
  if (!session) return null;

  const [user, membership] = await Promise.all([
    prisma.user.findUnique({ where: { id: session.userId } }),
    prisma.workspaceMember.findFirst({
      where: { userId: session.userId, workspaceId: session.workspaceId },
      include: { workspace: true },
    }),
  ]);

  if (!user || !membership) return null;

  return {
    user,
    workspace: membership.workspace,
    role: membership.role,
  };
}

/** For server components that require auth — redirects to /login otherwise. */
export async function requireUser() {
  const ctx = await getCurrentUser();
  if (!ctx) {
    // Not just "no cookie" — this also covers a signature-valid cookie whose
    // user/workspace no longer exists. Route through clear-session (a Route
    // Handler, unlike this Server Component, can mutate cookies) so the
    // stale cookie is gone before middleware sees the next request —
    // otherwise middleware still thinks it's logged in and bounces /login
    // straight back to /dashboard, looping forever. See clear-session/route.ts.
    redirect("/api/auth/clear-session");
  }
  return ctx;
}
