import { NextResponse } from "next/server";
import { prisma } from "@/server/db/prisma";
import { requireUserId } from "@/lib/auth";

export const runtime = "nodejs";

const ALLOWED_TZ = new Set([
  // 🇺🇸 USA
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",

  // 🇬🇧 UK
  "Europe/London",

  // 🇨🇦 Canada
  "America/Toronto",
  "America/Vancouver",

  // 🇪🇸 Spain
  "Europe/Madrid",

  // 🌎 Latin America (ES)
  "America/Mexico_City",
  "America/Bogota",
  "America/Lima",
  "America/Santiago",
  "America/Argentina/Buenos_Aires",

  // 🇧🇷 Brazil
  "America/Sao_Paulo",
]);


export async function POST(req: Request) {
  const userId = await requireUserId();
  const body = await req.json().catch(() => null);
  const tzRaw = String(body?.tz || "").trim();

  if (!tzRaw) return NextResponse.json({ ok: false, error: "missing_tz" }, { status: 400 });

  // ✅ только разрешённые
  if (!ALLOWED_TZ.has(tzRaw)) {
    return NextResponse.json({ ok: false, error: "tz_not_allowed" }, { status: 400 });
  }

  await prisma.userSettings.upsert({
    where: { userId },
    create: { userId, tz: tzRaw } as any,
    update: { tz: tzRaw } as any,
  });

  return NextResponse.json({ ok: true, tz: tzRaw });
}
