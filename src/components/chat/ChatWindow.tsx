'use client';

import { useEffect, useRef } from 'react';
import { ChatMessage } from './types';

export default function ChatWindow({ messages }: { messages: ChatMessage[] }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    ref.current?.scrollTo({ top: ref.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  return (
    <div ref={ref} className="flex-1 h-[calc(100dvh-4.5rem)] overflow-y-auto px-6 py-6">
      <div className="mx-auto max-w-3xl space-y-4">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`inline-block text-sm px-3 py-2 rounded-xl border
                ${m.role === 'user'
                  ? 'bg-white text-zinc-900 border-transparent'
                  : 'bg-transparent text-zinc-100 border-white/15'}`}
            >
              {m.content}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
