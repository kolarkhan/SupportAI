import "server-only";
import { getCurrentUser } from "@/lib/auth/current-user";
import { apiError } from "./response";

/**
 * Every workspace-scoped API route must call this first. It resolves the
 * authenticated user's active workspace from their session — never from a
 * client-supplied workspaceId — which is what prevents one workspace from
 * reading or mutating another's data (spec §17: unauthorized workspace access).
 */
export async function requireWorkspaceContext() {
  const ctx = await getCurrentUser();
  if (!ctx) {
    return { ctx: null, response: apiError("Not authenticated", 401) } as const;
  }
  return { ctx, response: null } as const;
}

const WRITE_ROLES = new Set(["OWNER", "ADMIN", "AGENT"]);
const MANAGE_ROLES = new Set(["OWNER", "ADMIN"]);

export function canWrite(role: string) {
  return WRITE_ROLES.has(role);
}

export function canManageWorkspace(role: string) {
  return MANAGE_ROLES.has(role);
}
