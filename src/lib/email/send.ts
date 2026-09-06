import "server-only";

/**
 * Transactional email via Resend (https://resend.com) — a single REST call,
 * no SDK dependency needed. Falls back to logging the email to the server
 * console when RESEND_API_KEY isn't set, so signup/invite/reset flows keep
 * working end-to-end in local dev without an email account: copy the link
 * Resend would have sent from the terminal instead of your inbox.
 */
const RESEND_API_URL = "https://api.resend.com/emails";

export interface SendEmailInput {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail({ to, subject, html }: SendEmailInput): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM || "SupportAI <onboarding@resend.dev>";

  if (!apiKey) {
    console.log(`\n📧 [dev email — set RESEND_API_KEY to actually send]\nTo: ${to}\nSubject: ${subject}\n${stripHtml(html)}\n`);
    return;
  }

  const res = await fetch(RESEND_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({ from, to, subject, html }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Email send failed (${res.status}): ${body.slice(0, 300) || res.statusText}`);
  }
}

function stripHtml(html: string): string {
  // Best-effort plain-text rendering for the console fallback — good enough
  // to read a link/button URL out of, not a real HTML-to-text converter.
  return html
    .replace(/<a[^>]*href="([^"]+)"[^>]*>(.*?)<\/a>/gi, "$2 ( $1 )")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+\n/g, "\n")
    .replace(/[ \t]+/g, " ")
    .trim();
}
