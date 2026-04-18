import "server-only";

import { readFile } from "node:fs/promises";
import { join } from "node:path";
import nodemailer from "nodemailer";

import { COMPANY_BRAND_NAME, COMPANY_PRIMARY_URL } from "@/lib/company";

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

const EMAIL_LOGO_CID = "policy-pack-logo";
const EMAIL_LOGO_PATH = join(process.cwd(), "public", "icon.png");

function readBooleanEnv(key: string) {
  const value = process.env[key]?.trim().toLowerCase();
  if (!value) {
    return null;
  }

  return value !== "false";
}

function extractEmailAddress(value: string) {
  const trimmed = value.trim();
  const bracketMatch = trimmed.match(/<([^>]+)>/);
  const candidate = bracketMatch?.[1] ?? trimmed;
  return candidate.trim().toLowerCase();
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

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
    console.error("Error loading outreach email logo:", error);
    return [];
  }
}

function buildOutreachTestHtml(config: OutreachConfig) {
  return `
    <div style="margin:0;padding:32px 16px;background:#f8fafc;font-family:Arial,Helvetica,sans-serif;color:#0f172a;">
      <div style="max-width:680px;margin:0 auto;background:#ffffff;border:1px solid #e2e8f0;border-radius:24px;overflow:hidden;">
        <div style="padding:24px;background:#0f172a;">
          <table role="presentation" cellspacing="0" cellpadding="0" border="0">
            <tr>
              <td style="width:52px;">
                <img
                  src="cid:${EMAIL_LOGO_CID}"
                  alt="${escapeHtml(COMPANY_BRAND_NAME)}"
                  width="48"
                  height="48"
                  style="display:block;width:48px;height:48px;border:0;"
                />
              </td>
              <td style="padding-left:12px;font-size:24px;font-weight:800;line-height:1.2;color:#ffffff;">
                ${escapeHtml(COMPANY_BRAND_NAME)}
              </td>
            </tr>
          </table>
          <p style="margin:18px 0 8px;font-size:11px;font-weight:700;letter-spacing:0.24em;text-transform:uppercase;color:#99f6e4;">
            Outreach SMTP Test
          </p>
          <h1 style="margin:0;font-size:32px;line-height:1.15;font-weight:800;color:#ffffff;">
            Founder outreach sender is working
          </h1>
        </div>
        <div style="padding:28px;">
          <p style="margin:0 0 16px;font-size:15px;line-height:1.8;color:#475569;">
            This is a test email from the dedicated PolicyPack founder mailbox.
          </p>
          <p style="margin:0 0 16px;font-size:15px;line-height:1.8;color:#475569;">
            If this email reached your inbox, the outreach sender is configured separately from support and transactional email.
          </p>
          <p style="margin:0 0 16px;font-size:14px;line-height:1.8;color:#475569;">
            Sender: <strong>${escapeHtml(config.from)}</strong><br />
            Reply-To: <strong>${escapeHtml(config.replyTo)}</strong>
          </p>
          <a
            href="${escapeHtml(COMPANY_PRIMARY_URL)}"
            style="display:inline-block;padding:14px 22px;border-radius:999px;border:1px solid #14b8a6;background:#14b8a6;color:#041312;font-size:14px;font-weight:700;line-height:1;text-decoration:none;"
          >
            Open PolicyPack
          </a>
        </div>
      </div>
    </div>
  `;
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
  const attachments = await getEmailLogoAttachments();

  try {
    await transporter.sendMail({
      attachments,
      from: config.from,
      replyTo: config.replyTo,
      to,
      subject,
      text,
      html: buildOutreachTestHtml(config),
    });
    return { ok: true as const, skipped: false as const };
  } catch (error) {
    console.error("Error sending outreach test email:", error);
    return { ok: false as const, skipped: false as const };
  }
}
