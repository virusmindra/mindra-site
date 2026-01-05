import { NextResponse } from "next/server";
import { prisma } from "@/server/prisma";
import { requireUserId } from "@/server/auth";

export async function POST(req: Request) {
  const userId = await requireUserId();
  const body = await req.json().catch(() => null);

  const endpoint = String(body?.endpoint || "");
  if (!endpoint) {
    return NextResponse.json({ ok: false, error: "missing endpoint" }, { status: 400 });
  }

  // удаляем только endpoint этого пользователя (на всякий)
  await prisma.pushSubscription.deleteMany({
    where: { endpoint, userId },
  });

  return NextResponse.json({ ok: true });
}
