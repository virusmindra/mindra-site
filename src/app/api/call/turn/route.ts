import { NextResponse } from "next/server";

export const runtime = "nodejs";

const API_BASE = process.env.WEB_API_BASE_URL; // без ! чтобы не падало

export async function POST(req: Request) {
  try {
    if (!API_BASE) {
      return NextResponse.json({ ok: false, error: "WEB_API_BASE_URL is not set" }, { status: 200 });
    }

    const form = await req.formData();

    const upstream = await fetch(`${API_BASE}/api/call/turn`, {
      method: "POST",
      body: form,
    });

    const text = await upstream.text();
    return new NextResponse(text, {
      status: 200,
      headers: {
        "content-type": upstream.headers.get("content-type") || "application/json",
      },
    });
  } catch (e) {
    return NextResponse.json({ ok: false, error: "Proxy error" }, { status: 200 });
  }
}
