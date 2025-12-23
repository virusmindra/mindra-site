import { NextResponse } from "next/server";
import { prisma } from "@/server/prisma";
import webpush from "web-push";

webpush.setVapidDetails(
  process.env.VAPID_SUBJECT!,
  process.env.VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
);

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const secret = searchParams.get("secret");
  if (!process.env.CRON_SECRET || secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  // берем последние подписки (можно по текущему пользователю, но пока так)
  const subs = await prisma.pushSubscription.findMany({
    take: 5,
    orderBy: { updatedAt: "desc" },
  });

  let ok = 0;
  let fail = 0;

  for (const sub of subs) {
    try {
      await webpush.sendNotification(
        {
          endpoint: sub.endpoint,
          keys: { p256dh: sub.p256dh, auth: sub.auth },
        } as any,
        JSON.stringify({
          title: "Mindra ✅ Push test",
          body: "Если ты это видишь — пуши работают",
          url: "/en/chat",
        })
      );
      ok++;
    } catch (e) {
      fail++;
    }
  }

  return NextResponse.json({ ok: true, sent: ok, failed: fail, total: subs.length });
}
