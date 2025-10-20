'use client';
import { useState } from 'react';

export default function ChatPage() {
  const [sessionId] = useState('web-default');
  const [input, setInput] = useState('');
  const [items, setItems] = useState<{role:'user'|'bot'; text:string}[]>([]);

  async function send() {
    const text = input.trim();
    if (!text) return;
    setItems(prev => [...prev, { role: 'user', text }]);
    setInput('');
    try {
      const r = await fetch('/api/web-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input: text, sessionId }),
      });
      const j = await r.json();
      setItems(prev => [...prev, { role: 'bot', text: j.reply ?? '(no reply)' }]);
    } catch {
      setItems(prev => [...prev, { role: 'bot', text: 'Ошибка сети' }]);
    }
  }

  return (
    <div className="mx-auto max-w-2xl p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Чат</h1>

      <div className="border rounded-xl p-4 h-[60vh] overflow-auto space-y-2 bg-black/5">
        {items.map((m, i) => (
          <div key={i} className={m.role === 'user' ? 'text-right' : ''}>
            <span className="inline-block rounded-xl px-3 py-2 bg-white/80">
              {m.text}
            </span>
          </div>
        ))}
      </div>

      <div className="flex gap-2">
        <input
          className="flex-1 border rounded-xl px-3 py-2"
          placeholder="Напиши сообщение..."
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && send()}
        />
        <button className="px-4 py-2 rounded-xl border" onClick={send}>
          Отправить
        </button>
      </div>
    </div>
  );
}
