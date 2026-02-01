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

  return NextResponse.json({ ok: true, session: s });

} catch (e: any) {
    console.error("[CHAT_LATEST] error:", e?.message ?? e);
    return NextResponse.json(
      { ok: true, sessionId: null, messages: [] },
      { status: 200 }
    );
  }
}