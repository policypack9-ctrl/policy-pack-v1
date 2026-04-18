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

type NotificationConfig = {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  pass: string;
  from: string;
  replyTo: string;
  senderEmail: string;
  approvedSupportSender: string;
  isApprovedUserFacingSender: boolean;
  isProfessionalProvider: boolean;
  provider: string;
  recipients: string[];
};

type OutreachConfig = {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  pass: string;
  from: string;
  replyTo: string;
  senderEmail: string;
  provider: string;
};

const SMTP_PROVIDER_DEFAULTS: Record<
  string,
  { host: string; port: number; secure: boolean }
> = {
  resend: { host: "smtp.resend.com", port: 465, secure: true },
  postmark: { host: "smtp.postmarkapp.com", port: 587, secure: false },
  sendgrid: { host: "smtp.sendgrid.net", port: 587, secure: false },
  mailgun: { host: "smtp.mailgun.org", port: 587, secure: false },
  office365: { host: "smtp.office365.com", port: 587, secure: false },
  zoho: { host: "smtp.zoho.com", port: 465, secure: true },
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

function extractEmailAddress(value: string) {
  const trimmed = value.trim();
  const bracketMatch = trimmed.match(/<([^>]+)>/);
  const candidate = bracketMatch?.[1] ?? trimmed;
  return candidate.trim().toLowerCase();
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

export function getNotificationConfig(): NotificationConfig {
  const configuredHost = process.env.SMTP_HOST?.trim() ?? "";
  const user = process.env.SMTP_USER?.trim() ?? "";
  const provider = process.env.SMTP_PROVIDER?.trim().toLowerCase() ?? "";
  const adminNotificationEmails = process.env.ADMIN_NOTIFICATION_EMAILS?.trim() ?? "";
  const providerDefaults = SMTP_PROVIDER_DEFAULTS[provider];
  const isGmail = provider === "gmail" || /@gmail\.com$/i.test(user);
  const host =
    configuredHost || providerDefaults?.host || (isGmail ? "smtp.gmail.com" : "");
  const port = Number(
    process.env.SMTP_PORT?.trim() ??
      String(providerDefaults?.port ?? (isGmail ? 465 : 465)),
  );
  const secure =
    readBooleanEnv("SMTP_SECURE") ?? providerDefaults?.secure ?? port === 465;
  const recipients = uniqueEmails(
    adminNotificationEmails
      ? parseEmailList(adminNotificationEmails)
      : [COMPANY_SUPPORT_EMAIL.toLowerCase()],
  );
  const from = process.env.SMTP_FROM?.trim() ?? `PolicyPack <${COMPANY_SUPPORT_EMAIL}>`;
  const replyTo = process.env.SMTP_REPLY_TO?.trim() ?? COMPANY_SUPPORT_EMAIL;
  const senderEmail = extractEmailAddress(from || user);
  const approvedSupportSender = COMPANY_SUPPORT_EMAIL.toLowerCase();
  const isProfessionalProvider =
    !isGmail && Boolean(host) && !/@gmail\.com$/i.test(senderEmail);

  return {
    host,
    port,
    secure,
    user,
    pass: process.env.SMTP_PASS?.trim() ?? "",
    from,
    replyTo,
    senderEmail,
    approvedSupportSender,
    isApprovedUserFacingSender: senderEmail === approvedSupportSender,
    isProfessionalProvider,
    provider: provider || "smtp",
    recipients,
  };
}

export function createNotificationTransporter(config: NotificationConfig) {
  if (!config.host || !config.user || !config.pass) {
    return null;
  }

  return nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: {
      user: config.user,
      pass: config.pass,
    },
  });
}

export function getOutreachConfig(): OutreachConfig {
  const configuredHost = process.env.OUTREACH_SMTP_HOST?.trim() ?? "";
  const user = process.env.OUTREACH_SMTP_USER?.trim() ?? "";
  const provider = process.env.OUTREACH_SMTP_PROVIDER?.trim().toLowerCase() ?? "";
  const providerDefaults = SMTP_PROVIDER_DEFAULTS[provider];
  const host = configuredHost || providerDefaults?.host || "";
  const port = Number(
    process.env.OUTREACH_SMTP_PORT?.trim() ??
      String(providerDefaults?.port ?? 465),
  );
  const secure =
    readBooleanEnv("OUTREACH_SMTP_SECURE") ?? providerDefaults?.secure ?? port === 465;
  const from =
    process.env.OUTREACH_SMTP_FROM?.trim() ??
    "PolicyPack Founder <founder@policypack.org>";
  const replyTo =
    process.env.OUTREACH_SMTP_REPLY_TO?.trim() ?? "founder@policypack.org";

  return {
    host,
    port,
    secure,
    user,
    pass: process.env.OUTREACH_SMTP_PASS?.trim() ?? "",
    from,
    replyTo,
    senderEmail: extractEmailAddress(from || user),
    provider: provider || "smtp",
  };
}

export function createOutreachTransporter(config: OutreachConfig) {
  if (!config.host || !config.user || !config.pass) {
    return null;
  }

  return nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: {
      user: config.user,
      pass: config.pass,
    },
  });
}

export function canSendUserFacingEmail(config: NotificationConfig) {
  if (!config.isProfessionalProvider) {
    console.error(
      `User-facing email skipped because SMTP provider is not configured as a professional domain sender. Current provider: ${config.provider}, sender: ${config.senderEmail || "unknown"}.`,
    );
    return false;
  }

  if (!config.isApprovedUserFacingSender) {
    console.error(
      `User-facing email skipped because SMTP_FROM resolves to ${config.senderEmail || "unknown"}, not ${config.approvedSupportSender}.`,
    );
    return false;
  }

  return true;
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

function buildPromoEndedText(userName: string) {
  return [
    `Hi ${userName},`,
    "",
    "The PolicyPack complimentary launch offer has now ended.",
    "",
    `Choose a plan to continue: ${PRICING_URL}`,
    `Need help? Reply to ${COMPANY_SUPPORT_EMAIL}.`,
    "",
    "Thank you,",
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

  const transporter = createNotificationTransporter(config);

  if (!transporter) {
    return { ok: false as const, skipped: true as const };
  }

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

  if (!canSendUserFacingEmail(config)) {
    return { ok: false as const, skipped: true as const };
  }

  const transporter = createNotificationTransporter(config);

  if (!transporter) {
    return { ok: false as const, skipped: true as const };
  }

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

  if (!canSendUserFacingEmail(config)) {
    return { ok: false as const, skipped: true as const };
  }

  const transporter = createNotificationTransporter(config);

  if (!transporter) {
    return { ok: false as const, skipped: true as const };
  }

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

export async function sendPromoEndedEmail(userEmail: string, userName?: string) {
  const config = getNotificationConfig();

  if (!config.host || !config.user || !config.pass) {
    return { ok: false as const, skipped: true as const };
  }

  if (!canSendUserFacingEmail(config)) {
    return { ok: false as const, skipped: true as const };
  }

  const transporter = createNotificationTransporter(config);

  if (!transporter) {
    return { ok: false as const, skipped: true as const };
  }

  const safeUserName = userName?.trim() || "there";
  const subject = "PolicyPack - Launch Offer Update";
  const text = buildPromoEndedText(safeUserName);
  const html = buildMarketingEmailHtml({
    eyebrow: "Launch Offer Update",
    title: "Your complimentary launch offer has ended",
    intro: `Hi ${safeUserName}, the complimentary PolicyPack launch period has now ended.`,
    body: [
      "Your account can continue using PolicyPack by choosing a paid plan from the pricing page.",
      "If you need help choosing the right package for your workflow, reply to this email and our support inbox will pick it up.",
    ],
    actions: [
      { href: PRICING_URL, label: "View Plans" },
      { href: DASHBOARD_URL, label: "Open Dashboard", variant: "secondary" },
    ],
    closing:
      "Thank you for being an early user. If you have any billing or account questions, reply to this email and we will help.",
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
    console.error("Error sending promo-ended email:", error);
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
        provider: config.provider,
        user: config.user ? "configured" : "missing",
        pass: config.pass ? "configured" : "missing",
        senderEmail: config.senderEmail || "missing",
      },
    };
  }

  if (!config.isProfessionalProvider) {
    return {
      status: "error",
      message:
        "SMTP is configured, but it is not using a professional domain sender. Configure a provider for support@policypack.org instead of Gmail or a personal mailbox.",
      config: {
        host: config.host,
        port: config.port,
        secure: config.secure,
        provider: config.provider,
        senderEmail: config.senderEmail || "missing",
      },
    };
  }

  if (!config.isApprovedUserFacingSender) {
    return {
      status: "error",
      message:
        "SMTP is connected, but SMTP_FROM does not match support@policypack.org. User-facing email remains blocked until sender alignment is fixed.",
      config: {
        host: config.host,
        port: config.port,
        secure: config.secure,
        provider: config.provider,
        senderEmail: config.senderEmail || "missing",
        approvedSupportSender: config.approvedSupportSender,
      },
    };
  }

  const transporter = createNotificationTransporter(config);

  if (!transporter) {
    return {
      status: "unconfigured",
      message: "SMTP transporter could not be created.",
      config: {
        host: config.host || "missing",
        port: config.port,
        secure: config.secure,
        provider: config.provider,
        user: config.user ? "configured" : "missing",
        pass: config.pass ? "configured" : "missing",
      },
    };
  }

  transporter.options.connectionTimeout = 5000;
  transporter.options.greetingTimeout = 5000;
  transporter.options.socketTimeout = 5000;

  try {
    const isVerified = await transporter.verify();
    return {
      status: isVerified ? "ok" : "error",
      message: isVerified ? "SMTP connection is working" : "Verification failed without throwing",
      config: {
        host: config.host,
        port: config.port,
        secure: config.secure,
        provider: config.provider,
        senderEmail: config.senderEmail,
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
        provider: config.provider,
        senderEmail: config.senderEmail,
        user: "configured",
      },
    };
  }
}

export async function checkOutreachSmtpConnection() {
  const config = getOutreachConfig();

  if (!config.host || !config.user || !config.pass) {
    return {
      status: "unconfigured",
      message: "Outreach SMTP settings are missing (host, user, or pass)",
      config: {
        host: config.host || "missing",
        port: config.port,
        secure: config.secure,
        provider: config.provider,
        user: config.user ? "configured" : "missing",
        pass: config.pass ? "configured" : "missing",
        senderEmail: config.senderEmail || "missing",
      },
    };
  }

  const transporter = createOutreachTransporter(config);

  if (!transporter) {
    return {
      status: "unconfigured",
      message: "Outreach SMTP transporter could not be created.",
      config: {
        host: config.host || "missing",
        port: config.port,
        secure: config.secure,
        provider: config.provider,
        user: config.user ? "configured" : "missing",
        pass: config.pass ? "configured" : "missing",
      },
    };
  }

  transporter.options.connectionTimeout = 5000;
  transporter.options.greetingTimeout = 5000;
  transporter.options.socketTimeout = 5000;

  try {
    const isVerified = await transporter.verify();
    return {
      status: isVerified ? "ok" : "error",
      message: isVerified
        ? "Outreach SMTP connection is working"
        : "Verification failed without throwing",
      config: {
        host: config.host,
        port: config.port,
        secure: config.secure,
        provider: config.provider,
        senderEmail: config.senderEmail,
        user: "configured",
      },
    };
  } catch (error) {
    return {
      status: "error",
      message: error instanceof Error ? error.message : "Unknown outreach SMTP error",
      config: {
        host: config.host,
        port: config.port,
        secure: config.secure,
        provider: config.provider,
        senderEmail: config.senderEmail,
        user: "configured",
      },
    };
  }
}

export async function sendOutreachTestEmail(to: string) {
  const config = getOutreachConfig();

  if (!config.host || !config.user || !config.pass) {
    return { ok: false as const, skipped: true as const };
  }

  const transporter = createOutreachTransporter(config);

  if (!transporter) {
    return { ok: false as const, skipped: true as const };
  }

  const subject = "PolicyPack outreach SMTP test";
  const text = [
    "This is a test email from the PolicyPack outreach sender.",
    "",
    "If you received this, founder outreach SMTP is configured correctly.",
    "",
    `From: ${config.from}`,
    `Reply-To: ${config.replyTo}`,
  ].join("\n");

  const html = buildMarketingEmailHtml({
    eyebrow: "Outreach SMTP Test",
    title: "Founder outreach sender is working",
    intro: "This is a test email from the dedicated PolicyPack founder mailbox.",
    body: [
      "If this email reached your inbox, the outreach sender is configured separately from support and user-facing transactional emails.",
      "This setup is what we will use later for founder-led outreach and audit follow-ups.",
    ],
    actions: [{ href: COMPANY_PRIMARY_URL, label: "Open PolicyPack" }],
    closing:
      "No action is needed. This message was sent only to verify the outreach email channel.",
  });
  const attachments = await getEmailLogoAttachments();

  try {
    await transporter.sendMail({
      attachments,
      from: config.from,
      replyTo: config.replyTo,
      to,
      subject,
      text,
      html,
    });
    return { ok: true as const, skipped: false as const };
  } catch (error) {
    console.error("Error sending outreach test email:", error);
    return { ok: false as const, skipped: false as const };
  }
}
