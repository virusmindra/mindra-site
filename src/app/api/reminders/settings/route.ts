import { NextResponse } from "next/server";
import { requireUserId } from "@/server/auth";
import { prisma } from "@/server/prisma";

export async function GET() {
  const userId = await requireUserId();

  const settings = await prisma.userSettings.findUnique({ where: { userId } });

  return NextResponse.json({
    ok: true,
    settings: settings ?? { userId, tz: "UTC", quietStart: 22, quietEnd: 8, quietBypassMin: 30 },
  });
}

export async function POST(req: Request) {
  const userId = await requireUserId();
  const body = await req.json().catch(() => null);

  const payload = {
    tz: String(body?.tz || "UTC"),
    quietStart: Number(body?.quiet_start ?? 22),
    quietEnd: Number(body?.quiet_end ?? 8),
    quietBypassMin: Number(body?.quiet_bypass_min ?? 30),
  };

  await prisma.userSettings.upsert({
    where: { userId },
    create: { userId, ...payload },
    update: payload,
  });

  return NextResponse.json({ ok: true });
}
