// src/app/api/cron/reminders/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/server/prisma";
import webpush from "web-push";

function mustEnv(name: string) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env: ${name}`);
  return v;
}

function getHourInTz(date: Date, timeZone: string) {
  // вернёт число 0..23
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hour: "2-digit",
    hour12: false,
  }).formatToParts(date);

  const hour = parts.find((p) => p.type === "hour")?.value ?? "00";
  return Number(hour);
}

function isQuietNow(now: Date, tz: string, quietStart: number, quietEnd: number) {
  const h = getHourInTz(now, tz);

  // quietStart=22 quietEnd=8 => тихо: [22..23] + [0..7]
  if (quietStart === quietEnd) return false; // отключено

  if (quietStart < quietEnd) {
    return h >= quietStart && h < quietEnd; // обычный интервал
  }
  return h >= quietStart || h < quietEnd; // через полночь
}

// WebPush (серверные env, НЕ NEXT_PUBLIC)
webpush.setVapidDetails(
  mustEnv("VAPID_SUBJECT"), // mailto:support@mindra.group
  mustEnv("VAPID_PUBLIC_KEY"),
  mustEnv("VAPID_PRIVATE_KEY")
);

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const secret = searchParams.get("secret");

  if (!process.env.CRON_SECRET || secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();

  // 1) берём due reminders
  const due = await prisma.reminder.findMany({
    where: { status: "scheduled", dueUtc: { lte: now } },
    take: 200,
    orderBy: { dueUtc: "asc" },
  });

  // Диагностика (чтоб ты видел что cron реально видит)
  const scheduledCount = await prisma.reminder.count({
    where: { status: "scheduled" },
  });
  const minScheduled = await prisma.reminder.findFirst({
    where: { status: "scheduled" },
    orderBy: { dueUtc: "asc" },
    select: { id: true, dueUtc: true },
  });

  if (!due.length) {
    return NextResponse.json({
      ok: true,
      processed: 0,
      now: now.toISOString(),
      scheduledCount,
      minScheduled: minScheduled
        ? { id: minScheduled.id.toString(), dueUtc: minScheduled.dueUtc.toISOString() }
        : null,
      dueCount: 0,
    });
  }

  // 2) группируем по userId
  const byUser = new Map<string, typeof due>();
  for (const r of due) {
    byUser.set(r.userId, [...(byUser.get(r.userId) ?? []), r]);
  }

  let processed = 0;

  for (const [userId, items] of byUser.entries()) {
    const settings = await prisma.userSettings.findUnique({ where: { userId } });

    const tz = settings?.tz ?? "UTC";
    const pauseAll = settings?.pauseAll ?? false;
    const notifyInApp = settings?.notifyInApp ?? true;
    const notifyPush = settings?.notifyPush ?? true;
    const quietStart = settings?.quietStart ?? 22;
    const quietEnd = settings?.quietEnd ?? 8;

    const quiet = isQuietNow(now, tz, quietStart, quietEnd);

    // PAUSE: ничего не отправляем, но чтобы не “жечь” reminders бесконечно —
    // пометим их как sent (иначе будет тот же вечный цикл, как quietHours)
    if (pauseAll) {
      await prisma.deliveryLog.createMany({
        data: items.map((r) => ({
          userId,
          reminderId: r.id,
          channel: "inapp",
          status: "skipped",
          error: "pauseAll=true",
          meta: { reason: "pauseAll", tz, quietStart, quietEnd },
        })),
      });

      await prisma.deliveryLog.createMany({
        data: items.map((r) => ({
          userId,
          reminderId: r.id,
          channel: "push",
          status: "skipped",
          error: "pauseAll=true",
          meta: { reason: "pauseAll", tz, quietStart, quietEnd },
        })),
      });

      await prisma.reminder.updateMany({
        where: { id: { in: items.map((i) => i.id) } },
        data: { status: "sent", sentAt: now },
      });

      processed += items.length;
      continue;
    }

    // подтягиваем пуш-подписки один раз на юзера
    const subs =
      notifyPush && !quiet
        ? await prisma.pushSubscription.findMany({ where: { userId } })
        : [];

    for (const r of items) {
      // 3) In-App notification (делаем независимо от quietHours)
      let notificationId: bigint | null = null;

      if (notifyInApp) {
        const notif = await prisma.notification.create({
          data: {
            userId,
            type: "reminder",
            title: "Напоминание от Mindra",
            body: r.text,
            data: { reminderId: r.id.toString() },
          },
        });

        notificationId = notif.id;

        await prisma.deliveryLog.create({
          data: {
            userId,
            reminderId: r.id,
            channel: "inapp",
            status: "ok",
            meta: { notificationId: notif.id.toString() },
          },
        });
      } else {
        await prisma.deliveryLog.create({
          data: {
            userId,
            reminderId: r.id,
            channel: "inapp",
            status: "skipped",
            error: "notifyInApp=false",
          },
        });
      }

      // 4) PUSH: если quietHours — НЕ шлём, но логируем причину (и без спама)
      if (quiet) {
        await prisma.deliveryLog.create({
          data: {
            userId,
            reminderId: r.id,
            channel: "push",
            status: "skipped",
            error: "quietHours",
            meta: { tz, quietStart, quietEnd, notificationId: notificationId?.toString() ?? null },
          },
        });
      } else if (!notifyPush) {
        await prisma.deliveryLog.create({
          data: {
            userId,
            reminderId: r.id,
            channel: "push",
            status: "skipped",
            error: "notifyPush=false",
          },
        });
      } else if (!subs.length) {
        await prisma.deliveryLog.create({
          data: {
            userId,
            reminderId: r.id,
            channel: "push",
            status: "skipped",
            error: "no subscriptions",
          },
        });
      } else {
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
                meta: {
                  endpoint: sub.endpoint,
                  notificationId: notificationId ? notificationId.toString() : null,
                },
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
                meta: {
                  endpoint: sub.endpoint,
                  notificationId: notificationId ? notificationId.toString() : null,
                },
              },
            });
          }
        }
      }

      // 5) ВСЕГДА отмечаем reminder -> sent (иначе будет вечный повтор)
      await prisma.reminder.update({
        where: { id: r.id },
        data: { status: "sent", sentAt: now },
      });

      processed += 1;
    }
  }

  return NextResponse.json({
    ok: true,
    processed,
    now: now.toISOString(),
    scheduledCount,
    minScheduled: minScheduled
      ? { id: minScheduled.id.toString(), dueUtc: minScheduled.dueUtc.toISOString() }
      : null,
    dueCount: due.length,
  });
}
