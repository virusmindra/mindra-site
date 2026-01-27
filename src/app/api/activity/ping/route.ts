// src/app/api/activity/ping/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/server/prisma";
import { requireUserId } from "@/server/auth";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const userId = await requireUserId().catch(() => null);
    if (!userId) return NextResponse.json({ ok: true, anon: true });

    const body = await req.json().catch(() => ({} as any));
    const sessionId = body?.sessionId ? String(body.sessionId) : null;

    try {
      await prisma.userSettings.upsert({
        where: { userId },
        create: {
          userId,
          lastActiveAtUtc: new Date(),
          ...(sessionId ? { lastChatSessionId: sessionId } : {}),
        } as any,
        update: {
          lastActiveAtUtc: new Date(),
          ...(sessionId ? { lastChatSessionId: sessionId } : {}),
        } as any,
      });
    } catch (e) {
      // главное — не валим фронт
      console.error("[PING] upsert failed", e);
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[PING] fatal", e);
    return NextResponse.json({ ok: true }); // всё равно ok
  }
}

// чтобы при ручном открытии URL не было 405:
export async function GET(req: Request) {
  return POST(req);
}
