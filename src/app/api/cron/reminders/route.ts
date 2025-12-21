// src/app/api/cron/reminders/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/server/prisma";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const secret = searchParams.get("secret");

  if (!process.env.CRON_SECRET || secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();

  const due = await prisma.reminder.findMany({
    where: {
      status: "scheduled",
      dueUtc: { lte: now },
    },
    take: 200,
    orderBy: { dueUtc: "asc" },
  });

  if (!due.length) {
    return NextResponse.json({ ok: true, processed: 0 });
  }

  // ✅ BigInt id — всё ок, просто выносим
  const ids = due.map(r => r.id);

  await prisma.reminder.updateMany({
    where: { id: { in: ids } },
    data: {
      status: "sent",
      sentAt: now,
    },
  });

  return NextResponse.json({ ok: true, processed: ids.length });
}
