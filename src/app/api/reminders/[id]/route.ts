import { NextResponse } from "next/server";
import { requireUserId } from "@/server/auth";
import { prisma } from "@/server/prisma";

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  const userId = await requireUserId();

  let id: bigint;
  try {
    id = BigInt(params.id);
  } catch {
    return NextResponse.json({ ok: false, error: "invalid id" }, { status: 400 });
  }

  const updated = await prisma.reminder.updateMany({
    where: { id, userId, status: { not: "canceled" } },
    data: { status: "canceled" },
  });

  if (updated.count === 0) {
    return NextResponse.json({ ok: false, error: "not found" }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
