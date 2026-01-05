import { NextResponse } from "next/server";
import { prisma } from "@/server/prisma";
import { requireUserId } from "@/server/auth";

const DEFAULTS = {
  tz: "UTC",
  quietEnabled: true,
  quietStart: 22,
  quietEnd: 8,
  quietBypassMin: 30,
  notifyInApp: true,
  notifyPush: true,
  notifyEmail: false,
  notifyTelegram: false,
  pauseAll: false,
};

function json(data: any, status = 200) {
  return NextResponse.json(data, { status });
}

export async function GET() {
  let userId: string | null = null;

  try {
    userId = await requireUserId();
  } catch {
    // не залогинен — отдаём дефолты, но явно помечаем
    return json({ ok: true, settings: DEFAULTS, anon: true });
  }

  const s = await prisma.userSettings.findUnique({ where: { userId } });

  return json({
    ok: true,
    settings: s ?? { ...DEFAULTS, userId },
    anon: false,
  });
}

export async function POST(req: Request) {
  let userId: string;

  try {
    userId = await requireUserId();
  } catch {
    return json({ ok: false, error: "Unauthorized" }, 401);
  }

  const body = (await req.json().catch(() => null)) ?? {};

  const tz = String(body.tz ?? DEFAULTS.tz);

  const quietEnabled = Boolean(body.quietEnabled ?? body.quiet_enabled ?? DEFAULTS.quietEnabled);

  const clamp = (n: any, min: number, max: number) =>
    Math.min(max, Math.max(min, Number.isFinite(Number(n)) ? Math.floor(Number(n)) : min));

  const quietStart = clamp(body.quietStart ?? body.quiet_start ?? DEFAULTS.quietStart, 0, 23);
  const quietEnd = clamp(body.quietEnd ?? body.quiet_end ?? DEFAULTS.quietEnd, 0, 23);
  const quietBypassMin = clamp(
    body.quietBypassMin ?? body.quiet_bypass_min ?? DEFAULTS.quietBypassMin,
    0,
    180
  );

  const notifyInApp = body.notifyInApp ?? body.notify_inapp;
  const notifyPush = body.notifyPush ?? body.notify_push;
  const notifyEmail = body.notifyEmail ?? body.notify_email;
  const notifyTelegram = body.notifyTelegram ?? body.notify_telegram;
  const pauseAll = body.pauseAll ?? body.pause_all;

  const data: any = {
    tz,
    quietEnabled,
    quietStart,
    quietEnd,
    quietBypassMin,
    ...(typeof notifyInApp === "boolean" ? { notifyInApp } : {}),
    ...(typeof notifyPush === "boolean" ? { notifyPush } : {}),
    ...(typeof notifyEmail === "boolean" ? { notifyEmail } : {}),
    ...(typeof notifyTelegram === "boolean" ? { notifyTelegram } : {}),
    ...(typeof pauseAll === "boolean" ? { pauseAll } : {}),
  };

  const saved = await prisma.userSettings.upsert({
    where: { userId },
    create: { userId, ...DEFAULTS, ...data },
    update: data,
  });

  return json({ ok: true, settings: saved });
}
