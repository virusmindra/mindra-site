import { NextResponse } from "next/server";
import { requireUserId } from "@/server/auth";
import { prisma } from "@/server/prisma";

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
  const body = await req.json().catch(() => null);

  const tz = String(body?.tz || "UTC");
  const quietEnabled = Boolean(body?.quietEnabled ?? body?.quiet_enabled ?? true);

  let quietStart = Number(body?.quietStart ?? body?.quiet_start ?? 22);
  let quietEnd = Number(body?.quietEnd ?? body?.quiet_end ?? 8);
  let quietBypassMin = Number(body?.quietBypassMin ?? body?.quiet_bypass_min ?? 30);

  quietStart = Math.min(23, Math.max(0, quietStart));
  quietEnd = Math.min(23, Math.max(0, quietEnd));
  quietBypassMin = Math.min(180, Math.max(0, quietBypassMin));

  // каналы/пауза (если ты будешь сохранять это из UI)
  const notifyInApp = body?.notifyInApp ?? body?.notify_inapp;
  const notifyPush = body?.notifyPush ?? body?.notify_push;
  const notifyEmail = body?.notifyEmail ?? body?.notify_email;
  const notifyTelegram = body?.notifyTelegram ?? body?.notify_telegram;
  const pauseAll = body?.pauseAll ?? body?.pause_all;

  await prisma.userSettings.upsert({
    where: { userId },
    create: {
      userId,
      tz,
      quietStart,
      quietEnd,
      quietBypassMin,
      ...(typeof quietEnabled === "boolean" ? { quietEnabled } : {}),
      ...(typeof notifyInApp === "boolean" ? { notifyInApp } : {}),
      ...(typeof notifyPush === "boolean" ? { notifyPush } : {}),
      ...(typeof notifyEmail === "boolean" ? { notifyEmail } : {}),
      ...(typeof notifyTelegram === "boolean" ? { notifyTelegram } : {}),
      ...(typeof pauseAll === "boolean" ? { pauseAll } : {}),
    } as any,
    update: {
      tz,
      quietStart,
      quietEnd,
      quietBypassMin,
      ...(typeof quietEnabled === "boolean" ? { quietEnabled } : {}),
      ...(typeof notifyInApp === "boolean" ? { notifyInApp } : {}),
      ...(typeof notifyPush === "boolean" ? { notifyPush } : {}),
      ...(typeof notifyEmail === "boolean" ? { notifyEmail } : {}),
      ...(typeof notifyTelegram === "boolean" ? { notifyTelegram } : {}),
      ...(typeof pauseAll === "boolean" ? { pauseAll } : {}),
    } as any,
  });

  return NextResponse.json({ ok: true });
}
