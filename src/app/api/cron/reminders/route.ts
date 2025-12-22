import { NextResponse } from "next/server";
import { prisma } from "@/server/prisma";
const webpush = require("web-push");

// web-push требует VAPID
webpush.setVapidDetails(
  process.env.VAPID_SUBJECT!,
  process.env.VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
);

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const secret = searchParams.get("secret");

  if (!process.env.CRON_SECRET || secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();

  const due = await prisma.reminder.findMany({
    where: { status: "scheduled", dueUtc: { lte: now } },
    take: 200,
    orderBy: { dueUtc: "asc" },
  });

  if (!due.length) return NextResponse.json({ ok: true, processed: 0 });

  // группируем по userId, чтобы меньше запросов
  const byUser = new Map<string, typeof due>();
  for (const r of due) {
    byUser.set(r.userId, [...(byUser.get(r.userId) ?? []), r]);
  }

  let processed = 0;

  for (const [userId, items] of byUser.entries()) {
    const settings = await prisma.userSettings.findUnique({ where: { userId } });

    const pauseAll = settings?.pauseAll ?? false;
    const notifyPush = settings?.notifyPush ?? true;
    const notifyInApp = settings?.notifyInApp ?? true;

    // если пауза — логируем skipped и просто помечаем sent (чтобы не зависали)
    if (pauseAll) {
      for (const r of items) {
        await prisma.deliveryLog.create({
          data: {
            userId,
            reminderId: r.id,
            channel: "inapp",
            status: "skipped",
            meta: { reason: "pauseAll" },
          },
        });
      }

      await prisma.reminder.updateMany({
        where: { id: { in: items.map((i) => i.id) } },
        data: { status: "sent", sentAt: now },
      });

      processed += items.length;
      continue;
    }

    const subs = notifyPush
      ? await prisma.pushSubscription.findMany({ where: { userId } })
      : [];

    for (const r of items) {
      // 1) IN-APP notification
      if (notifyInApp) {
        await prisma.notification.create({
          data: {
            userId,
            type: "reminder",
            title: "Напоминание от Mindra",
            body: r.text,
            data: { reminderId: r.id.toString(), dueUtc: r.dueUtc.toISOString() },
          },
        });

        await prisma.deliveryLog.create({
          data: {
            userId,
            reminderId: r.id,
            channel: "inapp",
            status: "ok",
          },
        });
      } else {
        await prisma.deliveryLog.create({
          data: {
            userId,
            reminderId: r.id,
            channel: "inapp",
            status: "skipped",
            meta: { reason: "notifyInApp=false" },
          },
        });
      }

      // 2) WEB PUSH
      if (notifyPush && subs.length) {
        for (const sub of subs) {
          try {
            await webpush.sendNotification(
              {
                endpoint: sub.endpoint,
                keys: { p256dh: sub.p256dh, auth: sub.auth },
              } as any,
              JSON.stringify({
                title: "Mindra",
                body: r.text,
                url: "/en/chat",
              })
            );

            await prisma.deliveryLog.create({
              data: {
                userId,
                reminderId: r.id,
                channel: "push",
                status: "ok",
                meta: { endpoint: sub.endpoint },
              },
            });
          } catch (e: any) {
            await prisma.deliveryLog.create({
              data: {
                userId,
                reminderId: r.id,
                channel: "push",
                status: "fail",
                error: String(e?.message ?? e),
                meta: { endpoint: sub.endpoint },
              },
            });
          }
        }
      } else {
        await prisma.deliveryLog.create({
          data: {
            userId,
            reminderId: r.id,
            channel: "push",
            status: "skipped",
            meta: { reason: notifyPush ? "no_subscriptions" : "notifyPush=false" },
          },
        });
      }

      // 3) reminder -> sent
      await prisma.reminder.update({
        where: { id: r.id },
        data: { status: "sent", sentAt: now },
      });

      processed += 1;
    }
  }

  return NextResponse.json({ ok: true, processed });
}
