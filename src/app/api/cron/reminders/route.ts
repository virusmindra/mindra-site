import { NextResponse } from "next/server";
import { prisma } from "@/server/prisma";

export async function GET(req: Request) {
  const secret = req.headers.get("x-cron-secret");
  if (!process.env.CRON_SECRET || secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();

  const due = await prisma.reminder.findMany({
    where: { status: "scheduled", dueUtc: { lte: now } },
    take: 200,
    orderBy: { dueUtc: "asc" },
    select: { id: true },
  });

  if (!due.length) return NextResponse.json({ ok: true, processed: 0 });

  const ids = due.map((r) => r.id);

  await prisma.reminder.updateMany({
    where: { id: { in: ids }, status: "scheduled" },
    data: { status: "sent", sentAt: now },
  });

  return NextResponse.json({ ok: true, processed: ids.length });
}
