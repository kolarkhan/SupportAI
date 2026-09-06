import "server-only";

const ROLE_LABEL: Record<string, string> = { OWNER: "Owner", ADMIN: "Admin", AGENT: "Support Agent", VIEWER: "Viewer" };

function layout(bodyHtml: string): string {
  return `
<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px; color: #18181b;">
  <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 24px;">
    <span style="display: inline-flex; width: 28px; height: 28px; border-radius: 8px; background: #6366f1; color: #fff; align-items: center; justify-content: center; font-weight: 700; font-size: 14px;">S</span>
    <span style="font-weight: 700; font-size: 16px;">SupportAI</span>
  </div>
  ${bodyHtml}
  <p style="margin-top: 32px; padding-top: 16px; border-top: 1px solid #e4e4e7; font-size: 12px; color: #71717a;">
    You're receiving this email because of activity on a SupportAI workspace. If this wasn't you, you can safely ignore it.
  </p>
</div>`.trim();
}

function button(url: string, label: string): string {
  return `<a href="${url}" style="display: inline-block; margin: 20px 0; padding: 10px 20px; background: #6366f1; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 14px;">${label}</a>`;
}

export function inviteEmailHtml(opts: { inviterName: string; workspaceName: string; role: string; actionUrl: string }): string {
  const roleLabel = ROLE_LABEL[opts.role] ?? opts.role;
  // Always a "set your password" link — even for someone who already has a
  // SupportAI account elsewhere, this is just a normal password reset
  // (their existing password keeps working until they actually use this
  // link). One consistent action, no ambiguity about whether to log in or
  // set a password.
  const body = `<p style="font-size: 14px; line-height: 1.6; color: #3f3f46;">
      ${escapeHtml(opts.inviterName)} added you to <strong>${escapeHtml(opts.workspaceName)}</strong> on SupportAI as
      <strong>${roleLabel}</strong>. Set a password to get started.
    </p>
    ${button(opts.actionUrl, "Set your password")}
    <p style="font-size: 12px; color: #71717a; word-break: break-all;">Or paste this link into your browser: ${opts.actionUrl}</p>
    <p style="font-size: 12px; color: #71717a;">This link expires in 1 hour.</p>`;

  return layout(`<h1 style="font-size: 18px; margin: 0 0 12px;">You've been invited to ${escapeHtml(opts.workspaceName)}</h1>${body}`);
}

export function resetPasswordEmailHtml(opts: { actionUrl: string }): string {
  return layout(`
    <h1 style="font-size: 18px; margin: 0 0 12px;">Reset your password</h1>
    <p style="font-size: 14px; line-height: 1.6; color: #3f3f46;">
      We got a request to reset your SupportAI password. If this was you, choose a new one below.
    </p>
    ${button(opts.actionUrl, "Reset password")}
    <p style="font-size: 12px; color: #71717a; word-break: break-all;">Or paste this link into your browser: ${opts.actionUrl}</p>
    <p style="font-size: 12px; color: #71717a;">This link expires in 1 hour. If you didn't request this, you can ignore this email.</p>
  `);
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}
