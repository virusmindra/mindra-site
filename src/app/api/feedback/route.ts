export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { prisma } from "@/server/db/prisma";
import { getUserId } from "@/lib/auth"; // если нет — просто удали import и блок ниже

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);
    const rating = Number(body?.rating ?? 0);
    const text = String(body?.text ?? "").trim();
    const locale = String(body?.locale ?? "");

    if (!text) return NextResponse.json({ ok: false, error: "empty" }, { status: 400 });
    if (rating < 1 || rating > 5) {
      return NextResponse.json({ ok: false, error: "bad_rating" }, { status: 400 });
    }

    let userId: string | null = null;
    try {
      userId = await getUserId();
    } catch {}

    await prisma.feedback.create({
      data: {
        rating,
        text,
        locale: locale || null,
        userId: userId ?? null,
      },
    });

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: String(e?.message ?? e) }, { status: 500 });
  }
}
