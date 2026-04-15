import "server-only";

import { readFile } from "node:fs/promises";
import { join } from "node:path";
import nodemailer from "nodemailer";
import {
  COMPANY_BRAND_NAME,
  COMPANY_PRIMARY_URL,
  COMPANY_SUPPORT_EMAIL,
} from "@/lib/company";

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

type MarketingEmailAction = {
  href: string;
  label: string;
  variant?: "primary" | "secondary";
};

type MarketingEmailInput = {
  eyebrow: string;
  title: string;
  intro: string;
  body: string[];
  highlights?: string[];
  actions: MarketingEmailAction[];
  closing: string;
};

const DASHBOARD_URL = `${COMPANY_PRIMARY_URL}/dashboard`;
const EMAIL_LOGO_CID = "policy-pack-logo";
const EMAIL_LOGO_PATH = join(process.cwd(), "public", "icon.png");
const PRICING_URL = `${COMPANY_PRIMARY_URL}/pricing`;

async function getEmailLogoAttachments() {
  try {
    const content = await readFile(EMAIL_LOGO_PATH);

    return [
      {
        filename: "policy-pack-icon.png",
        content,
        contentType: "image/png",
        cid: EMAIL_LOGO_CID,
      },
    ];
  } catch (error) {
    console.error("Error loading email logo:", error);
    return [];
  }
}

function buildButtonHtml(action: MarketingEmailAction) {
  const isPrimary = action.variant !== "secondary";
  const background = isPrimary ? "#14b8a6" : "#ecfeff";
  const color = isPrimary ? "#041312" : "#0f766e";
  const border = isPrimary ? "#14b8a6" : "#99f6e4";

  return `
    <a
      href="${escapeHtml(action.href)}"
      style="display:inline-block;padding:14px 22px;border-radius:999px;border:1px solid ${border};background:${background};color:${color};font-size:14px;font-weight:700;line-height:1;text-decoration:none;"
    >
      ${escapeHtml(action.label)}
    </a>
  `;
}

function buildMarketingEmailHtml(input: MarketingEmailInput) {
  const paragraphs = input.body
    .map(
      (paragraph) =>
        `<p style="margin:0 0 16px;font-size:15px;line-height:1.8;color:#475569;">${escapeHtml(paragraph)}</p>`,
    )
    .join("");

  const highlights = (input.highlights ?? [])
    .map(
      (item) =>
        `<tr><td style="padding:0 0 12px 0;font-size:14px;line-height:1.7;color:#0f172a;"><span style="display:inline-block;width:8px;height:8px;border-radius:999px;background:#14b8a6;margin-right:10px;"></span>${escapeHtml(item)}</td></tr>`,
    )
    .join("");

  const actions = input.actions.map(buildButtonHtml).join("&nbsp;");

  return `
    <div style="margin:0;padding:32px 16px;background:#f8fafc;font-family:Arial,Helvetica,sans-serif;color:#0f172a;">
      <div style="max-width:680px;margin:0 auto;background:#ffffff;border:1px solid #e2e8f0;border-radius:28px;overflow:hidden;box-shadow:0 24px 60px rgba(15,23,42,0.08);">
        <div style="height:6px;background:#14b8a6;font-size:0;line-height:0;">&nbsp;</div>
        <div style="padding:28px 28px 20px;background-color:#0f172a;">
          <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="border-collapse:collapse;">
            <tr>
              <td style="width:52px;">
                <img
                  src="cid:${EMAIL_LOGO_CID}"
                  alt="${escapeHtml(COMPANY_BRAND_NAME)}"
                  width="48"
                  height="48"
                  style="display:block;width:48px;height:48px;border:0;outline:none;"
                />
              </td>
              <td style="padding-left:12px;font-size:24px;font-weight:800;line-height:1.2;color:#ffffff;">
                ${escapeHtml(COMPANY_BRAND_NAME)}
              </td>
            </tr>
          </table>
          <p style="margin:20px 0 10px;font-size:11px;font-weight:700;letter-spacing:0.24em;text-transform:uppercase;color:#99f6e4;">
            ${escapeHtml(input.eyebrow)}
          </p>
          <h1 style="margin:0 0 12px;font-size:34px;line-height:1.15;font-weight:800;color:#ffffff;">
            ${escapeHtml(input.title)}
          </h1>
          <p style="margin:0;font-size:16px;line-height:1.8;color:#dbeafe;">
            ${escapeHtml(input.intro)}
          </p>
        </div>
        <div style="padding:28px;">
          ${paragraphs}
          ${
            highlights
              ? `<table role="presentation" cellspacing="0" cellpadding="0" border="0" style="width:100%;margin:8px 0 18px;">${highlights}</table>`
              : ""
          }
          <div style="margin:26px 0 20px;">
            ${actions}
          </div>
          <p style="margin:0 0 18px;font-size:14px;line-height:1.8;color:#475569;">
            ${escapeHtml(input.closing)}
          </p>
          <div style="margin-top:28px;padding-top:18px;border-top:1px solid #e2e8f0;">
            <p style="margin:0 0 10px;font-size:12px;line-height:1.7;color:#64748b;">
              Need help? Reply to this email or contact
              <a href="mailto:${COMPANY_SUPPORT_EMAIL}" style="color:#0f766e;text-decoration:none;font-weight:700;">${COMPANY_SUPPORT_EMAIL}</a>.
            </p>
            <p style="margin:0;font-size:12px;line-height:1.7;color:#64748b;">
              <a href="${COMPANY_PRIMARY_URL}" style="color:#0f766e;text-decoration:none;font-weight:700;">Website</a>
              &nbsp;|&nbsp;
              <a href="${DASHBOARD_URL}" style="color:#0f766e;text-decoration:none;font-weight:700;">Dashboard</a>
              &nbsp;|&nbsp;
              <a href="${PRICING_URL}" style="color:#0f766e;text-decoration:none;font-weight:700;">Pricing</a>
            </p>
          </div>
        </div>
      </div>
    </div>
  `;
}

function buildWelcomeEmailText(userName: string) {
  return [
    `Welcome to ${COMPANY_BRAND_NAME}, ${userName}!`,
    "",
    "You are all set to start building polished legal pages for your SaaS or online business.",
    "Inside your workspace you can generate policies faster, keep your documents organized, and move from draft to launch with more confidence.",
    "",
    "Start here:",
    `- Open your dashboard: ${DASHBOARD_URL}`,
    `- Visit the website: ${COMPANY_PRIMARY_URL}`,
    `- Contact support: mailto:${COMPANY_SUPPORT_EMAIL}`,
    "",
    "We are excited to help you launch with clarity.",
    `The ${COMPANY_BRAND_NAME} Team`,
  ].join("\n");
}

function buildPaymentReceiptText(planName: string) {
  return [
    "Payment successful.",
    "",
    `Your ${planName} plan is now active in ${COMPANY_BRAND_NAME}.`,
    "Your workspace has been upgraded and your premium billing flow is confirmed.",
    "",
    "Useful links:",
    `- Open your dashboard: ${DASHBOARD_URL}`,
    `- Review your workspace: ${COMPANY_PRIMARY_URL}`,
    `- Get support: mailto:${COMPANY_SUPPORT_EMAIL}`,
    "",
    `Thanks for choosing ${COMPANY_BRAND_NAME}.`,
    `The ${COMPANY_BRAND_NAME} Team`,
  ].join("\n");
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

  const safeUserName = userName.trim() || "there";
  const subject = `Welcome to ${COMPANY_BRAND_NAME}`;
  const text = buildWelcomeEmailText(safeUserName);
  const html = buildMarketingEmailHtml({
    eyebrow: "New Workspace Ready",
    title: "Your PolicyPack workspace is ready",
    intro: `Hi ${safeUserName}, your account is ready and your workspace is waiting for you.`,
    body: [
      "You can now create polished legal pages for your product faster, with a cleaner workflow and launch-ready structure built for growing SaaS teams.",
      "We designed PolicyPack to help you move from setup to a confident public launch without getting buried in messy templates or scattered policy drafts.",
    ],
    highlights: [
      "Generate policy pages faster from one central workspace.",
      "Keep documents organized as your product, billing, and compliance needs grow.",
      "Jump back into your dashboard any time and continue where you left off.",
    ],
    actions: [
      { href: DASHBOARD_URL, label: "Open Dashboard" },
      { href: COMPANY_PRIMARY_URL, label: "Visit Website", variant: "secondary" },
    ],
    closing:
      "If you need a hand with setup, billing, or your first document flow, just reply to this email and we will help.",
  });
  const attachments = await getEmailLogoAttachments();

  try {
    await transporter.sendMail({
      attachments,
      from: config.from,
      replyTo: config.replyTo,
      to: userEmail,
      subject,
      text,
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

  const safePlanName = planName.trim() || "PolicyPack";
  const subject = `${COMPANY_BRAND_NAME} payment confirmed`;
  const text = buildPaymentReceiptText(safePlanName);
  const html = buildMarketingEmailHtml({
    eyebrow: "Payment Confirmed",
    title: "Your plan is now active",
    intro: `Your ${safePlanName} purchase has been confirmed successfully and your upgraded workspace is ready.`,
    body: [
      "Thanks for choosing PolicyPack. Your billing was processed successfully and your account now has access to the features included with your selected plan.",
      "This is the best time to jump back in, finish your legal pages, and move your launch forward while everything is fresh and ready to publish.",
    ],
    highlights: [
      `Active package: ${safePlanName}`,
      "Access your workspace and continue your document flow right away.",
      "Export, review, and manage your pages from one place.",
    ],
    actions: [
      { href: DASHBOARD_URL, label: "Open Dashboard" },
      { href: PRICING_URL, label: "View Plans", variant: "secondary" },
    ],
    closing:
      "If anything looks off with your billing or account access, reply to this email and we will sort it out quickly.",
  });
  const attachments = await getEmailLogoAttachments();

  try {
    await transporter.sendMail({
      attachments,
      from: config.from,
      replyTo: config.replyTo,
      to: userEmail,
      subject,
      text,
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
