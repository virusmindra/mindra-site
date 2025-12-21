import { NextResponse } from "next/server";
import { prisma } from "@/server/prisma";

export async function GET(req: Request) {
  const secret = req.headers.get("x-cron-secret");
  if (!process.env.CRON_SECRET || secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();

  // берём due
  const due = await prisma.reminder.findMany({
    where: { status: "scheduled", dueUtc: { lte: now } },
    take: 200,
    orderBy: { dueUtc: "asc" },
  });

  if (!due.length) return NextResponse.json({ ok: true, processed: 0 });

  // отмечаем sent
  await prisma.reminder.updateMany({
    where: { id: { in: due.map(r => r.id) } },
    data: { status: "sent", sentAt: now },
  });

  // TODO: delivery (web-push / email / in-app)
  return NextResponse.json({ ok: true, processed: due.length });
}
