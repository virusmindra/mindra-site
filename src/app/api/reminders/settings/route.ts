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

  const tz = String(body?.tz || "UTC");

  let quietStart = Number(body?.quietStart ?? body?.quiet_start ?? 22);
  let quietEnd = Number(body?.quietEnd ?? body?.quiet_end ?? 8);
  let quietBypassMin = Number(body?.quietBypassMin ?? body?.quiet_bypass_min ?? 30);

  quietStart = Math.min(23, Math.max(0, quietStart));
  quietEnd = Math.min(23, Math.max(0, quietEnd));
  quietBypassMin = Math.min(180, Math.max(0, quietBypassMin));

  await prisma.userSettings.upsert({
    where: { userId },
    create: { userId, tz, quietStart, quietEnd, quietBypassMin },
    update: { tz, quietStart, quietEnd, quietBypassMin },
  });

  return NextResponse.json({ ok: true });
}
