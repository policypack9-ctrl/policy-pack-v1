import { NextResponse } from "next/server";
import nodemailer from "nodemailer";

import { auth } from "@/auth";
import { isAdminEmailAllowed } from "@/lib/auth-env";
import { COMPANY_SUPPORT_EMAIL } from "@/lib/company";
import { sendAdminNotification } from "@/lib/notifications";
import {
  getPromoUsers,
  isPromoActiveFromDB,
  logPromoArchive,
  setPromoActiveInDB,
} from "@/lib/promo-settings";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;
const EMAIL_BATCH_SIZE = 10;

function getSmtpTransporter() {
  const host = process.env.SMTP_HOST?.trim() ?? "";
  const user = process.env.SMTP_USER?.trim() ?? "";
  const pass = process.env.SMTP_PASS?.trim() ?? "";

  if (!host || !user || !pass) {
    return null;
  }

  return nodemailer.createTransport({
    host,
    port: Number(process.env.SMTP_PORT ?? "465"),
    secure: process.env.SMTP_SECURE !== "false",
    auth: { user, pass },
  });
}

async function notifyPromoUsersInBatches(
  transporter: NonNullable<ReturnType<typeof getSmtpTransporter>>,
  promoUsers: Awaited<ReturnType<typeof getPromoUsers>>,
) {
  let notifiedCount = 0;
  const notificationErrors: string[] = [];

  for (let index = 0; index < promoUsers.length; index += EMAIL_BATCH_SIZE) {
    const batch = promoUsers
      .slice(index, index + EMAIL_BATCH_SIZE)
      .filter((user) => Boolean(user.email));
    const results = await Promise.allSettled(
      batch.map(async (user) => {
        await transporter.sendMail({
          from: process.env.SMTP_FROM ?? process.env.SMTP_USER,
          replyTo: COMPANY_SUPPORT_EMAIL,
          to: user.email,
          subject: "PolicyPack - Launch Offer Update",
          text: `Hi ${user.name ?? "there"},\n\nThe PolicyPack complimentary launch offer has now ended.\n\nChoose a plan to continue: https://policypack.org/#pricing\n\nThank you,\nThe PolicyPack Team`,
          html: `<div style="font-family:Inter,Arial,sans-serif;max-width:600px;margin:0 auto;padding:24px;">
            <h2 style="color:#111827;">Launch Offer Update</h2>
            <p>Hi ${user.name ?? "there"},</p>
            <p>The PolicyPack complimentary launch offer has now ended.</p>
            <p>To continue generating legal pages, choose a plan:</p>
            <p style="margin:24px 0;"><a href="https://policypack.org/#pricing"
              style="background:#0d9488;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;">
              View Plans
            </a></p>
            <p>Thank you for being an early user!</p>
            <p>The PolicyPack Team<br/>
            <a href="mailto:${COMPANY_SUPPORT_EMAIL}">${COMPANY_SUPPORT_EMAIL}</a></p>
          </div>`,
        });

        return user.email ?? "unknown";
      }),
    );

    results.forEach((result, batchIndex) => {
      const batchUser = batch[batchIndex];

      if (result.status === "fulfilled") {
        notifiedCount++;
        return;
      }

      notificationErrors.push(
        `${batchUser?.email ?? "unknown"}: ${result.reason instanceof Error ? result.reason.message : "unknown"}`,
      );
    });
  }

  return { notifiedCount, notificationErrors };
}

export async function POST() {
  const session = await auth();
  const adminEmail = session?.user?.email ?? "";

  if (!session?.user?.id || !isAdminEmailAllowed(adminEmail)) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  let promoEndedInDb = false;

  try {
    const isActive = await isPromoActiveFromDB();

    if (!isActive) {
      return NextResponse.json({ error: "Promo is already ended." }, { status: 409 });
    }

    const startedAt = Date.now();

    // 1. Snapshot promo users
    const promoUsers = await getPromoUsers();
    const affectedCount = promoUsers.length;

    // 2. End the promo in DB
    await setPromoActiveInDB(false, adminEmail);
    promoEndedInDb = true;

    // 3. Notify all promo users via email
    const transporter = getSmtpTransporter();
    let notifiedCount = 0;
    const notificationErrors: string[] = [];

    if (transporter) {
      const notificationResult = await notifyPromoUsersInBatches(
        transporter,
        promoUsers,
      );
      notifiedCount = notificationResult.notifiedCount;
      notificationErrors.push(...notificationResult.notificationErrors);
    }

    // 4. Build report
    const durationMs = Date.now() - startedAt;
    const report = {
      endedAt: new Date().toISOString(),
      endedBy: adminEmail,
      affectedUsers: affectedCount,
      notifiedUsers: notifiedCount,
      notificationErrors,
      durationMs,
      promoUsersSnapshot: promoUsers.map((user) => ({
        email: user.email,
        createdAt: user.createdAt,
      })),
    };

    // 5. Log archive to DB
    const archiveId = await logPromoArchive({
      endedBy: adminEmail,
      affectedUsers: affectedCount,
      notifiedUsers: notifiedCount,
      report,
    });

    if (!archiveId) {
      throw new Error("Promo archive log did not return an id.");
    }

    // 6. Notify admin
    await sendAdminNotification({
      kind: "payment",
      subject: "PolicyPack - Promo Campaign Ended",
      summary: `The promotional campaign was ended by ${adminEmail}.`,
      details: [
        { label: "Ended By", value: adminEmail },
        { label: "Affected Users", value: String(affectedCount) },
        { label: "Notified Users", value: String(notifiedCount) },
        { label: "Duration", value: `${durationMs}ms` },
        { label: "Archive ID", value: archiveId },
      ],
    });

    return NextResponse.json({ ok: true, archiveId, report });
  } catch (error) {
    if (promoEndedInDb) {
      try {
        await setPromoActiveInDB(true, `rollback:${adminEmail}`);
      } catch {}
    }

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to end the promotional campaign.",
      },
      { status: 500 },
    );
  }
}
