// src/app/api/reminders/settings/route.ts
import { NextResponse } from "next/server";
import { requireUserId } from "@/server/auth";
import { prisma } from "@/server/prisma";

function boolOrUndefined(v: any): boolean | undefined {
  return typeof v === "boolean" ? v : undefined;
}

export async function GET() {
  const userId = await requireUserId();
  const settings = await prisma.userSettings.findUnique({ where: { userId } });

  return NextResponse.json({
    ok: true,
    settings: settings ?? {
      userId,
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
    },
  });
}

export async function POST(req: Request) {
  const userId = await requireUserId();
  const body = await req.json().catch(() => ({}));

  const tz = String(body?.tz || "UTC");

  // quiet
  const quietEnabledRaw = body?.quietEnabled ?? body?.quiet_enabled;
  const quietEnabled = typeof quietEnabledRaw === "boolean" ? quietEnabledRaw : true;

  let quietStart = Number(body?.quietStart ?? body?.quiet_start ?? 22);
  let quietEnd = Number(body?.quietEnd ?? body?.quiet_end ?? 8);
  let quietBypassMin = Number(body?.quietBypassMin ?? body?.quiet_bypass_min ?? 30);

  quietStart = Math.min(23, Math.max(0, quietStart));
  quietEnd = Math.min(23, Math.max(0, quietEnd));
  quietBypassMin = Math.min(180, Math.max(0, quietBypassMin));

  // channels + pause
  const notifyInApp = boolOrUndefined(body?.notifyInApp ?? body?.notify_inapp);
  const notifyPush = boolOrUndefined(body?.notifyPush ?? body?.notify_push);
  const notifyEmail = boolOrUndefined(body?.notifyEmail ?? body?.notify_email);
  const notifyTelegram = boolOrUndefined(body?.notifyTelegram ?? body?.notify_telegram);
  const pauseAll = boolOrUndefined(body?.pauseAll ?? body?.pause_all);

  await prisma.userSettings.upsert({
    where: { userId },
    create: {
      userId,
      tz,
      quietEnabled,
      quietStart,
      quietEnd,
      quietBypassMin,
      ...(notifyInApp !== undefined ? { notifyInApp } : {}),
      ...(notifyPush !== undefined ? { notifyPush } : {}),
      ...(notifyEmail !== undefined ? { notifyEmail } : {}),
      ...(notifyTelegram !== undefined ? { notifyTelegram } : {}),
      ...(pauseAll !== undefined ? { pauseAll } : {}),
    },
    update: {
      tz,
      quietEnabled,
      quietStart,
      quietEnd,
      quietBypassMin,
      ...(notifyInApp !== undefined ? { notifyInApp } : {}),
      ...(notifyPush !== undefined ? { notifyPush } : {}),
      ...(notifyEmail !== undefined ? { notifyEmail } : {}),
      ...(notifyTelegram !== undefined ? { notifyTelegram } : {}),
      ...(pauseAll !== undefined ? { pauseAll } : {}),
    },
  });

  return NextResponse.json({ ok: true });
}
