// src/app/api/web-chat-stream/route.ts
export const runtime = 'edge';

// Укажи URL стрима на Render, напр. https://mindra-wsxi.onrender.com/api/web-chat-stream
const RENDER_STREAM_URL = process.env.RENDER_BOT_STREAM_URL!;

export async function POST(req: Request) {
  const upstream = await fetch(RENDER_STREAM_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: await req.text(),
  });

  return new Response(upstream.body, {
    status: upstream.status,
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
    },
  });
}
