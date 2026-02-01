// src/app/api/activity/ping/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/server/db/prisma"; // ВАЖНО: один и тот же prisma-экспорт везде
import { requireUserId } from "@/lib/auth";  // или "@/server/auth" — но тоже единообразно

export const runtime = "nodejs";

export async function POST(req: Request) {
  let userId: string;
  try {
    userId = await requireUserId();
  } catch {
    return NextResponse.json({ ok: true, authed: false });
  }

  const body = await req.json().catch(() => ({}));
  const sessionId = typeof body?.sessionId === "string" ? body.sessionId : null;

  try {
    const now = new Date();

    // ✅ если поля lastChatSessionId НЕТ в схеме — НЕ трогаем его
    await prisma.userSettings.upsert({
      where: { userId },
      update: { lastActiveAtUtc: now },
      create: { userId, lastActiveAtUtc: now },
    });

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.error("[PING] db error:", e?.message ?? e);
    return NextResponse.json({ ok: true, degraded: true });
  }
}
