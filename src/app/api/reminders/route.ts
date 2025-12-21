import { NextResponse } from "next/server";
import { requireUserId } from "@/server/auth";
import { prisma } from "@/server/prisma";
import { looksRelativeHint } from "@/lib/reminders/time";

const MAX_ACTIVE = 50;
const MAX_DAYS_AHEAD = 365;

export async function GET() {
  const userId = await requireUserId();

  const reminders = await prisma.reminder.findMany({
    where: { userId, status: { not: "canceled" } },
    orderBy: { dueUtc: "asc" },
    take: 100,
  });

  return NextResponse.json({ ok: true, reminders });
}

export async function POST(req: Request) {
  const userId = await requireUserId();
  const body = await req.json().catch(() => null);

  const text = String(body?.text ?? "").trim();
  const dueRaw = body?.due_utc;

  if (!text || !dueRaw) {
    return NextResponse.json({ ok: false, error: "text,due_utc required" }, { status: 400 });
  }

  const dueUtc = new Date(dueRaw);
  if (Number.isNaN(dueUtc.getTime())) {
    return NextResponse.json({ ok: false, error: "invalid due_utc" }, { status: 400 });
  }

  const now = Date.now();

  if (dueUtc.getTime() <= now) {
    return NextResponse.json({ ok: false, error: "due_utc must be in the future" }, { status: 400 });
  }

  const maxAhead = now + MAX_DAYS_AHEAD * 24 * 60 * 60 * 1000;
  if (dueUtc.getTime() > maxAhead) {
    return NextResponse.json({ ok: false, error: "due_utc too far" }, { status: 400 });
  }

  const activeCount = await prisma.reminder.count({
    where: { userId, status: "scheduled" },
  });

  if (activeCount >= MAX_ACTIVE) {
    return NextResponse.json({ ok: false, error: "limit reached" }, { status: 429 });
  }

  const deltaMin = Math.max(0, (dueUtc.getTime() - now) / 60000);
  const urgent = Boolean(looksRelativeHint(text) && deltaMin <= 30);

  const reminder = await prisma.reminder.create({
    data: { userId, text, dueUtc, status: "scheduled", urgent },
  });

  return NextResponse.json({ ok: true, reminder });
}
