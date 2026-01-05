import { NextResponse } from "next/server";
import { prisma } from "@/server/prisma";
import { requireUserId } from "@/server/auth";

export const runtime = "nodejs";

export async function GET() {
  const userId = await requireUserId();

  const items = await prisma.reminder.findMany({
    where: { userId, status: "scheduled" },
    orderBy: { dueUtc: "asc" },
    take: 20,
    select: { id: true, text: true, dueUtc: true, snoozeUntilUtc: true, status: true, createdAt: true },
  });

  return NextResponse.json({ ok: true, userId, count: items.length, items });
}
