// src/components/chat/HabitsPanel.tsx
'use client';

import { useEffect, useState } from 'react';

type Habit = {
  id: string;
  text: string;
  doneToday: boolean;
  lastDoneAt?: number | null;
};

function getOrCreateWebUid() {
  if (typeof window === 'undefined') return 'web';
  const key = 'mindra_uid';
  let uid = localStorage.getItem(key);
  if (!uid) {
    uid = `web_${crypto?.randomUUID?.() ?? String(Date.now())}`;
    localStorage.setItem(key, uid);
  }
  return uid;
}

export default function HabitsPanel() {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newText, setNewText] = useState('');

  const loadHabits = async () => {
    setLoading(true);
    setError(null);

    try {
      const uid = getOrCreateWebUid();
      const res = await fetch(`/api/habits?user_id=${encodeURIComponent(uid)}`, {
        cache: 'no-store',
      });

      const data = await res.json().catch(() => ({}));
      setHabits(Array.isArray(data.habits) ? data.habits : []);
    } catch (e) {
      console.error(e);
      setError('Не удалось загрузить привычки.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHabits();
  }, []);

  const handleCreate = async () => {
    const text = newText.trim();
    if (!text) return;

    setCreating(true);
    setError(null);

    try {
      const uid = getOrCreateWebUid();

      const res = await fetch('/api/habits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, user_id: uid }),
      });

      const data = await res.json().catch(() => ({}));

      if (res.status === 403) {
        setError(data.detail || 'Достигнут лимит привычек.');
      } else if (!res.ok) {
        setError(data.detail || 'Не удалось добавить привычку.');
      } else {
        setNewText('');
        setHabits(Array.isArray(data.habits) ? data.habits : []);
      }
    } catch (e) {
      console.error(e);
      setError('Ошибка сервера при добавлении привычки.');
    } finally {
      setCreating(false);
    }
  };

  const handleDone = async (habit: Habit) => {
    setError(null);

    try {
      const uid = getOrCreateWebUid();

      const res = await fetch(
        `/api/habits/${encodeURIComponent(habit.id)}/done?user_id=${encodeURIComponent(uid)}`,
        { method: 'POST' },
      );

      const data = await res.json().catch(() => ({}));

      if (!res.ok || !data?.ok) {
        setError(data.detail || 'Не удалось отметить привычку выполненной.');
      } else {
        setHabits(Array.isArray(data.habits) ? data.habits : []);
      }
    } catch (e) {
      console.error(e);
      setError('Ошибка сервера при отметке привычки.');
    }
  };

  const handleDelete = async (habit: Habit) => {
    setError(null);

    try {
      const uid = getOrCreateWebUid();

      const res = await fetch(
        `/api/habits/${encodeURIComponent(habit.id)}?user_id=${encodeURIComponent(uid)}`,
        { method: 'DELETE' },
      );

      const data = await res.json().catch(() => ({}));

      if (!res.ok || !data?.ok) {
        setError(data.detail || 'Не удалось удалить привычку.');
      } else {
        setHabits(Array.isArray(data.habits) ? data.habits : []);
      }
    } catch (e) {
      console.error(e);
      setError('Ошибка сервера при удалении привычки.');
    }
  };

  return (
  <div className="flex flex-col h-full border-r border-[var(--border)] bg-[var(--card)]">
    <div className="px-4 py-3 border-b border-[var(--border)]">
      <h2 className="text-sm font-semibold text-[var(--text)]">Привычки</h2>
      <p className="text-xs text-[var(--muted)] mt-1">
        Здесь твои ежедневные действия. Mindra помогает отмечать выполненные и держать рутину.
      </p>
    </div>

    <div className="px-4 py-3 border-b border-[var(--border)] space-y-2">
      <input
        className="w-full rounded-xl bg-[var(--bg)] border border-[var(--border)] px-3 py-2 text-xs text-[var(--text)] outline-none focus:border-[var(--accent)]"
        placeholder="Новая привычка…"
        value={newText}
        onChange={(e) => setNewText(e.target.value)}
      />
      <button
        onClick={handleCreate}
        disabled={creating || !newText.trim()}
        className="w-full rounded-xl bg-[var(--accent)] text-white text-xs py-2 hover:opacity-90 disabled:opacity-50"
      >
        {creating ? 'Добавляю…' : 'Добавить привычку'}
      </button>
      {error && <p className="text-[11px] text-red-500">{error}</p>}
    </div>

    <div className="flex-1 overflow-auto px-3 py-3 space-y-2">
      {loading ? (
        <p className="text-xs text-[var(--muted)]">Загружаю привычки…</p>
      ) : habits.length === 0 ? (
        <p className="text-xs text-[var(--muted)]">
          Пока у тебя нет привычек. Добавь одну — Mindra поможет держать рутину 💜
        </p>
      ) : (
        habits.map((h) => (
          <div
            key={h.id}
            className="flex items-start justify-between gap-2 rounded-xl border border-[var(--border)] bg-[var(--bg)] px-3 py-2"
          >
            <div className="flex-1">
              <span
                className={`text-xs ${
                  h.doneToday ? 'line-through text-[var(--muted)]' : 'text-[var(--text)]'
                }`}
              >
                {h.text}
              </span>

              {h.doneToday && (
                <div className="mt-1 text-[11px] text-emerald-600 dark:text-emerald-400">
                  ✅ выполнена сегодня
                </div>
              )}
            </div>

            <div className="flex flex-col gap-1">
              {!h.doneToday && (
                <button
                  onClick={() => handleDone(h)}
                  className="text-[11px] px-2 py-1 rounded-lg bg-emerald-600 text-white hover:opacity-90"
                >
                  Сделано
                </button>
              )}
              <button
                onClick={() => handleDelete(h)}
                className="text-[11px] px-2 py-1 rounded-lg border border-[var(--border)] bg-transparent text-[var(--text)] hover:bg-black/5 dark:hover:bg-white/10"
              >
                Удалить
              </button>
            </div>
          </div>
        ))
      )}
    </div>
  </div>
);
}