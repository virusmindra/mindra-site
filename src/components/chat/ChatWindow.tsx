// src/components/chat/ChatWindow.tsx
'use client';

import { useEffect, useRef } from 'react';
import type { ChatMessage } from './types';

type Props = {
  messages: ChatMessage[];
};

export default function ChatWindow({ messages }: Props) {
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="flex-1 overflow-y-auto px-6 py-6">
        {/* Широкий контейнер диалога */}
        <div className="mx-auto w-full max-w-4xl space-y-4">
          {messages.map((m) => {
            const isUser = m.role === 'user';
            return (
              <div
                key={m.ts}
                className={`flex w-full ${isUser ? 'justify-end' : 'justify-start'}`}
              >
                <div
                className={[
                  'px-4 py-2 rounded-2xl text-sm md:text-base leading-relaxed max-w-[80%]',
                  isUser
                    ? 'bg-white text-zinc-900 rounded-br-sm'
                    : 'bg-zinc-900 text-zinc-50 border border-white/10 rounded-bl-sm',
                ].join(' ')}
              >
                {m.content}
              </div>
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>
      </div>
    </div>
  );
}
