// src/app/api/cron/reminders/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/server/prisma";
import webpush from "web-push";
import { authorizeCron } from "@/server/cronAuth";

export const runtime = "nodejs";

function mustEnv(name: string) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env: ${name}`);
  return v;
}

function setupWebPushOnce() {
  webpush.setVapidDetails(
    mustEnv("VAPID_SUBJECT"),
    mustEnv("VAPID_PUBLIC_KEY"),
    mustEnv("VAPID_PRIVATE_KEY")
  );
}

function safeTz(tz: string) {
  try {
    Intl.DateTimeFormat("en-US", { timeZone: tz }).format(new Date());
    return tz;
  } catch {
    return "UTC";
  }
}

function getHourInTz(date: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hour: "2-digit",
    hour12: false,
  }).formatToParts(date);
  const hour = parts.find((p) => p.type === "hour")?.value ?? "00";
  return Number(hour);
}

function isQuietNow(now: Date, tz: string, quietStart: number, quietEnd: number) {
  if (quietStart === quietEnd) return false;
  const h = getHourInTz(now, tz);
  if (quietStart < quietEnd) return h >= quietStart && h < quietEnd;
  return h >= quietStart || h < quietEnd;
}

function minutesUntil(now: Date, due: Date) {
  return Math.floor((due.getTime() - now.getTime()) / 60000);
}

// вычислить ближайший "конец quiet" в UTC (на основе TZ)
function computeQuietEndUtc(now: Date, tz: string, quietStart: number, quietEnd: number) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);

  const y = Number(parts.find((p) => p.type === "year")?.value);
  const m = Number(parts.find((p) => p.type === "month")?.value);
  const d = Number(parts.find((p) => p.type === "day")?.value);

  const hNow = getHourInTz(now, tz);

  let addDay = 0;
  if (quietStart > quietEnd) {
    // через ночь (22..8)
    addDay = hNow >= quietStart ? 1 : 0;
  }

  const rough = new Date(Date.UTC(y, m - 1, d + addDay, quietEnd, 0, 0));

  const tzParts = new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(rough);

  const tzH = Number(tzParts.find((p) => p.type === "hour")?.value ?? "0");
  const tzM = Number(tzParts.find((p) => p.type === "minute")?.value ?? "0");

  const diffMin = quietEnd * 60 - (tzH * 60 + tzM);
  return new Date(rough.getTime() + diffMin * 60000);
}

/** 11 языков: ru, uk, en, es, de, pl, fr, ro, hy, ka, kk */
const REMINDER_TITLE_BY_LANG: Record<string, string> = {
  ru: "Напоминание от Mindra",
  uk: "Нагадування від Mindra",
  en: "Reminder from Mindra",
  es: "Recordatorio de Mindra",
  de: "Erinnerung von Mindra",
  pl: "Przypomnienie od Mindra",
  fr: "Rappel de Mindra",
  ro: "Memento de la Mindra",
  hy: "Հիշեցում Mindra-ից",
  ka: "შეხსენება Mindra-სგან",
  kk: "Mindra-дан еске салу",
};

function normalizeLang(lang?: string | null) {
  if (!lang) return "ru";
  const s = String(lang).trim();
  if (!s) return "ru";
  const base = s.split("-")[0].toLowerCase();
  return REMINDER_TITLE_BY_LANG[base] ? base : "ru";
}

function getReminderTitle(lang?: string | null) {
  const key = normalizeLang(lang);
  return REMINDER_TITLE_BY_LANG[key] ?? REMINDER_TITLE_BY_LANG.ru;
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const force = searchParams.get("force") === "1";

  if (!authorizeCron(req)) {
  return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
}

  setupWebPushOnce();

  const now = new Date();

  const scheduledCount = await prisma.reminder.count({ where: { status: "scheduled" } });

  // ⚠️ Пока snoozeUntilUtc ещё может отсутствовать в Prisma types — делаем where через any
  const due = await prisma.reminder.findMany({
    where: {
      status: "scheduled",
      OR: [
        { snoozeUntilUtc: { lte: now } } as any,
        { snoozeUntilUtc: null, dueUtc: { lte: now } } as any,
      ],
    } as any,
    take: 200,
    orderBy: [{ snoozeUntilUtc: "asc" } as any, { dueUtc: "asc" }],
  });

  const minDue = await prisma.reminder.findFirst({
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
      minScheduled: minDue ? { id: minDue.id.toString(), dueUtc: minDue.dueUtc } : null,
      dueCount: 0,
    });
  }

  const byUser = new Map<string, typeof due>();
  for (const r of due) {
    byUser.set(r.userId, [...(byUser.get(r.userId) ?? []), r]);
  }

  let processed = 0;

  for (const [userId, items] of byUser.entries()) {
    const settings = await prisma.userSettings.findUnique({ where: { userId } });

    const tz = (settings as any)?.tz ?? "America/New_York";
    const pauseAll = (settings as any)?.pauseAll ?? false;

    const notifyInApp = (settings as any)?.notifyInApp ?? true;
    const notifyPush = (settings as any)?.notifyPush ?? true;

    const quietEnabled = (settings as any)?.quietEnabled ?? true; // может не существовать в типах
    const quietStart = (settings as any)?.quietStart ?? 22;
    const quietEnd = (settings as any)?.quietEnd ?? 8;
    const quietBypassMin = (settings as any)?.quietBypassMin ?? 30;

    const lang =
      (settings as any)?.lang ??
      (settings as any)?.locale ??
      (settings as any)?.language ??
      "ru";

    const langNorm = normalizeLang(lang);
    const title = getReminderTitle(lang);

    const quietNow = quietEnabled ? isQuietNow(now, tz, quietStart, quietEnd) : false;

    // пуш-подписки грузим 1 раз на юзера
    const subs = notifyPush ? await prisma.pushSubscription.findMany({ where: { userId } }) : [];

    for (const r of items) {
      const effectiveDue: Date = ((r as any).snoozeUntilUtc ?? r.dueUtc) as Date;
      const isUrgent = (r as any).urgent === true;

      // 1) Quiet/pause handling: переносим, а не "sent"
      if (!force && (pauseAll || quietNow)) {
        const deltaMin = minutesUntil(now, effectiveDue);
        const bypass = !pauseAll && (isUrgent || deltaMin <= quietBypassMin);

        if (!bypass) {
          const snoozeUntil = pauseAll
            ? new Date(now.getTime() + 30 * 60000)
            : computeQuietEndUtc(now, tz, quietStart, quietEnd);

          // если поля snoozeUntilUtc ещё нет в БД — этот update упадёт.
          // поэтому оборачиваем в try и просто логируем, чтобы cron не падал.
          try {
            await prisma.reminder.update({
              where: { id: r.id },
              data: { snoozeUntilUtc: snoozeUntil } as any,
            });
          } catch (e) {
            // если ещё нет колонки — просто пропускаем (но тогда reminder будет дёргаться каждый тик)
            console.log("[CRON] snoozeUntilUtc missing in DB? update failed:", (e as any)?.message);
          }

          await prisma.deliveryLog.createMany({
            data: [
              {
                userId,
                reminderId: r.id,
                channel: "inapp",
                status: "skipped",
                error: pauseAll ? "pauseAll=true" : "quietHours",
                meta: { snoozeUntil, tz, quietStart, quietEnd, quietEnabled, quietBypassMin },
              },
              {
                userId,
                reminderId: r.id,
                channel: "push",
                status: "skipped",
                error: pauseAll ? "pauseAll=true" : "quietHours",
                meta: { snoozeUntil, tz, quietStart, quietEnd, quietEnabled, quietBypassMin },
              },
            ],
          });

          processed += 1;
          continue;
        }
      }

      // 2) IN-APP
      let sentInApp = false;
      let notificationId: bigint | null = null;

      if (notifyInApp) {
        const notif = await prisma.notification.create({
          data: {
            userId,
            type: "reminder",
            title,
            body: r.text,
            data: { reminderId: r.id.toString() },
          },
        });

        notificationId = notif.id;
        sentInApp = true;

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

      // 3) PUSH
      let sentPush = false;

      if (notifyPush && subs.length) {
        for (const sub of subs) {
          try {
            const payload = {
              title,
              body: r.text,
              url: `/${langNorm}/chat`,
              icon: "/icons/icon-192.png",
              badge: "/icons/badge-72.png",
              tag: `reminder-${r.id}`,
              renotify: true,
              data: {
                reminderId: r.id.toString(),
                userId,
                url: `/${langNorm}/chat`,
              },
            };

            await webpush.sendNotification(
              {
                endpoint: sub.endpoint,
                keys: { p256dh: sub.p256dh, auth: sub.auth },
              } as any,
              JSON.stringify(payload)
            );

            sentPush = true;

            await prisma.deliveryLog.create({
              data: {
                userId,
                reminderId: r.id,
                channel: "push",
                status: "ok",
                meta: {
                  endpoint: sub.endpoint,
                  notificationId: notificationId ? notificationId.toString() : null,
                  tag: payload.tag,
                  url: payload.url,
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
            error: notifyPush ? "no subscriptions" : "notifyPush=false",
          },
        });
      }

      // 4) ✅ mark sent ONLY if реально доставили хотя бы в один канал
      if (sentInApp || sentPush) {
        await prisma.reminder.update({
          where: { id: r.id },
          data: {
            status: "sent",
            sentAt: now,
            snoozeUntilUtc: null,
          } as any,
        });
      } else {
        // если ничего не доставили — не теряем reminder, попробуем позже
        try {
          await prisma.reminder.update({
            where: { id: r.id },
            data: { snoozeUntilUtc: new Date(now.getTime() + 10 * 60000) } as any,
          });
        } catch {}
      }

      processed += 1;
    }
  }

  return NextResponse.json({
    ok: true,
    processed,
    now: now.toISOString(),
    scheduledCount,
    minScheduled: minDue ? { id: minDue.id.toString(), dueUtc: minDue.dueUtc } : null,
    dueCount: due.length,
  });
}
