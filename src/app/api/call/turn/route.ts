import { NextResponse } from "next/server";

// 👉 сюда укажешь базовый URL твоего FastAPI (Render)
const API_BASE = process.env.WEB_API_BASE_URL!; 
// пример: https://mindra-web-api.onrender.com  (без слэша в конце)

export async function POST(req: Request) {
  try {
    if (!API_BASE) {
      return NextResponse.json(
        { ok: false, error: "WEB_API_BASE_URL is not set" },
        { status: 500 }
      );
    }

    const form = await req.formData();

    const upstream = await fetch(`${API_BASE}/api/call/turn`, {
      method: "POST",
      body: form,
      // headers НЕ ставим вручную (иначе сломаешь multipart boundary)
    });

    const text = await upstream.text();
    return new NextResponse(text, {
      status: 200,
      headers: {
        "content-type": upstream.headers.get("content-type") || "application/json",
      },
    });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: "Proxy error" },
      { status: 200 }
    );
  }
}

// (опционально) чтобы preflight не мешал
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "*",
    },
  });
}
