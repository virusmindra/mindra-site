export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { prisma } from "@/server/db/prisma";
import { getUserId } from "@/lib/auth";

function isAdminEmail(email?: string | null) {
  const allow = String(process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  return !!email && allow.includes(email.toLowerCase());
}

export async function GET() {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const me = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true },
  });

  if (!isAdminEmail(me?.email)) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const rows = await prisma.subscription.findMany({
    orderBy: { updatedAt: "desc" },
    include: {
      user: { select: { id: true, email: true, name: true, createdAt: true } },
    },
    take: 500,
  });

  // можно добавить Pending claims для дебага
  const pending = await prisma.pendingSubscriptionClaim.findMany({
    where: { consumed: false },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  return NextResponse.json({ rows, pending }, { status: 200 });
}
