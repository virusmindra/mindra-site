// src/app/api/push/vapid/route.ts
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET() {
  const publicKey = process.env.VAPID_PUBLIC_KEY;
  if (!publicKey) {
    return NextResponse.json({ ok: false, error: "Missing VAPID_PUBLIC_KEY" }, { status: 500 });
  }
  return NextResponse.json({ ok: true, publicKey });
}
