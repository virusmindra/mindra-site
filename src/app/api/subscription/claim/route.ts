export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { prisma } from "@/server/db/prisma";
import { getUserId } from "@/lib/auth";

function normEmail(e: string) {
  return String(e || "").trim().toLowerCase();
}

export async function POST(req: Request) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });

  const body = (await req.json().catch(() => null)) as { anonUid?: string | null } | null;
  const anonUid = String(body?.anonUid ?? "").trim() || null;

  // user email
  const me = await prisma.user.findUnique({ where: { id: userId }, select: { email: true } });
  const email = me?.email ? String(me.email) : "";
  const emailNorm = normEmail(email);

  if (!emailNorm) {
    return NextResponse.json(
      { ok: false, error: "no_email_on_user" },
      { status: 400 }
    );
  }

  // если подписка уже есть и не FREE — ничего не делаем
  const currentSub = await prisma.subscription.findUnique({ where: { userId } });
  if (currentSub?.plan && String(currentSub.plan) !== "FREE") {
    return NextResponse.json({ ok: true, already: true });
  }

  // ищем pending claim:
  // 1) по email
  // 2) если есть anonUid — можно искать и по нему (для браузерного случая)
  const pending = await prisma.pendingSubscriptionClaim.findFirst({
    where: {
      consumed: false,
      claimedUserId: null,
      OR: [
        { emailNorm },
        ...(anonUid ? [{ anonUid }] : []),
      ],
    },
    orderBy: { createdAt: "desc" },
  });

  if (!pending) {
    return NextResponse.json({ ok: true, claimed: false, reason: "not_found" });
  }

  // привязываем: создаем/обновляем Subscription для этого userId
  await prisma.subscription.upsert({
    where: { userId },
    create: {
      userId,
      stripeCustomer: pending.stripeCustomer ?? null,
      stripeSubscription: pending.stripeSubId ?? null,
      plan: pending.plan ?? ("FREE" as any),
      term: pending.term ?? null,
      status: pending.status ?? "active",
    },
    update: {
      stripeCustomer: pending.stripeCustomer ?? undefined,
      stripeSubscription: pending.stripeSubId ?? undefined,
      plan: pending.plan ?? undefined,
      term: pending.term ?? undefined,
      status: pending.status ?? undefined,
    },
  });

  // entitlement row (если нет)
  await prisma.entitlement.upsert({
    where: { userId },
    create: { userId },
    update: {},
  });

  // помечаем pending как consumed + claimed
  await prisma.pendingSubscriptionClaim.update({
    where: { id: pending.id },
    data: {
      claimedUserId: userId,
      claimedAt: new Date(),
      consumed: true,
    },
  });

  return NextResponse.json({ ok: true, claimed: true });
}
