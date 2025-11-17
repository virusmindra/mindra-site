// src/app/[locale]/chat/ClientPage.tsx
'use client';

import {useEffect, useMemo, useState} from 'react';
import {useTranslations} from 'next-intl';

import Sidebar from '@/components/chat/Sidebar';
import ChatWindow from '@/components/chat/ChatWindow';
import Composer from '@/components/chat/Composer';

import GoalsPanel from '@/components/chat/GoalsPanel';
import HabitsPanel from '@/components/chat/HabitsPanel';

import type {ChatFeature, ChatMessage, ChatSession} from '@/components/chat/types';
import {loadSessions, saveSessions} from '@/components/chat/storage';

export default function ClientPage() {
  const t = useTranslations('chat');

  // --- состояние чатов ---
  const [sessions, setSessions] = useState<ChatSession[]>(() => loadSessions());
  const [currentId, setCurrentId] = useState<string | undefined>(() => {
    const loaded = loadSessions();
    return loaded[0]?.id;
  });
  const [sending, setSending] = useState(false);

  // какая фича активна: обычный чат / цели / привычки
  const [activeFeature, setActiveFeature] = useState<ChatFeature>('default');

  // текущая сессия
  const current = useMemo(
    () => sessions.find((s) => s.id === currentId),
    [sessions, currentId],
  );

  // если current пропал, но сессии есть — переключаемся на первую
  useEffect(() => {
    if (!current && sessions.length > 0) {
      setCurrentId(sessions[0].id);
    }
  }, [current, sessions]);

  const setAndSave = (next: ChatSession[]) => {
    setSessions(next);
    saveSessions(next);
  };

  const handleChangeSessions = (next: ChatSession[]) => {
    setAndSave(next);
    // если удалили активный чат — переходим к первому
    if (!next.find((s) => s.id === currentId)) {
      setCurrentId(next[0]?.id);
    }
  };

  const handleSelectSession = (id: string) => {
    setCurrentId(id);
  };

  const handleSend = async (text: string) => {
    if (!text.trim()) return;

    const now = Date.now();

    // 1. определяем "базовую" сессию и остальные
    let baseSession: ChatSession;
    let rest: ChatSession[];

    if (!current) {
      // создаём первую сессию
      const id =
        typeof crypto !== 'undefined' && 'randomUUID' in crypto
          ? crypto.randomUUID()
          : String(now);

      baseSession = {
        id,
        title: text.slice(0, 40) || 'New chat',
        messages: [],
        createdAt: now,
        updatedAt: now,
      };

      rest = sessions;
      setCurrentId(id);
    } else {
      baseSession = current;
      rest = sessions.filter((s) => s.id !== current.id);
    }

    // 2. добавляем сообщение пользователя
    const userMsg: ChatMessage = {
      role: 'user',
      content: text,
      ts: now,
    };

    let updatedSession: ChatSession = {
      ...baseSession,
      messages: [...baseSession.messages, userMsg],
      updatedAt: now,
    };

    setAndSave([updatedSession, ...rest]);
    setSending(true);

    try {
      const res = await fetch('/api/web-chat', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
          input: text,
          sessionId: updatedSession.id,
          feature: activeFeature,
        }),
      });

      const data = await res.json();
      const replyText: string = data.reply ?? '';

      const botMsg: ChatMessage = {
        role: 'assistant',
        content: replyText || t('empty_reply', {defaultValue: 'Нет ответа.'}),
        ts: Date.now(),
      };

      updatedSession = {
        ...updatedSession,
        messages: [...updatedSession.messages, botMsg],
        updatedAt: botMsg.ts,
      };

      setAndSave([updatedSession, ...rest]);
    } catch (e) {
      const errMsg: ChatMessage = {
        role: 'assistant',
        content: t('error_generic', {
          defaultValue: 'Ошибка сервера, попробуй ещё раз позже.',
        }),
        ts: Date.now(),
      };

      updatedSession = {
        ...updatedSession,
        messages: [...updatedSession.messages, errMsg],
        updatedAt: errMsg.ts,
      };

      setAndSave([updatedSession, ...rest]);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex h-[calc(100vh-64px)] bg-zinc-950">
      {/* Сайдбар слева */}
      <Sidebar
        sessions={sessions}
        currentId={currentId}
        onSelectSession={handleSelectSession}
        onChangeSessions={handleChangeSessions}
        activeFeature={activeFeature}
        onChangeFeature={setActiveFeature}
      />

      {/* Основная область */}
      <main className="flex-1 flex border-l border-white/10">
        {activeFeature === 'goals' ? (
          <div className="flex flex-1">
            <div className="w-80 shrink-0">
              <GoalsPanel />
            </div>
            <div className="flex-1 flex flex-col">
              <ChatWindow messages={current ? current.messages : []} />
              <Composer onSend={handleSend} disabled={sending} />
            </div>
          </div>
        ) : activeFeature === 'habits' ? (
          <div className="flex flex-1">
            <div className="w-80 shrink-0">
              <HabitsPanel />
            </div>
            <div className="flex-1 flex flex-col">
              <ChatWindow messages={current ? current.messages : []} />
              <Composer onSend={handleSend} disabled={sending} />
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col">
            <ChatWindow messages={current ? current.messages : []} />
            <Composer onSend={handleSend} disabled={sending} />
          </div>
        )}
      </main>
    </div>
  );
}
