// src/app/[locale]/chat/ClientPage.tsx
'use client';

import { useEffect, useMemo, useState } from 'react';
import Sidebar from '@/components/chat/Sidebar';
import ChatWindow from '@/components/chat/ChatWindow';
import Composer from '@/components/chat/Composer';
import type { ChatSession, ChatMessage, ChatFeature } from '@/components/chat/types';
import { loadSessions, saveSessions, newSessionTitle } from '@/components/chat/storage';

function createEmptySession(feature: ChatFeature = 'default'): ChatSession {
  const now = Date.now();
  const id =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : String(now);

  return {
    id,
    title: 'New chat',
    messages: [],
    createdAt: now,
    updatedAt: now,
    feature,
  };
}

export default function ClientPage() {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentId, setCurrentId] = useState<string | undefined>(undefined);
  const [sending, setSending] = useState(false);
  const [activeFeature, setActiveFeature] = useState<ChatFeature>('default');

  // --- загрузка из localStorage при монтировании ---
  useEffect(() => {
    const stored = loadSessions();
    if (stored.length > 0) {
      setSessions(stored);
      setCurrentId(stored[0].id);
      setActiveFeature(stored[0].feature ?? 'default');
    } else {
      const first = createEmptySession();
      setSessions([first]);
      setCurrentId(first.id);
      setActiveFeature(first.feature ?? 'default');
    }
  }, []);

  // --- автосохранение в localStorage при изменении сессий ---
  useEffect(() => {
    if (sessions.length) {
      saveSessions(sessions);
    }
  }, [sessions]);

  const current = useMemo(
    () => sessions.find((s) => s.id === currentId),
    [sessions, currentId],
  );

  const handleSelectSession = (id: string) => {
    setCurrentId(id);
    const found = sessions.find((s) => s.id === id);
    if (found) {
      setActiveFeature(found.feature ?? 'default');
    }
  };

  const handleNewChat = () => {
    // новый чат сразу создаём под текущий режим
    const fresh = createEmptySession(activeFeature);
    setSessions((prev) => [fresh, ...prev]);
    setCurrentId(fresh.id);
  };

  const updateCurrentSession = (updater: (prev: ChatSession) => ChatSession) => {
    setSessions((prev) =>
      prev.map((s) => (s.id === currentId ? updater(s) : s)),
    );
  };
// Пытаемся вытащить текст цели из ответа бота
function extractGoalFromReply(reply: string, fallbackUserText: string): string | null {
  // Ищем кусок после "Цель:" или "Цель**:"
  const m =
    reply.match(/Цель[:»"\s]+\**(.+?)(?:[\.\n]|$)/i) ||
    reply.match(/"Ходить в зал.+?\d+ месяцев?/i);

  if (m && m[1]) {
    const goal = m[1].trim().replace(/^"|"$/g, '');
    if (goal.length > 5) return goal;
  }

  const fb = fallbackUserText.trim();
  return fb.length > 5 ? fb : null;
}

// Создаём цель через тот же API, что и панель "Цели"
async function createGoalFromChat(goalText: string) {
  try {
    await fetch('/api/goals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      // ⚠️ Если в GoalsPanel используются другие поля (например title / description / deadline),
      // просто продублий сюда тот же payload.
      body: JSON.stringify({
        text: goalText,
      }),
    });
  } catch {
    // молча игнорируем — это побочный бонус, а не блокер для чата
  }
}

  const handleSend = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;

    // если по какой-то причине current ещё нет — создаём
    if (!current) {
      const fresh = createEmptySession(activeFeature);
      setSessions([fresh]);
      setCurrentId(fresh.id);
      return;
    }

    const ts = Date.now();
    const userMsg: ChatMessage = {
      role: 'user',
      content: trimmed,
      ts,
    };

    // сразу добавляем сообщение в текущую сессию
    updateCurrentSession((prev) => ({
      ...prev,
      feature: prev.feature ?? activeFeature, // записываем режим в сессию
      messages: [...prev.messages, userMsg],
      title:
        prev.title === 'New chat'
          ? newSessionTitle([...prev.messages, userMsg])
          : prev.title,
      updatedAt: Date.now(),
    }));

    setSending(true);

    try {
      const res = await fetch('/api/web-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          input: trimmed,
          sessionId: current.id,
          feature: activeFeature, // <--- режим (чат/цели/привычки...)
        }),
      });

      let replyText = 'Извини, сервер сейчас недоступен.';

      try {
        const data = await res.json();
        if (data && typeof data.reply === 'string' && data.reply.trim()) {
          replyText = data.reply.trim();
        }
      } catch {
        // оставляем дефолт
      }

            const botMsg: ChatMessage = {
        role: 'assistant',
        content: replyText,
        ts: Date.now(),
      };

      updateCurrentSession((prev) => ({
        ...prev,
        feature: prev.feature ?? activeFeature,
        messages: [...prev.messages, botMsg],
        updatedAt: Date.now(),
      }));

      // 🔥 Автосоздание цели, если мы в режиме "Цели"
      if (activeFeature === 'goals') {
        const goalText = extractGoalFromReply(replyText, trimmed);
        if (goalText) {
          // не ждём, пока она создастся, просто запускаем побочку
          createGoalFromChat(goalText);
        }
      }

    } catch {
      const errMsg: ChatMessage = {
        role: 'assistant',
        content: 'Ошибка сервера, попробуй ещё раз чуть позже 🙏',
        ts: Date.now(),
      };

      updateCurrentSession((prev) => ({
        ...prev,
        feature: prev.feature ?? activeFeature,
        messages: [...prev.messages, errMsg],
        updatedAt: Date.now(),
      }));
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex h-[calc(100vh-4.5rem)] bg-zinc-950">
      {/* Левый столбец: чаты + режимы + тема/логин */}
      <Sidebar
       sessions={sessions}
        currentId={currentId}
        onNewChat={handleNewChat}
        onSelect={handleSelectSession}
        activeFeature={activeFeature}
        onChangeFeature={setActiveFeature}
      />

      {/* Основной чат */}
      <main className="flex-1 flex flex-col">
        <ChatWindow messages={current ? current.messages : []} />
        <Composer onSend={handleSend} disabled={sending} />
      </main>
    </div>
  );
}
