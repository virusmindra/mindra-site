import { NextResponse } from "next/server";
import { requireUserId } from "@/server/auth";
import { prisma } from "@/server/prisma";
import { looksRelativeHint } from "@/lib/reminders/time";

const MAX_ACTIVE = 50;
const MAX_DAYS_AHEAD = 365;

function jsonSafe<T>(data: T): any {
  return JSON.parse(
    JSON.stringify(data, (_k, v) => (typeof v === "bigint" ? v.toString() : v))
  );
}

export async function GET() {
  const userId = await requireUserId();

  const reminders = await prisma.reminder.findMany({
    where: { userId, status: { not: "canceled" } },
    orderBy: { dueUtc: "asc" },
    take: 100,
  });

  return NextResponse.json({ ok: true, reminders: jsonSafe(reminders) });
}

export async function POST(req: Request) {
  const userId = await requireUserId();
  const body = await req.json().catch(() => null);

  const { text, due_utc } = body || {};
  if (!text || !due_utc) {
    return NextResponse.json({ ok: false, error: "text,due_utc required" }, { status: 400 });
  }

  const dueUtc = new Date(due_utc);
  if (Number.isNaN(dueUtc.getTime())) {
    return NextResponse.json({ ok: false, error: "invalid due_utc" }, { status: 400 });
  }

  const count = await prisma.reminder.count({ where: { userId, status: "scheduled" } });
  if (count >= 50) {
    return NextResponse.json({ ok: false, error: "limit reached" }, { status: 429 });
  }

  const now = Date.now();
  const deltaMin = Math.max(0, (dueUtc.getTime() - now) / 60000);
  const urgent = Boolean(looksRelativeHint(String(text)) && deltaMin <= 30);

  const reminder = await prisma.reminder.create({
    data: { userId, text: String(text), dueUtc, status: "scheduled", urgent },
  });

  return NextResponse.json({ ok: true, reminder: jsonSafe(reminder) });
}

