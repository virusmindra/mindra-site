import { NextResponse } from "next/server";
import { prisma } from "@/server/prisma";
import { requireUserId } from "@/server/auth";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const userId = await requireUserId();
  const body = await req.json().catch(() => null);

  const text = String(body?.text || "").trim();
  const dueInMin = Number(body?.dueInMin);

  if (!text) {
    return NextResponse.json({ ok: false, error: "Missing text" }, { status: 400 });
  }
  if (!Number.isFinite(dueInMin) || dueInMin < 0 || dueInMin > 60 * 24 * 365) {
    return NextResponse.json({ ok: false, error: "Invalid dueInMin" }, { status: 400 });
  }

  const dueUtc = new Date(Date.now() + dueInMin * 60_000);

  const r = await prisma.reminder.create({
    data: {
      userId,
      text,
      dueUtc,
      status: "scheduled",
    } as any,
  });

  return NextResponse.json({
    ok: true,
    reminder: { id: r.id.toString(), dueUtc: r.dueUtc, text: r.text },
  });
}
