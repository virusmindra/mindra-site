// src/lib/sse.ts
export async function ssePost(
  url: string,
  payload: unknown,
  onChunk: (text: string) => void
) {
  const resp = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!resp.body) throw new Error('No response body');

  const reader = resp.body.getReader();
  const decoder = new TextDecoder('utf-8');
  let buffer = '';

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    let idx: number;
    while ((idx = buffer.indexOf('\n\n')) >= 0) {
      const raw = buffer.slice(0, idx);
      buffer = buffer.slice(idx + 2);

      const lines = raw.split('\n');
      const dataLines = lines.filter(l => l.startsWith('data:')).map(l => l.slice(5).trim());
      const eventLine = lines.find(l => l.startsWith('event:'));
      const eventName = eventLine?.slice(6).trim();

      if (eventName === 'end') return;             // [DONE]
      if (eventName === 'error') {
        console.error('SSE error:', dataLines.join('\n'));
        return;
      }
      if (dataLines.length) onChunk(dataLines.join('\n'));
    }
  }
}
