// src/components/chat/ChatWindow.tsx
'use client';

import { useEffect, useRef } from 'react';
import type { ChatMessage, ChatFeature } from './types';

type Props = {
  messages: ChatMessage[];
  activeFeature: ChatFeature;
  goalSuggestion: { text: string } | null;
  onSaveGoal: (text: string) => Promise<void>;

  // ✅ новые пропсы
  onMarkGoalDone?: (goalId: string) => Promise<void> | void;
  currentSessionId?: string;
};

export default function ChatWindow({
  messages,
  activeFeature,
  goalSuggestion,
  onSaveGoal,
  onMarkGoalDone,
  currentSessionId,
}: Props) {
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  const isGoalDiary = Boolean(currentSessionId?.startsWith('goal:'));
  const goalId = isGoalDiary ? String(currentSessionId).slice('goal:'.length) : null;

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="flex-1 overflow-y-auto px-6 py-6">
        <div className="mx-auto w-full max-w-4xl space-y-4">
          {messages.map((m, idx) => {
            const isUser = m.role === 'user';
            const isLast = idx === messages.length - 1;

            return (
              <div
                key={m.ts}
                className={`flex w-full ${isUser ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={[
                    'px-4 py-2 rounded-2xl text-sm md:text-base leading-relaxed max-w-[80%]',
                    'whitespace-pre-wrap',
                    isUser
                      ? 'bg-white text-zinc-900 rounded-br-sm'
                      : 'bg-zinc-900 text-zinc-50 border border-white/10 rounded-bl-sm',
                  ].join(' ')}
                >
                  {m.content}

                  {/* ✅ Кнопка "Сохранить как цель" — только в goals и НЕ внутри дневника цели */}
                  {!isUser && isLast && activeFeature === 'goals' && !isGoalDiary && goalSuggestion?.text ? (
                    <div className="mt-3 flex gap-2">
                      <button
                        type="button"
                        onClick={() => onSaveGoal(goalSuggestion.text)}
                        className="text-xs px-3 py-1.5 rounded-lg bg-white text-zinc-900 hover:bg-zinc-200 transition"
                      >
                        ➕ Сохранить как цель
                      </button>
                    </div>
                  ) : null}

                  {/* ✅ Кнопка "Отметить выполненной" — только внутри дневника цели */}
                  {!isUser && isLast && isGoalDiary && goalId && onMarkGoalDone ? (
                    <div className="mt-3 flex gap-2">
                      <button
                        type="button"
                        onClick={() => onMarkGoalDone(goalId)}
                        className="text-xs px-3 py-1.5 rounded-lg bg-white text-zinc-900 hover:bg-zinc-200 transition"
                      >
                        ✅ Отметить выполненной
                      </button>
                    </div>
                  ) : null}
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
