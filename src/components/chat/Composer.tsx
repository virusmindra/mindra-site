'use client';

import { useState } from 'react';

export default function Composer({
  onSend,
  disabled,
}: {
  onSend: (t: string) => void;
  disabled?: boolean;
}) {
  const [text, setText] = useState('');

  return (
    <div className="border-t border-[var(--border)] px-6 py-4 bg-[var(--bg)]">
      <div className="mx-auto max-w-3xl flex gap-2">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              if (text.trim()) {
                onSend(text.trim());
                setText('');
              }
            }
          }}
          placeholder="Type a message…"
          className="flex-1 rounded-xl bg-[var(--card)] border border-[var(--border)]
                     px-4 py-3 text-sm outline-none focus:border-[var(--accent-2)]"
          disabled={disabled}
        />

        <button
          onClick={() => {
            if (text.trim()) {
              onSend(text.trim());
              setText('');
            }
          }}
          className="rounded-xl px-4 py-3 text-sm font-medium
                     bg-[var(--accent)] text-white hover:opacity-90
                     disabled:opacity-40 disabled:cursor-not-allowed"
          disabled={disabled || !text.trim()}
        >
          Send
        </button>
      </div>
    </div>
  );
}
