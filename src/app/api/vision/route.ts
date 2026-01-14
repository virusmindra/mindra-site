export const runtime = "nodejs";

import { NextResponse } from "next/server";

function toDataUrl(file: File, buf: Buffer) {
  const mime = file.type || "image/jpeg";
  const b64 = buf.toString("base64");
  return `data:${mime};base64,${b64}`;
}

export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const image = form.get("image");
    const text = String(form.get("text") || "").trim();
    const lang = String(form.get("lang") || "en").trim();

    if (!image || !(image instanceof File)) {
      return NextResponse.json({ ok: false, error: "missing_image" }, { status: 400 });
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ ok: false, error: "missing_api_key" }, { status: 500 });
    }

    const buf = Buffer.from(await image.arrayBuffer());
    const dataUrl = toDataUrl(image, buf);

    const prompt =
      text ||
      (lang.startsWith("es")
        ? "Analiza esta foto y dime qué ves. Hazme 1-2 preguntas para continuar la conversación."
        : "Analyze this photo and tell me what you see. Ask me 1–2 questions to continue the conversation.");

    // ✅ Chat Completions с vision, без SDK
    const r = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content:
              lang.startsWith("es")
                ? "Eres Mindra: cálida, humana, de apoyo. Responde natural. No inventes detalles; si no estás seguro, dilo."
                : "You are Mindra: warm, human-like, supportive. Speak naturally. Don't invent details; if unsure, say so.",
          },
          {
            role: "user",
            content: [
              { type: "text", text: prompt },
              { type: "image_url", image_url: { url: dataUrl } },
            ],
          },
        ],
        max_tokens: 400,
      }),
    });

    const j = await r.json().catch(() => null);

    if (!r.ok) {
      return NextResponse.json(
        { ok: false, error: j?.error?.message || "openai_error" },
        { status: 500 }
      );
    }

    const reply =
      String(j?.choices?.[0]?.message?.content || "").trim() ||
      (lang.startsWith("es") ? "No pude analizar la imagen 😕" : "I couldn't analyze the image 😕");

    return NextResponse.json({ ok: true, reply });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: String(e?.message ?? e) }, { status: 500 });
  }
}
