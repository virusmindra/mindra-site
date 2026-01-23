// src/server/cronAuth.ts
export function authorizeCron(req: Request) {
  // ✅ 1) Vercel Cron
  const vercelCron = req.headers.get("x-vercel-cron");
  if (vercelCron === "1") return true;

  // ✅ 2) Secret header (manual / external cron)
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;

  const auth = req.headers.get("authorization") || "";
  if (auth === `Bearer ${secret}`) return true;

  const x = req.headers.get("x-cron-secret");
  if (x === secret) return true;

  return false;
}
