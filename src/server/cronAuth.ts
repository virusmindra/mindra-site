// src/server/cronAuth.ts
export function authorizeCron(req: Request) {
  const expected = process.env.CRON_SECRET || "";
  if (!expected) return false;

  const url = new URL(req.url);
  const querySecret = url.searchParams.get("secret");

  const auth = req.headers.get("authorization") || "";
  const bearer = auth.startsWith("Bearer ") ? auth.slice(7) : "";

  return querySecret === expected || bearer === expected;
}
