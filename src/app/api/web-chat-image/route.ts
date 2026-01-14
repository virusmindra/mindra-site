export const runtime = "nodejs";

import { NextResponse } from "next/server";

function mustEnv(name: string) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env: ${name}`);
  return v;
}

async function fileToDataUrl(f: File) {
  const buf = Buffer.from(await f.arrayBuffer());
  const b64 = buf.toString("base64");
  const mime = f.type || "image/jpeg";
  return `data:${mime};base64,${b64}`;
}

export async function POST(req: Request) {
  try {
    const form = await req.formData();

    const input = String(form.get("input") || "");
    const sessionId = String(form.get("sessionId") || "");
    const feature = String(form.get("feature") || "default");
    const user_id = String(form.get("user_id") || "");
    const lang = String(form.get("lang") || "en");

    const images = form.getAll("images").filter(Boolean) as File[];

    if (!images.length) {
      return NextResponse.json({ ok: false, error: "missing_images" }, { status: 400 });
    }
    if (images.length > 5) {
      return NextResponse.json({ ok: false, error: "max_5_images" }, { status: 400 });
    }

    // конвертим все фото в dataURL
    const dataUrls = await Promise.all(images.map(fileToDataUrl));

    // ✅ Mindra system prompt (лучше импортируй свой реальный prompt как в /api/web-chat)
    const system =
      `You are Mindra — warm, playful, supportive AI companion. ` +
      `Speak naturally with light emojis when appropriate. Keep Mindra vibe. ` +
      `If user sends photos, describe them warmly and ask an engaging question.`;

    const userText = input?.trim()
      ? `User message: ${input.trim()}`
      : `User sent ${images.length} photo(s) without text.`;

    const content: any[] = [{ type: "text", text: userText }];

    for (const url of dataUrls) {
      content.push({ type: "image_url", image_url: { url } });
    }

    const payload = {
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: system },
        { role: "user", content },
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
      return NextResponse.json(
        { ok: false, error: j?.error?.message || "openai_error" },
        { status: 500 }
      );
    }

    const reply = String(j?.choices?.[0]?.message?.content || "").trim();

    return NextResponse.json({
      ok: true,
      reply,
      meta: { count: images.length, sessionId, feature, user_id, lang },
    });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: String(e?.message ?? e) },
      { status: 500 }
    );
  }
}
