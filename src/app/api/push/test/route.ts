export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { prisma } from "@/server/prisma";
import { requireUserId } from "@/server/auth";
import webpush from "web-push";

export async function POST() {
  const userId = await requireUserId();

  const subject = process.env.VAPID_SUBJECT || "";
  const pub = process.env.VAPID_PUBLIC_KEY || "";
  const priv = process.env.VAPID_PRIVATE_KEY || "";

  if (!subject || !pub || !priv) {
    return NextResponse.json({ ok: false, error: "Missing VAPID envs on server" }, { status: 500 });
  }

  webpush.setVapidDetails(subject, pub, priv);

  const subs = await prisma.pushSubscription.findMany({
    where: { userId },
    orderBy: { updatedAt: "desc" },
  });

  if (!subs.length) {
    return NextResponse.json({ ok: false, error: "No subscriptions for user" }, { status: 400 });
  }

  let ok = 0;
  let fail = 0;

  for (const sub of subs) {
    try {
      await webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } } as any,
        JSON.stringify({
          title: "Mindra ✅ Push test",
          body: "Если ты это видишь — пуши работают",
          url: "/en/chat",
        })
      );
      ok++;
    } catch {
      fail++;
    }
  }

  return NextResponse.json({ ok: true, sent: ok, failed: fail, total: subs.length });
}
