import "server-only";

import nodemailer from "nodemailer";

type NotificationKind = "registration" | "payment";

type SendAdminNotificationInput = {
  kind: NotificationKind;
  subject: string;
  summary: string;
  details: Array<{ label: string; value: string }>;
};

function getNotificationConfig() {
  return {
    host: process.env.SMTP_HOST?.trim() ?? "",
    port: Number(process.env.SMTP_PORT?.trim() ?? "465"),
    secure: (process.env.SMTP_SECURE?.trim().toLowerCase() ?? "true") !== "false",
    user: process.env.SMTP_USER?.trim() ?? "",
    pass: process.env.SMTP_PASS?.trim() ?? "",
    from:
      process.env.SMTP_FROM?.trim() ??
      process.env.SMTP_USER?.trim() ??
      "support@policypack.org",
    recipients: (process.env.ADMIN_NOTIFICATION_EMAILS?.trim() ?? "")
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean),
  };
}

function buildHtmlBody(input: SendAdminNotificationInput) {
  const rows = input.details
    .map(
      (detail) =>
        `<tr><td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;font-weight:600;color:#111827;">${detail.label}</td><td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;color:#374151;">${detail.value}</td></tr>`,
    )
    .join("");

  return `
    <div style="font-family:Inter,Arial,sans-serif;max-width:680px;margin:0 auto;padding:24px;background:#ffffff;color:#111827;">
      <p style="margin:0 0 8px;font-size:12px;letter-spacing:0.18em;text-transform:uppercase;color:#0f766e;">PolicyPack Notification</p>
      <h1 style="margin:0 0 12px;font-size:24px;line-height:1.2;">${input.subject}</h1>
      <p style="margin:0 0 20px;font-size:14px;line-height:1.7;color:#4b5563;">${input.summary}</p>
      <table style="width:100%;border-collapse:collapse;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden;">
        ${rows}
      </table>
    </div>
  `;
}

export async function sendAdminNotification(input: SendAdminNotificationInput) {
  const config = getNotificationConfig();

  if (
    !config.host ||
    !config.user ||
    !config.pass ||
    config.recipients.length === 0
  ) {
    return { ok: false as const, skipped: true as const };
  }

  const transporter = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: {
      user: config.user,
      pass: config.pass,
    },
  });

  const textBody = [
    input.summary,
    "",
    ...input.details.map((detail) => `${detail.label}: ${detail.value}`),
  ].join("\n");

  await transporter.sendMail({
    from: config.from,
    to: config.recipients.join(", "),
    subject: input.subject,
    text: textBody,
    html: buildHtmlBody(input),
  });

  return { ok: true as const, skipped: false as const };
}
