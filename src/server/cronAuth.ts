// src/server/cronAuth.ts
export function authorizeCron(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;

  // 1️⃣ Vercel Cron (прод)
  if (req.headers.get("x-vercel-cron") === "1") {
    return true;
  }

  // 2️⃣ Authorization: Bearer
  const auth = req.headers.get("authorization");
  if (auth === `Bearer ${secret}`) {
    return true;
  }

  // 3️⃣ x-cron-secret (ручной тест / render / future)
  const custom = req.headers.get("x-cron-secret");
  if (custom === secret) {
    return true;
  }

  return false;
}
