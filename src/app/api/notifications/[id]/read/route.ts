import { NextResponse } from "next/server";
import { prisma } from "@/server/prisma";
import { requireUserId } from "@/lib/auth";

export async function POST(_: Request, { params }: { params: { id: string } }) {
  const userId = await requireUserId();
  const id = BigInt(params.id);

  await prisma.notification.updateMany({
    where: { id, userId },
    data: { readAt: new Date() },
  });

  return NextResponse.json({ ok: true });
}
