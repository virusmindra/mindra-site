export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { prisma } from "@/server/prisma";
import { requireUserId } from "@/server/auth";

export async function POST(req: Request) {
  const userId = await requireUserId();
  const body = (await req.json().catch(() => null)) ?? {};
  const endpoint = String(body.endpoint || "").trim();

  if (!endpoint) {
    return NextResponse.json({ ok: false, error: "missing_endpoint" }, { status: 400 });
  }

  await prisma.pushSubscription.deleteMany({
    where: { userId, endpoint },
  });

  return NextResponse.json({ ok: true });
}
