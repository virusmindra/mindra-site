import { NextResponse } from "next/server";
import { prisma } from "@/server/prisma";
import { requireUserId } from "@/lib/auth"; // (у тебя getServerSession/authOptions)

export async function GET() {
  const userId = await requireUserId();

  const items = await prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return NextResponse.json({ ok: true, items });
}
