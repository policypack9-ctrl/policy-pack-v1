import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { isAdminEmailAllowed } from "@/lib/auth-env";
import {
  createNotificationTransporter,
  getNotificationConfig,
  sendAdminNotification,
  sendPromoEndedEmail,
} from "@/lib/notifications";
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

async function notifyPromoUsersInBatches(
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
        const result = await sendPromoEndedEmail(user.email!, user.name ?? "there");
        if (!result.ok) {
          throw new Error(
            result.skipped
              ? "Promo email skipped because professional support sender is not configured."
              : "Promo email delivery failed.",
          );
        }
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
    let notifiedCount = 0;
    const notificationErrors: string[] = [];
    const notificationConfig = getNotificationConfig();

    if (createNotificationTransporter(notificationConfig)) {
      const notificationResult = await notifyPromoUsersInBatches(promoUsers);
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
