// src/app/api/push/vapid/route.ts
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET() {
  const publicKey =
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ||
    process.env.VAPID_PUBLIC_KEY ||
    "";

  if (!publicKey) {
    return NextResponse.json(
      { ok: false, error: "Missing VAPID public key env" },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true, publicKey });
}
