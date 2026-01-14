export const runtime = "nodejs";

import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const audio = form.get("audio");

    if (!audio || !(audio instanceof File)) {
      return NextResponse.json(
        { ok: false, error: "missing_audio" },
        { status: 400 }
      );
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { ok: false, error: "missing_api_key" },
        { status: 500 }
      );
    }

    // ⬇️ отправляем audio напрямую в OpenAI
    const fd = new FormData();
    fd.append("file", audio);
    fd.append("model", "gpt-4o-mini-transcribe");

    const r = await fetch("https://api.openai.com/v1/audio/transcriptions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
      body: fd,
    });

    const data = await r.json();

    if (!r.ok) {
      return NextResponse.json(
        { ok: false, error: data?.error?.message || "openai_error" },
        { status: 500 }
      );
    }

    const text = String(data.text || "").trim();
    return NextResponse.json({ ok: true, text });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: String(e?.message ?? e) },
      { status: 500 }
    );
  }
}
