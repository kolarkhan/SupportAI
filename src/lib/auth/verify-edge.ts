import { jwtVerify } from "jose";
import type { SessionPayload } from "./session";

// Edge-safe token verification (no `server-only` import, no `next/headers`)
// so it can run inside middleware, which Next.js bundles under conditions
// that reject the `server-only` package guard used elsewhere in this app.
function getSecretKey() {
  const secret = process.env.SESSION_SECRET || "dev-only-insecure-secret-change-me";
  return new TextEncoder().encode(secret);
}

export async function verifySessionTokenEdge(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecretKey());
    return payload as SessionPayload;
  } catch {
    return null;
  }
}
