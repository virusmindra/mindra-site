// src/server/cronAuth.ts
export function authorizeCron(req: Request) {
  const secret = process.env.CRON_SECRET || "";
  if (!secret) return false;

  // 0) query ?secret=... (удобно для ручного теста в браузере)
  try {
    const url = new URL(req.url);
    const querySecret = url.searchParams.get("secret");
    if (querySecret && querySecret === secret) return true;
  } catch {}

  // 1) Vercel Cron
  if (req.headers.get("x-vercel-cron") === "1") {
    return true;
  }

  // 2) Bearer token
  const auth = req.headers.get("authorization") || "";
  if (auth === `Bearer ${secret}`) {
    return true;
  }

  // 3) Custom header
  const custom = req.headers.get("x-cron-secret") || "";
  if (custom === secret) {
    return true;
  }

  return false;
}
