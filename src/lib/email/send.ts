import "server-only";
import nodemailer, { type Transporter } from "nodemailer";

/**
 * Transactional email via a plain SMTP server (Gmail, Outlook, your own mail
 * provider, etc.) using nodemailer — the standard Node SMTP client; SMTP is
 * a stateful protocol, not a simple REST call, so unlike the Voyage/Resend
 * integrations elsewhere in this app, a real library is the right tool here
 * rather than hand-rolling it over fetch.
 *
 * Falls back to logging the email to the server console when SMTP isn't
 * configured, so signup/invite/reset flows keep working end-to-end in local
 * dev without a mail account: copy the link from the terminal instead of an
 * inbox.
 */
export interface SendEmailInput {
  to: string;
  subject: string;
  html: string;
}

let transporter: Transporter | null = null;

function getTransporter(): Transporter | null {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASSWORD;
  if (!host || !user || !pass) return null;

  if (!transporter) {
    const port = Number(process.env.SMTP_PORT || 587);
    transporter = nodemailer.createTransport({
      host,
      port,
      // Port 465 is implicit TLS; 587/25 use STARTTLS instead. Let
      // SMTP_SECURE override this if a provider needs something unusual.
      secure: process.env.SMTP_SECURE ? process.env.SMTP_SECURE === "true" : port === 465,
      auth: { user, pass },
    });
  }
  return transporter;
}

export async function sendEmail({ to, subject, html }: SendEmailInput): Promise<void> {
  const from = process.env.EMAIL_FROM || "SupportAI <no-reply@example.com>";
  const client = getTransporter();

  if (!client) {
    console.log(`\n📧 [dev email — set SMTP_HOST/SMTP_USER/SMTP_PASSWORD to actually send]\nTo: ${to}\nSubject: ${subject}\n${stripHtml(html)}\n`);
    return;
  }

  await client.sendMail({ from, to, subject, html });
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
