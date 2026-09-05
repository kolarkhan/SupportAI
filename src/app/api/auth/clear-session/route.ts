import { NextRequest, NextResponse } from "next/server";
import { clearSessionCookie } from "@/lib/auth/session";

/**
 * Breaks the redirect loop that happens when a browser holds a
 * signature-valid session cookie whose user/workspace no longer exists in
 * the database (account removed, workspace deleted, or — in dev — the DB
 * was reseeded). Middleware only verifies the JWT signature (it runs on the
 * Edge runtime and can't reach the database), so it still treats that
 * cookie as "logged in" and bounces /login back to /dashboard; meanwhile
 * requireUser() finds no matching user and redirects to /login — an
 * infinite loop between the two.
 *
 * Server Components (like dashboard/layout.tsx, where requireUser() runs)
 * can't mutate cookies, so the cleanup has to happen in a Route Handler.
 * requireUser() redirects here instead of straight to /login: this clears
 * the stale cookie first, so middleware correctly sees "no session" on the
 * next request and the loop breaks.
 */
export async function GET(req: NextRequest) {
  await clearSessionCookie();
  return NextResponse.redirect(new URL("/login", req.url));
}
