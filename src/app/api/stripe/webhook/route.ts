export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/server/prisma";
import { recomputeEntitlements } from "@/lib/entitlements";
import { syncVoiceEntitlementsFromStripe } from "@/lib/voice/stripe-sync";

type Plan = "FREE" | "PLUS" | "PRO";
type Term = "1M" | "3M" | "6M" | "12M" | "LIFETIME";

const PRICE_TO_PLAN: Record<string, { plan: Exclude<Plan, "FREE">; term: Term }> = {};
function addPrice(envKey: string | undefined, plan: "PLUS" | "PRO", term: Term) {
  if (!envKey) return;
  const id = String(envKey).trim();
  if (!id) return;
  PRICE_TO_PLAN[id] = { plan, term };
}

// PLUS
addPrice(process.env.STRIPE_PRICE_PLUS_1M, "PLUS", "1M");
addPrice(process.env.STRIPE_PRICE_PLUS_3M, "PLUS", "3M");
addPrice(process.env.STRIPE_PRICE_PLUS_6M, "PLUS", "6M");
addPrice(process.env.STRIPE_PRICE_PLUS_12M, "PLUS", "12M");
addPrice(process.env.STRIPE_PRICE_PLUS_LIFETIME, "PLUS", "LIFETIME");

// PRO
addPrice(process.env.STRIPE_PRICE_PRO_1M, "PRO", "1M");
addPrice(process.env.STRIPE_PRICE_PRO_3M, "PRO", "3M");
addPrice(process.env.STRIPE_PRICE_PRO_6M, "PRO", "6M");
addPrice(process.env.STRIPE_PRICE_PRO_12M, "PRO", "12M");
addPrice(process.env.STRIPE_PRICE_PRO_LIFETIME, "PRO", "LIFETIME");

function priceToInfo(priceId?: string | null) {
  if (!priceId) return undefined;
  return PRICE_TO_PLAN[priceId];
}

function normEmail(e: any) {
  return String(e ?? "").trim().toLowerCase();
}


function getUserIdFromEventObject(obj: any): string | null {
  return (
    obj?.client_reference_id ||
    obj?.metadata?.userId ||
    obj?.subscription_data?.metadata?.userId ||
    obj?.subscription?.metadata?.userId ||
    null
  );
}


async function getOrCreateSubByCustomer(customerId: string, obj: any) {
  let rec = await findUserByCustomer(customerId);
  if (rec) return rec;

  const userId = getUserIdFromEventObject(obj);
  if (!userId) return null;

  await ensureSubscriptionRow(userId, customerId);
  return prisma.subscription.findUnique({ where: { userId } });
}

async function ensureSubscriptionRow(userId: string, customerId: string) {
  await prisma.subscription.upsert({
    where: { userId },
    create: {
      userId,
      stripeCustomer: customerId,
      plan: "FREE",
      status: "incomplete",
      term: null,
    },
    update: { stripeCustomer: customerId },
  });

  await prisma.entitlement.upsert({
    where: { userId },
    create: { userId }, // defaults
    update: {},
  });
}


async function findUserByCustomer(customerId: string) {
  return prisma.subscription.findFirst({ where: { stripeCustomer: customerId } });
}

async function getPriceIdFromCheckoutSession(sessionId: string): Promise<string | null> {
  // checkout.session.completed НЕ содержит line_items по умолчанию — надо retrieve + expand
  const s = await stripe.checkout.sessions.retrieve(sessionId, {
    expand: ["line_items.data.price"],
  });
  const priceId = (s.line_items?.data?.[0] as any)?.price?.id ?? null;
  return priceId;
}

function eventTypeForSubscriptionEvent(_eType: string) {
  // renew определяем внутри sync по смене periodEnd (isNewPeriod)
  return "SUBSCRIPTION_CHANGE" as const;
}

export async function POST(req: NextRequest) {
  const sig = req.headers.get("stripe-signature");
  if (!sig || !process.env.STRIPE_WEBHOOK_SECRET) {
    return new NextResponse("Missing signature or secret", { status: 400 });
  }

  const buf = Buffer.from(await req.arrayBuffer());

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(buf, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (e: any) {
    return new NextResponse(`Webhook Error: ${e.message}`, { status: 400 });
  }

  switch (event.type) {
    // ---------------------------
    // SUBSCRIPTION CREATE/UPDATE/RESUME
    // ---------------------------
    case "customer.subscription.created":
    case "customer.subscription.updated":
    case "customer.subscription.resumed": {
      const s: any = event.data.object;
      const customerId = String(s.customer);

      const rec = await getOrCreateSubByCustomer(customerId, event.data.object);
if (!rec) return NextResponse.json({ ok: true });


      const priceId = s.items?.data?.[0]?.price?.id ?? null;
      const info = priceToInfo(priceId);

      const plan: Plan = (info?.plan ?? rec.plan ?? "FREE") as any;
      const term: Term | null = (info?.term ?? rec.term ?? null) as any;

      const periodStart = s.current_period_start ? new Date(s.current_period_start * 1000) : null;
      const periodEnd = s.current_period_end ? new Date(s.current_period_end * 1000) : null;

      await prisma.subscription.update({
        where: { userId: rec.userId },
        data: {
          status: s.status,
          plan,
          term,
          stripeSubscription: s.id,
          currentPeriodEnd: periodEnd,
        },
      });

      await syncVoiceEntitlementsFromStripe({
        userId: rec.userId,
        plan: plan === "FREE" ? "FREE" : plan,
        status: s.status,
        periodStart,
        periodEnd,
        stripeEventId: event.id,
        eventType: eventTypeForSubscriptionEvent(event.type),
      });

      await recomputeEntitlements(rec.userId);
      return NextResponse.json({ ok: true });
    }

    // ---------------------------
    // SUBSCRIPTION CANCEL/DELETE
    // ---------------------------
    case "customer.subscription.deleted": {
      const s: any = event.data.object;
      const customerId = String(s.customer);

      const rec = await getOrCreateSubByCustomer(customerId, event.data.object);
if (!rec) return NextResponse.json({ ok: true });


      const endedAt = s.ended_at ? new Date(s.ended_at * 1000) : new Date();

      await prisma.subscription.update({
        where: { userId: rec.userId },
        data: {
          status: "canceled",
          plan: "FREE" as any,
          term: null,
          stripeSubscription: null,
          currentPeriodEnd: endedAt,
        },
      });

      await syncVoiceEntitlementsFromStripe({
        userId: rec.userId,
        plan: "FREE",
        status: "canceled",
        periodStart: null,
        periodEnd: null,
        stripeEventId: event.id,
        eventType: "SUBSCRIPTION_CHANGE",
      });

      await recomputeEntitlements(rec.userId);
      return NextResponse.json({ ok: true });
    }

 case "checkout.session.completed": {
  const session = event.data.object as Stripe.Checkout.Session;
  const customerId = String(session.customer);

  // email может быть пустым в session -> добираем из customer
  let emailRaw =
    (session.customer_details as any)?.email ||
    (session.customer_email as any) ||
    null;

  if (!emailRaw && session.customer) {
    const c: any = await stripe.customers.retrieve(String(session.customer));
    emailRaw = c?.email ?? null;
  }

  const emailNorm = emailRaw ? normEmail(emailRaw) : null;

  const anonUid = String((session.metadata as any)?.anonUid ?? "").trim() || null;
  const planMeta = String((session.metadata as any)?.plan ?? "").trim().toUpperCase();
  const termMeta = String((session.metadata as any)?.term ?? "").trim().toUpperCase();

  let rec = await findUserByCustomer(customerId);

  if (!rec) {
    const userId = getUserIdFromEventObject(event.data.object);

    // authed checkout -> создадим sub row
    if (userId) {
      await ensureSubscriptionRow(userId, customerId);
      rec = await prisma.subscription.findUnique({ where: { userId } });
    }

    // guest checkout -> сохраняем pending claim и выходим
    if (!rec) {
      if (emailNorm) {
        await prisma.pendingSubscriptionClaim.upsert({
          where: { stripeSessionId: session.id },
          create: {
            email: String(emailRaw),
            emailNorm,
            anonUid,
            stripeCustomer: customerId,
            stripeSessionId: session.id,
            stripeSubId: session.subscription ? String(session.subscription) : null,
            plan: planMeta === "PRO" ? ("PRO" as any) : ("PLUS" as any),
            term: termMeta || null,
            status: "active",
          },
          update: {
            email: String(emailRaw),
            emailNorm,
            anonUid,
            stripeCustomer: customerId,
            stripeSubId: session.subscription ? String(session.subscription) : undefined,
            status: "active",
          },
        });
      }
      return NextResponse.json({ ok: true, guest: true });
    }
  }

  // SUBSCRIPTION checkout -> retrieve subscription as fallback
  if (session.mode === "subscription" && session.subscription) {
    const sub: any = await stripe.subscriptions.retrieve(String(session.subscription));

    const priceId = sub.items?.data?.[0]?.price?.id ?? null;
    const info = priceToInfo(priceId);

    const plan: Plan = (info?.plan ?? rec.plan ?? "FREE") as any;
    const term: Term | null = (info?.term ?? rec.term ?? null) as any;

    const periodStart = sub.current_period_start
      ? new Date(sub.current_period_start * 1000)
      : null;
    const periodEnd = sub.current_period_end ? new Date(sub.current_period_end * 1000) : null;

    await prisma.subscription.update({
      where: { userId: rec.userId },
      data: {
        status: sub.status,
        plan,
        term,
        stripeSubscription: sub.id,
        currentPeriodEnd: periodEnd,
      },
    });

    await syncVoiceEntitlementsFromStripe({
      userId: rec.userId,
      plan: plan === "FREE" ? "FREE" : plan,
      status: sub.status,
      periodStart,
      periodEnd,
      stripeEventId: event.id,
      eventType: "SUBSCRIPTION_CHANGE",
    });

    await recomputeEntitlements(rec.userId);
    return NextResponse.json({ ok: true });
  }

  // PAYMENT checkout (Lifetime)
  if (session.mode === "payment") {
    const priceId = await getPriceIdFromCheckoutSession(session.id);
    const info = priceToInfo(priceId);

    const plan: Plan = (info?.plan ?? "PLUS") as any;
    const term: Term = "LIFETIME";

    await prisma.subscription.update({
      where: { userId: rec.userId },
      data: {
        status: "active",
        plan,
        term,
        stripeSubscription: null,
        currentPeriodEnd: null,
      },
    });

    await syncVoiceEntitlementsFromStripe({
      userId: rec.userId,
      plan: plan === "FREE" ? "FREE" : plan,
      status: "active",
      periodStart: null,
      periodEnd: null,
      stripeEventId: event.id,
      eventType: "SUBSCRIPTION_CHANGE",
    });

    await recomputeEntitlements(rec.userId);
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ ok: true });
}

    // ---------------------------
    // RENEW RELIABLY: invoice.paid / invoice.payment_failed
    // ---------------------------
    case "invoice.paid":
    case "invoice.payment_succeeded": {
      const inv: any = event.data.object;
      const customerId = String(inv.customer);

      const rec = await getOrCreateSubByCustomer(customerId, event.data.object);
if (!rec) return NextResponse.json({ ok: true });


      // если это инвойс по подписке — подтянем subscription и синкнем период
      if (inv.subscription) {
        const sub: any = await stripe.subscriptions.retrieve(String(inv.subscription));

        const priceId = sub.items?.data?.[0]?.price?.id ?? null;
        const info = priceToInfo(priceId);

        const plan: Plan = (info?.plan ?? rec.plan ?? "FREE") as any;
        const term: Term | null = (info?.term ?? rec.term ?? null) as any;

        const periodStart = sub.current_period_start ? new Date(sub.current_period_start * 1000) : null;
        const periodEnd = sub.current_period_end ? new Date(sub.current_period_end * 1000) : null;

        await prisma.subscription.update({
          where: { userId: rec.userId },
          data: {
            status: sub.status,
            plan,
            term,
            stripeSubscription: sub.id,
            currentPeriodEnd: periodEnd,
          },
        });

        await syncVoiceEntitlementsFromStripe({
          userId: rec.userId,
          plan: plan === "FREE" ? "FREE" : plan,
          status: sub.status,
          periodStart,
          periodEnd,
          stripeEventId: event.id,
          eventType: "SUBSCRIPTION_RENEW",
        });

        await recomputeEntitlements(rec.userId);
      }

      return NextResponse.json({ ok: true });
    }

    case "invoice.payment_failed": {
      const inv: any = event.data.object;
      const customerId = String(inv.customer);

      const rec = await getOrCreateSubByCustomer(customerId, event.data.object);
if (!rec) return NextResponse.json({ ok: true });


      // ставим статус, но НЕ отбираем доступ мгновенно (можешь решать сам)
      await prisma.subscription.update({
        where: { userId: rec.userId },
        data: { status: "past_due" },
      });

      await recomputeEntitlements(rec.userId);
      return NextResponse.json({ ok: true });
    }

    default:
      return NextResponse.json({ ok: true });
  }
}
