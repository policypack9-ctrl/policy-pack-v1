import "server-only";

import nodemailer from "nodemailer";
import { COMPANY_SUPPORT_EMAIL } from "@/lib/company";

type NotificationKind = "registration" | "payment";

type SendAdminNotificationInput = {
  kind: NotificationKind;
  subject: string;
  summary: string;
  details: Array<{ label: string; value: string }>;
};

function parseEmailList(value: string) {
  return value
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);
}

function uniqueEmails(items: string[]) {
  return [...new Set(items)];
}

function readBooleanEnv(key: string) {
  const value = process.env[key]?.trim().toLowerCase();
  if (!value) {
    return null;
  }

  return value !== "false";
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function getNotificationConfig() {
  const configuredHost = process.env.SMTP_HOST?.trim() ?? "";
  const user = process.env.SMTP_USER?.trim() ?? "";
  const provider = process.env.SMTP_PROVIDER?.trim().toLowerCase() ?? "";
  const adminNotificationEmails = process.env.ADMIN_NOTIFICATION_EMAILS?.trim() ?? "";
  const isGmail = provider === "gmail" || /@gmail\.com$/i.test(user);
  const host = configuredHost || (isGmail ? "smtp.gmail.com" : "");
  const port = Number(process.env.SMTP_PORT?.trim() ?? (isGmail ? "465" : "465"));
  const secure = readBooleanEnv("SMTP_SECURE") ?? port === 465;
  const recipients = uniqueEmails(
    adminNotificationEmails
      ? parseEmailList(adminNotificationEmails)
      : [COMPANY_SUPPORT_EMAIL.toLowerCase()],
  );

  return {
    host,
    port,
    secure,
    user,
    pass: process.env.SMTP_PASS?.trim() ?? "",
    from: process.env.SMTP_FROM?.trim() ?? `PolicyPack <${COMPANY_SUPPORT_EMAIL}>`,
    replyTo: process.env.SMTP_REPLY_TO?.trim() ?? COMPANY_SUPPORT_EMAIL,
    recipients,
  };
}

function buildHtmlBody(input: SendAdminNotificationInput) {
  const rows = input.details
    .map(
      (detail) =>
        `<tr><td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;font-weight:600;color:#111827;">${escapeHtml(detail.label)}</td><td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;color:#374151;">${escapeHtml(detail.value)}</td></tr>`,
    )
    .join("");

  return `
    <div style="font-family:Inter,Arial,sans-serif;max-width:680px;margin:0 auto;padding:24px;background:#ffffff;color:#111827;">
      <p style="margin:0 0 8px;font-size:12px;letter-spacing:0.18em;text-transform:uppercase;color:#0f766e;">PolicyPack Notification</p>
      <h1 style="margin:0 0 12px;font-size:24px;line-height:1.2;">${escapeHtml(input.subject)}</h1>
      <p style="margin:0 0 20px;font-size:14px;line-height:1.7;color:#4b5563;">${escapeHtml(input.summary)}</p>
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

  try {
    await transporter.sendMail({
      from: config.from,
      replyTo: config.replyTo,
      to: config.recipients.join(", "),
      subject: input.subject,
      text: textBody,
      html: buildHtmlBody(input),
    });
    return { ok: true as const, skipped: false as const };
  } catch (error) {
    console.error("Error sending admin notification:", error);
    return { ok: false as const, skipped: false as const };
  }
}

export async function sendWelcomeEmail(userEmail: string, userName: string) {
  const config = getNotificationConfig();

  if (!config.host || !config.user || !config.pass) {
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

  const subject = "Welcome to PolicyPack!";
  const summary = `Hi ${userName}, welcome to PolicyPack. We're thrilled to have you on board!`;
  
  const html = `
    <div style="font-family:Inter,Arial,sans-serif;max-width:680px;margin:0 auto;padding:24px;background:#ffffff;color:#111827;">
      <h1 style="margin:0 0 12px;font-size:24px;line-height:1.2;">Welcome to PolicyPack!</h1>
      <p style="margin:0 0 20px;font-size:16px;line-height:1.7;color:#4b5563;">Hi ${escapeHtml(userName)},</p>
      <p style="margin:0 0 20px;font-size:16px;line-height:1.7;color:#4b5563;">Thank you for registering. You can now start generating and managing your customized legal documents using our AI-powered engine.</p>
      <p style="margin:0 0 20px;font-size:16px;line-height:1.7;color:#4b5563;">If you have any questions, feel free to reply to this email.</p>
      <p style="margin:0 0 20px;font-size:16px;line-height:1.7;color:#4b5563;">Best,<br/>The PolicyPack Team</p>
    </div>
  `;

  try {
    await transporter.sendMail({
      from: config.from,
      replyTo: config.replyTo,
      to: userEmail,
      subject,
      text: summary,
      html,
    });
    return { ok: true as const, skipped: false as const };
  } catch (error) {
    console.error("Error sending welcome email:", error);
    return { ok: false as const, skipped: false as const };
  }
}

export async function sendPaymentReceiptEmail(userEmail: string, planName: string) {
  const config = getNotificationConfig();

  if (!config.host || !config.user || !config.pass) {
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

  const subject = "PolicyPack - Payment Confirmation";
  const summary = `Thank you for your purchase of the ${planName} package!`;
  
  const html = `
    <div style="font-family:Inter,Arial,sans-serif;max-width:680px;margin:0 auto;padding:24px;background:#ffffff;color:#111827;">
      <h1 style="margin:0 0 12px;font-size:24px;line-height:1.2;">Payment Successful</h1>
      <p style="margin:0 0 20px;font-size:16px;line-height:1.7;color:#4b5563;">Thank you for upgrading to the <strong>${escapeHtml(planName)}</strong> package!</p>
      <p style="margin:0 0 20px;font-size:16px;line-height:1.7;color:#4b5563;">Your premium features are now unlocked. You can export your documents as PDFs and enjoy full access to our platform.</p>
      <p style="margin:0 0 20px;font-size:16px;line-height:1.7;color:#4b5563;">Best,<br/>The PolicyPack Team</p>
    </div>
  `;

  try {
    await transporter.sendMail({
      from: config.from,
      replyTo: config.replyTo,
      to: userEmail,
      subject,
      text: summary,
      html,
    });
    return { ok: true as const, skipped: false as const };
  } catch (error) {
    console.error("Error sending payment receipt email:", error);
    return { ok: false as const, skipped: false as const };
  }
}

export async function checkSmtpConnection() {
  const config = getNotificationConfig();

  if (!config.host || !config.user || !config.pass) {
    return {
      status: "unconfigured",
      message: "SMTP settings are missing (host, user, or pass)",
      config: {
        host: config.host || "missing",
        port: config.port,
        secure: config.secure,
        user: config.user ? "configured" : "missing",
        pass: config.pass ? "configured" : "missing",
      },
    };
  }

  const transporter = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: {
      user: config.user,
      pass: config.pass,
    },
    connectionTimeout: 5000,
    greetingTimeout: 5000,
    socketTimeout: 5000,
  });

  try {
    const isVerified = await transporter.verify();
    return {
      status: isVerified ? "ok" : "error",
      message: isVerified ? "SMTP connection is working" : "Verification failed without throwing",
      config: {
        host: config.host,
        port: config.port,
        secure: config.secure,
        user: "configured",
      },
    };
  } catch (error) {
    return {
      status: "error",
      message: error instanceof Error ? error.message : "Unknown SMTP error",
      config: {
        host: config.host,
        port: config.port,
        secure: config.secure,
        user: "configured",
      },
    };
  }
}
