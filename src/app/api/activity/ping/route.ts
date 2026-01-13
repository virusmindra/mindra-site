import { NextResponse } from "next/server";
import { prisma } from "@/server/prisma";
import { requireUserId } from "@/server/auth";

export const runtime = "nodejs";

export async function POST() {
  let userId: string;
  try {
    userId = await requireUserId();
  } catch {
    return NextResponse.json({ ok: true, anon: true });
  }

  await prisma.userSettings.upsert({
    where: { userId },
    create: { userId, lastActiveAtUtc: new Date() } as any,
    update: { lastActiveAtUtc: new Date() } as any,
  });

  return NextResponse.json({ ok: true });
}
