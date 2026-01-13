import { NextResponse } from "next/server";
import { prisma } from "@/server/db/prisma";
import { requireUserId } from "@/lib/auth";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const userId = await requireUserId();
  const body = await req.json().catch(() => null);
  const tz = String(body?.tz || "").trim();

  if (!tz) return NextResponse.json({ ok: false, error: "missing_tz" }, { status: 400 });

  await prisma.userSettings.upsert({
    where: { userId },
    create: { userId, tz } as any,
    update: { tz } as any,
  });

  return NextResponse.json({ ok: true, tz });
}
