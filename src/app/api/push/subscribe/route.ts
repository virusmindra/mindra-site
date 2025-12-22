import { NextResponse } from "next/server";
import { prisma } from "@/server/prisma";
import { requireUserId } from "@/server/auth";

export async function POST(req: Request) {
  const userId = await requireUserId();
  const body = await req.json().catch(() => null);

  const endpoint = body?.endpoint;
  const p256dh = body?.keys?.p256dh;
  const auth = body?.keys?.auth;
  const userAgent = req.headers.get("user-agent") || undefined;

  if (!endpoint || !p256dh || !auth) {
    return NextResponse.json({ ok: false, error: "invalid subscription" }, { status: 400 });
  }

  await prisma.pushSubscription.upsert({
    where: { endpoint },
    create: { userId, endpoint, p256dh, auth, userAgent },
    update: { userId, p256dh, auth, userAgent },
  });

  return NextResponse.json({ ok: true });
}
