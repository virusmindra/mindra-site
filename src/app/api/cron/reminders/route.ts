// src/app/api/cron/reminders/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/server/prisma";
import webpush from "web-push";

export const runtime = "nodejs";

function mustEnv(name: string) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env: ${name}`);
  return v;
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

function setupWebPushOnce() {
  webpush.setVapidDetails(
    mustEnv("VAPID_SUBJECT"),
    mustEnv("VAPID_PUBLIC_KEY"),
    mustEnv("VAPID_PRIVATE_KEY")
  );
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
  // "ru-RU" -> "ru"
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
  console.log("[CRON] tick", new Date().toISOString(), "force=", force);

  const expected = process.env.CRON_SECRET || "";
  const auth = req.headers.get("authorization") || "";
  const bearer = auth.startsWith("Bearer ") ? auth.slice(7) : "";

  // ✅ Только Bearer. Никаких ?secret=
  if (!expected || bearer !== expected) {
    console.log("[CRON] unauthorized", { hasBearer: !!bearer });
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  console.log("[CRON] tick", new Date().toISOString(), "force=", force);
  
  setupWebPushOnce();

  const now = new Date();

  const scheduledCount = await prisma.reminder.count({ where: { status: "scheduled" } });

  const due = await prisma.reminder.findMany({
    where: { status: "scheduled", dueUtc: { lte: now } },
    take: 200,
    orderBy: { dueUtc: "asc" },
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
    const quietStart = (settings as any)?.quietStart ?? 22;
    const quietEnd = (settings as any)?.quietEnd ?? 8;

    // язык (подставь тут то поле, которое у тебя реально есть: lang / locale / language)
    const lang = (settings as any)?.lang ?? (settings as any)?.locale ?? (settings as any)?.language ?? "ru";
    const title = getReminderTitle(lang);

    const quiet = isQuietNow(now, tz, quietStart, quietEnd);
    const hasUrgent = items.some((r) => (r as any).urgent === true);

    if (!force && !hasUrgent && (pauseAll || quiet)) {
      await prisma.deliveryLog.createMany({
        data: items.flatMap((r) => ([
          {
            userId,
            reminderId: r.id,
            channel: "inapp",
            status: "skipped",
            error: pauseAll ? "pauseAll=true" : "quietHours",
            meta: { reason: pauseAll ? "pauseAll" : "quietHours", tz, quietStart, quietEnd },
          },
          {
            userId,
            reminderId: r.id,
            channel: "push",
            status: "skipped",
            error: pauseAll ? "pauseAll=true" : "quietHours",
            meta: { reason: pauseAll ? "pauseAll" : "quietHours", tz, quietStart, quietEnd },
          },
        ])),
      });
      continue;
    }

    const subsCount = notifyPush
  ? await prisma.pushSubscription.count({ where: { userId } })
  : 0;

console.log("[CRON] user", userId, "subsCount", subsCount);

const subs = notifyPush
  ? await prisma.pushSubscription.findMany({ where: { userId } })
  : [];

    for (const r of items) {
      let notificationId: bigint | null = null;

      if (notifyInApp) {
        const notif = await prisma.notification.create({
          data: {
            userId,
            type: "reminder",
            title,              // ✅ локализованный title
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

      if (notifyPush && subs.length) {
  for (const sub of subs) {
    try {
  const langNorm = normalizeLang(lang);

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
    minScheduled: minDue ? { id: minDue.id.toString(), dueUtc: minDue.dueUtc } : null,
    dueCount: due.length,
  });
}
