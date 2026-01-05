import webpush from "web-push";
import { prisma } from "@/server/prisma";

function mustEnv(name: string) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env: ${name}`);
  return v;
}

// вызывать один раз на импорт
webpush.setVapidDetails(
  mustEnv("VAPID_SUBJECT"),        // пример: "mailto:hello@mindra.group"
  mustEnv("VAPID_PUBLIC_KEY"),
  mustEnv("VAPID_PRIVATE_KEY")
);

export async function sendPushToUser(userId: string, payload: any) {
  const subs = await prisma.pushSubscription.findMany({ where: { userId } });
  if (!subs.length) return { ok: true, sent: 0 };

  const data = JSON.stringify(payload);

  let sent = 0;
  const toDelete: bigint[] = [];

  await Promise.all(
    subs.map(async (s) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: s.endpoint,
            keys: { p256dh: s.p256dh, auth: s.auth },
          },
          data
        );
        sent += 1;
      } catch (e: any) {
        // 410/404 = подписка умерла — удаляем
        const code = e?.statusCode || e?.status || 0;
        if (code === 410 || code === 404) toDelete.push(s.id);
        // остальное — просто логируем (не валим cron)
        console.error("push error", code, e?.message || e);
      }
    })
  );

  if (toDelete.length) {
    await prisma.pushSubscription.deleteMany({ where: { id: { in: toDelete } } });
  }

  return { ok: true, sent };
}
