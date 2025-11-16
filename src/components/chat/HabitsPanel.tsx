// src/components/chat/HabitsPanel.tsx
'use client';

import { useEffect, useState } from 'react';

type Habit = {
  index: number;
  text: string;
  done: boolean;
};

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
      const res = await fetch('/api/habits', { cache: 'no-store' });
      const data = await res.json();
      setHabits(data.habits ?? []);
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
    if (!newText.trim()) return;
    setCreating(true);
    setError(null);
    try {
      const res = await fetch('/api/habits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: newText.trim() }),
      });

      if (res.status === 403) {
        const data = await res.json();
        setError(data.detail || 'Достигнут лимит привычек.');
      } else if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.detail || 'Не удалось добавить привычку.');
      } else {
        setNewText('');
        await loadHabits();
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
      const res = await fetch(`/api/habits/${habit.index}/done`, {
        method: 'POST',
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.detail || 'Не удалось отметить привычку выполненной.');
      } else {
        await loadHabits();
      }
    } catch (e) {
      console.error(e);
      setError('Ошибка сервера при отметке привычки.');
    }
  };

  const handleDelete = async (habit: Habit) => {
    setError(null);
    try {
      const res = await fetch(`/api/habits/${habit.index}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.detail || 'Не удалось удалить привычку.');
      } else {
        await loadHabits();
      }
    } catch (e) {
      console.error(e);
      setError('Ошибка сервера при удалении привычки.');
    }
  };

  return (
    <div className="flex flex-col h-full border-r border-white/10 bg-zinc-950/60">
      <div className="px-4 py-3 border-b border-white/10">
        <h2 className="text-sm font-semibold">Привычки</h2>
        <p className="text-xs text-zinc-400 mt-1">
          Здесь твои ежедневные действия. Mindra помогает отмечать выполненные и держать рутину.
        </p>
      </div>

      {/* Форма создания */}
      <div className="px-4 py-3 border-b border-white/5 space-y-2">
        <input
          className="w-full rounded-xl bg-zinc-900 border border-white/10 px-3 py-2 text-xs outline-none focus:border-white/30"
          placeholder="Новая привычка…"
          value={newText}
          onChange={(e) => setNewText(e.target.value)}
        />
        <button
          onClick={handleCreate}
          disabled={creating || !newText.trim()}
          className="w-full rounded-xl bg-indigo-600 text-xs py-2 hover:bg-indigo-500 disabled:opacity-50"
        >
          {creating ? 'Добавляю…' : 'Добавить привычку'}
        </button>
        {error && <p className="text-[11px] text-red-400">{error}</p>}
      </div>

      {/* Список привычек */}
      <div className="flex-1 overflow-auto px-3 py-3 space-y-2">
        {loading ? (
          <p className="text-xs text-zinc-400">Загружаю привычки…</p>
        ) : habits.length === 0 ? (
          <p className="text-xs text-zinc-400">
            Пока у тебя нет привычек. Добавь одну — Mindra поможет держать рутину 💜
          </p>
        ) : (
          habits.map((h) => (
            <div
              key={h.index}
              className="flex items-start justify-between gap-2 rounded-xl border border-white/10 bg-zinc-900 px-3 py-2"
            >
              <div className="flex-1">
                <span
                  className={`text-xs ${
                    h.done ? 'line-through text-zinc-500' : 'text-zinc-100'
                  }`}
                >
                  {h.text}
                </span>
                {h.done && (
                  <div className="mt-1 text-[11px] text-emerald-400">✅ выполнена сегодня</div>
                )}
              </div>
              <div className="flex flex-col gap-1">
                {!h.done && (
                  <button
                    onClick={() => handleDone(h)}
                    className="text-[11px] px-2 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500"
                  >
                    Сделано
                  </button>
                )}
                <button
                  onClick={() => handleDelete(h)}
                  className="text-[11px] px-2 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700"
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
