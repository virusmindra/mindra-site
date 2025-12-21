import { NextResponse } from "next/server";
import { requireUserId } from "@/server/auth";
import { prisma } from "@/server/prisma";

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  const userId = await requireUserId();
  const id = BigInt(params.id);

  await prisma.reminder.updateMany({
    where: { id, userId },
    data: { status: "canceled" },
  });

  return NextResponse.json({ ok: true });
}
