// src/app/api/web-chat-image/route.ts
export const runtime = "nodejs";

import { NextResponse } from "next/server";

function mustEnv(name: string) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env: ${name}`);
  return v;
}

export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const image = form.get("image");
    const input = String(form.get("input") || "");
    const sessionId = String(form.get("sessionId") || "");
    const feature = String(form.get("feature") || "default");
    const user_id = String(form.get("user_id") || "");
    const lang = String(form.get("lang") || "en");

    if (!image || !(image instanceof File)) {
      return NextResponse.json({ ok: false, error: "missing_image" }, { status: 400 });
    }

    // convert to base64 data URL (ok for small/medium images)
    const buf = Buffer.from(await image.arrayBuffer());
    const b64 = buf.toString("base64");
    const mime = image.type || "image/jpeg";
    const dataUrl = `data:${mime};base64,${b64}`;

    // ✅ IMPORTANT:
    // Тут ты должен использовать свой “Mindra system prompt”.
    // Я ставлю короткий пример, но лучше: импортируй твой реальный prompt из того же места, что /api/web-chat.
    const system = `You are Mindra — warm, playful, supportive AI companion. Speak naturally, with light emojis when appropriate. Ask engaging questions.`;

    const userText = input?.trim()
      ? `User message: ${input.trim()}`
      : `User sent a photo without text.`;

    const payload = {
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: system },
        {
          role: "user",
          content: [
            { type: "text", text: userText },
            { type: "image_url", image_url: { url: dataUrl } }
          ],
        },
      ],
      temperature: 0.8,
    };

    const r = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${mustEnv("OPENAI_API_KEY")}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const j: any = await r.json().catch(() => null);
    if (!r.ok) {
      return NextResponse.json({ ok: false, error: j?.error?.message || "openai_error" }, { status: 500 });
    }

    const reply = String(j?.choices?.[0]?.message?.content || "").trim();

    // Можно позже: сохранять message в Prisma по sessionId (как у тебя в /api/web-chat)
    return NextResponse.json({ ok: true, reply });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: String(e?.message ?? e) }, { status: 500 });
  }
}
