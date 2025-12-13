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

  // ✅ suggestion для кнопки "Сохранить как цель"
  const [lastGoalSuggestion, setLastGoalSuggestion] = useState<{ text: string } | null>(null);

  // --- загрузка из localStorage ---
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

  // --- автосохранение ---
  useEffect(() => {
    if (sessions.length) saveSessions(sessions);
  }, [sessions]);

  const current = useMemo(
    () => sessions.find((s) => s.id === currentId),
    [sessions, currentId],
  );

  const handleSelectSession = (id: string) => {
    setCurrentId(id);
    const found = sessions.find((s) => s.id === id);
    if (found) setActiveFeature(found.feature ?? 'default');
    setLastGoalSuggestion(null);
  };

  const handleNewChat = () => {
    const fresh = createEmptySession(activeFeature);
    setSessions((prev) => [fresh, ...prev]);
    setCurrentId(fresh.id);
    setLastGoalSuggestion(null);
  };

  const updateCurrentSession = (updater: (prev: ChatSession) => ChatSession) => {
    setSessions((prev) =>
      prev.map((s) => (s.id === currentId ? updater(s) : s)),
    );
  };

  const handleChangeFeature = (feature: ChatFeature) => {
    setActiveFeature(feature);
    setLastGoalSuggestion(null);

    setSessions((prev) => {
      const existing = prev.find((s) => (s.feature ?? 'default') === feature);
      if (existing) {
        setCurrentId(existing.id);
        return prev;
      }

      const fresh = createEmptySession(feature);
      setCurrentId(fresh.id);
      return [fresh, ...prev];
    });
  };

 const saveAsGoal = async (goalText: string) => {
  try {
    // 1️⃣ создаём цель
    const res = await fetch('/api/goals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: goalText }),
    });

    const data = await res.json().catch(() => null);
    const goalId = data?.id ? String(data.id) : undefined;

    // 2️⃣ авто-создание привычки (ПОСЛЕ цели)
    const lower = goalText.toLowerCase();

    if (lower.includes('зал') || lower.includes('трен')) {
      await fetch('/api/habits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: 'Тренировка',
          cadence: 'weekly',
          targetPerWeek: 3,
        }),
      }).catch(() => {});
    }

    // 3️⃣ создаём дневник цели (чат внутри цели)
    if (goalId) {
      const diaryId = `goal:${goalId}`;

      setSessions((prev) => {
        if (prev.find((s) => s.id === diaryId)) return prev;

        const now = Date.now();
        const diary: ChatSession = {
          id: diaryId,
          title: goalText.length > 40 ? goalText.slice(0, 40) + '…' : goalText,
          messages: [],
          createdAt: now,
          updatedAt: now,
          feature: 'goals',
          goalId,
        };

        return [diary, ...prev];
      });

      setActiveFeature('goals');
      setCurrentId(diaryId);
    }

    setLastGoalSuggestion(null);
  } catch {
    setLastGoalSuggestion(null);
  }
};

  const handleSend = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;

    if (!current) {
      const fresh = createEmptySession(activeFeature);
      setSessions([fresh]);
      setCurrentId(fresh.id);
      setLastGoalSuggestion(null);
      return;
    }

    setLastGoalSuggestion(null);

    const ts = Date.now();
    const userMsg: ChatMessage = { role: 'user', content: trimmed, ts };

    updateCurrentSession((prev) => ({
      ...prev,
      feature: prev.feature ?? activeFeature,
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
          feature: activeFeature,
        }),
      });

      let replyText = 'Извини, сервер сейчас недоступен.';
      let suggestion: { text: string } | null = null;

      try {
        const data = await res.json();

        if (data?.reply && typeof data.reply === 'string' && data.reply.trim()) {
          replyText = data.reply.trim();
        }

        // ✅ показываем кнопку только если пришёл goal_suggestion
        if (activeFeature === 'goals' && data?.goal_suggestion?.text) {
          suggestion = { text: String(data.goal_suggestion.text) };
        }
      } catch {
        // ignore
      }

      setLastGoalSuggestion(suggestion);

      const botMsg: ChatMessage = { role: 'assistant', content: replyText, ts: Date.now() };

      updateCurrentSession((prev) => ({
        ...prev,
        feature: prev.feature ?? activeFeature,
        messages: [...prev.messages, botMsg],
        updatedAt: Date.now(),
      }));
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
      <Sidebar
        sessions={sessions}
        currentId={currentId}
        onNewChat={handleNewChat}
        onSelect={handleSelectSession}
        activeFeature={activeFeature}
        onChangeFeature={handleChangeFeature}
      />

      Remember:
      <main className="flex-1 flex flex-col">
        <ChatWindow
          messages={current ? current.messages : []}
          activeFeature={activeFeature}
          goalSuggestion={lastGoalSuggestion}
          onSaveGoal={saveAsGoal}   // ✅ вот тут как ты просил
        />
        <Composer onSend={handleSend} disabled={sending} />
      </main>
    </div>
  );
}
