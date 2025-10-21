'use client';

import { useMemo, useRef, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import Sidebar from '@/components/chat/Sidebar';
import ChatWindow from '@/components/chat/ChatWindow';
import Composer from '@/components/chat/Composer';
import { ChatMessage, ChatSession } from '@/components/chat/types';
import { loadSessions, saveSessions, newSessionTitle } from '@/components/chat/storage';
import { ssePost } from '@/lib/sse'; // ← добавили

export default function ChatPage() {
  const [sessions, setSessions] = useState<ChatSession[]>(() => loadSessions());
  const [currentId, setCurrentId] = useState<string | undefined>(() => loadSessions()[0]?.id);
  const [sending, setSending] = useState(false);

  const current = useMemo(
    () => sessions.find(s => s.id === currentId),
    [sessions, currentId]
  );

  // базовый апдейт + сохранение
  const setAndSave = (next: ChatSession[]) => {
    setSessions(next);
    saveSessions(next);
  };

  const upsert = (up: ChatSession) => {
    const next = [up, ...sessions.filter(s => s.id !== up.id)]
      .sort((a,b) => b.updatedAt - a.updatedAt);
    setAndSave(next);
  };

  const onNew = () => {
    const id = uuidv4();
    const s: ChatSession = { id, title: 'New chat', messages: [], createdAt: Date.now(), updatedAt: Date.now() };
    upsert(s);
    setCurrentId(id);
  };

  const onPick = (id: string) => setCurrentId(id);

  const onDelete = (id: string) => {
    const next = sessions.filter(s => s.id !== id);
    setAndSave(next);
    if (currentId === id) setCurrentId(next[0]?.id);
  };

  // утилита: обновить ТЕКУЩУЮ сессию через продюсер
  const updateCurrentSession = (producer: (draft: ChatSession) => ChatSession) => {
    const cur = sessions.find(s => s.id === currentId);
    if (!cur) return;
    const patched = producer(cur);
    upsert({ ...patched, updatedAt: Date.now() });
  };

  // 1) отправка user-сообщения, 2) вставка пустого assistant-сообщения
  const appendUserAndAssistantDraft = (text: string) => {
    let s = current;
    if (!s) {
      const id = uuidv4();
      s = { id, title: newSessionTitle(text), messages: [], createdAt: Date.now(), updatedAt: Date.now() };
      upsert(s);
      setCurrentId(id);
    }

    const userMsg: ChatMessage = { role: 'user', content: text, ts: Date.now() };
    const maybeNewTitle = s.messages.length ? s.title : newSessionTitle(text);

    const assistantDraft: ChatMessage = { role: 'assistant', content: '', ts: Date.now() };

    const draft: ChatSession = {
      ...s,
      title: maybeNewTitle,
      messages: [...s.messages, userMsg, assistantDraft],
      updatedAt: Date.now()
    };
    upsert(draft);
    return draft.id;
  };

  // дописываем последние ассистентское сообщение (по чанкам)
  const appendToLastAssistant = (sessionId: string, chunk: string) => {
    setSessions(prev => {
      const idx = prev.findIndex(s => s.id === sessionId);
      if (idx === -1) return prev;
      const s = prev[idx];
      if (!s.messages.length) return prev;

      // найдём последний assistant-сообщение
      const lastIdx = [...s.messages].reverse().findIndex(m => m.role === 'assistant');
      if (lastIdx === -1) return prev;
      const realIdx = s.messages.length - 1 - lastIdx;

      const updatedMsg = {
        ...s.messages[realIdx],
        content: s.messages[realIdx].content + chunk
      };
      const updatedMessages = s.messages.slice();
      updatedMessages[realIdx] = updatedMsg;

      const updatedSession: ChatSession = {
        ...s,
        messages: updatedMessages,
        updatedAt: Date.now()
      };

      const next = prev.slice();
      next[idx] = updatedSession;
      saveSessions(next);
      return next;
    });
  };

  const onSend = async (text: string) => {
    const sessionId = appendUserAndAssistantDraft(text); // создаём драфт ассистента
    setSending(true);
    try {
      await ssePost('/api/web-chat-stream', { userId: 'web-anon', sessionId, input: text }, (chunk) => {
        appendToLastAssistant(sessionId, chunk);
      });
      // финализация не обязательна: по завершении стрима просто остаётся текст
    } catch (e) {
      appendToLastAssistant(sessionId, '\n[Ошибка стрима]');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex gap-0">
      <Sidebar
        sessions={sessions}
        currentId={currentId}
        onNew={onNew}
        onPick={onPick}
        onDelete={onDelete}
        onLoginClick={() => alert('TODO: Sign in')}
        isAuthed={false}
      />
      <div className="flex-1 flex flex-col">
        <ChatWindow messages={current?.messages ?? []} />
        <Composer onSend={onSend} disabled={sending} />
      </div>
    </div>
  );
}
