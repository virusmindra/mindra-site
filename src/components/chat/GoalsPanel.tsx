// src/components/chat/GoalsPanel.tsx
'use client';

import { useEffect, useState } from 'react';

type Goal = {
  index: number;
  text: string;
  done: boolean;
  deadline?: string | null;
  remind?: boolean;
};

export default function GoalsPanel() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newText, setNewText] = useState('');
  const [newDeadline, setNewDeadline] = useState('');
  const [newRemind, setNewRemind] = useState(false);

  const loadGoals = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/goals', { cache: 'no-store' });
      const data = await res.json();
      setGoals(data.goals ?? []);
    } catch (e) {
      console.error(e);
      setError('Не удалось загрузить цели.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGoals();
  }, []);

  const handleCreate = async () => {
    if (!newText.trim()) return;
    setCreating(true);
    setError(null);
    try {
      const res = await fetch('/api/goals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: newText.trim(),
          deadline: newDeadline || null,
          remind: newRemind,
        }),
      });

      if (res.status === 403) {
        const data = await res.json();
        setError(data.detail || 'Достигнут лимит целей.');
      } else if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.detail || 'Не удалось добавить цель.');
      } else {
        setNewText('');
        setNewDeadline('');
        setNewRemind(false);
        await loadGoals();
      }
    } catch (e) {
      console.error(e);
      setError('Ошибка сервера при добавлении цели.');
    } finally {
      setCreating(false);
    }
  };

  const handleDone = async (goal: Goal) => {
    setError(null);
    try {
      const res = await fetch(`/api/goals/${goal.index}/done`, {
        method: 'POST',
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.detail || 'Не удалось отметить цель выполненной.');
      } else {
        await loadGoals();
      }
    } catch (e) {
      console.error(e);
      setError('Ошибка сервера при отметке цели.');
    }
  };

  const handleDelete = async (goal: Goal) => {
    setError(null);
    try {
      const res = await fetch(`/api/goals/${goal.index}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.detail || 'Не удалось удалить цель.');
      } else {
        await loadGoals();
      }
    } catch (e) {
      console.error(e);
      setError('Ошибка сервера при удалении цели.');
    }
  };

  return (
    <div className="flex flex-col h-full border-r border-white/10 bg-zinc-950/60">
      <div className="px-4 py-3 border-b border-white/10">
        <h2 className="text-sm font-semibold">Цели</h2>
        <p className="text-xs text-zinc-400 mt-1">
          Здесь твои долгосрочные и среднесрочные цели. Mindra помогает разбивать их на шаги.
        </p>
      </div>

      {/* Форма создания */}
      <div className="px-4 py-3 border-b border-white/5 space-y-2">
        <input
          className="w-full rounded-xl bg-zinc-900 border border-white/10 px-3 py-2 text-xs outline-none focus:border-white/30"
          placeholder="Новая цель…"
          value={newText}
          onChange={(e) => setNewText(e.target.value)}
        />
        <div className="flex gap-2">
          <input
            type="date"
            className="flex-1 rounded-xl bg-zinc-900 border border-white/10 px-3 py-2 text-xs outline-none focus:border-white/30"
            value={newDeadline}
            onChange={(e) => setNewDeadline(e.target.value)}
          />
          <label className="flex items-center gap-1 text-[11px] text-zinc-300">
            <input
              type="checkbox"
              checked={newRemind}
              onChange={(e) => setNewRemind(e.target.checked)}
              className="accent-indigo-500"
            />
            Напоминать
          </label>
        </div>
        <button
          onClick={handleCreate}
          disabled={creating || !newText.trim()}
          className="w-full rounded-xl bg-indigo-600 text-xs py-2 hover:bg-indigo-500 disabled:opacity-50"
        >
          {creating ? 'Добавляю…' : 'Добавить цель'}
        </button>
        {error && <p className="text-[11px] text-red-400">{error}</p>}
      </div>

      {/* Список целей */}
      <div className="flex-1 overflow-auto px-3 py-3 space-y-2">
        {loading ? (
          <p className="text-xs text-zinc-400">Загружаю цели…</p>
        ) : goals.length === 0 ? (
          <p className="text-xs text-zinc-400">
            Пока у тебя нет целей. Добавь первую — Mindra поможет ей заняться 💜
          </p>
        ) : (
          goals.map((g) => (
            <div
              key={g.index}
              className="flex items-start justify-between gap-2 rounded-xl border border-white/10 bg-zinc-900 px-3 py-2"
            >
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span
                    className={`text-xs ${
                      g.done ? 'line-through text-zinc-500' : 'text-zinc-100'
                    }`}
                  >
                    {g.text}
                  </span>
                </div>
                <div className="mt-1 flex flex-wrap gap-x-2 gap-y-1 text-[11px] text-zinc-400">
                  {g.deadline && <span>⏳ {g.deadline}</span>}
                  {g.remind && <span>🔔 напоминания включены</span>}
                  {g.done && <span>✅ выполнена</span>}
                </div>
              </div>

              <div className="flex flex-col gap-1">
                {!g.done && (
                  <button
                    onClick={() => handleDone(g)}
                    className="text-[11px] px-2 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500"
                  >
                    Готово
                  </button>
                )}
                <button
                  onClick={() => handleDelete(g)}
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
