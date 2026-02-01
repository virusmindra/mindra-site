import { NextResponse } from "next/server";
import { prisma } from "@/server/db/prisma";
import { requireUserId } from "@/lib/auth";

export const runtime = "nodejs";

export async function GET() {
  try {
    const userId = await requireUserId();

    const s = await prisma.chatSession.findFirst({
      where: { userId },
      orderBy: { updatedAt: "desc" },
      include: { messages: { orderBy: { createdAt: "asc" }, take: 200 } },
    });

    return NextResponse.json({ ok: true, session: s }, { status: 200 });
  } catch (e: any) {
    // гость / нет сессии / DB перегруз — НЕ валим UI
    return NextResponse.json({ ok: true, session: null }, { status: 200 });
  }
}
