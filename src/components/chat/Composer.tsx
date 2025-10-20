'use client';

import { useState } from 'react';

export default function Composer({ onSend, disabled }: { onSend: (t: string)=>void; disabled?: boolean }) {
  const [text, setText] = useState('');

  return (
    <div className="border-t border-white/10 px-6 py-4">
      <div className="mx-auto max-w-3xl flex gap-2">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); if (text.trim()) onSend(text.trim()), setText(''); } }}
          placeholder="Type a message…"
          className="flex-1 rounded-xl bg-transparent border border-white/15 px-4 py-3 text-sm outline-none focus:border-white/30"
          disabled={disabled}
        />
        <button
          onClick={() => { if (text.trim()) onSend(text.trim()), setText(''); }}
          className="rounded-xl border border-white/15 px-4 py-3 text-sm hover:bg-white/10 disabled:opacity-50"
          disabled={disabled || !text.trim()}
        >
          Send
        </button>
      </div>
    </div>
  );
}
