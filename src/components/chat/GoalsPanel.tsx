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
  <div className="flex flex-col h-full border-r border-[var(--border)] bg-[var(--card)]">
    <div className="px-4 py-3 border-b border-[var(--border)]">
      <h2 className="text-sm font-semibold text-[var(--text)]">Цели</h2>
      <p className="text-xs text-[var(--muted)] mt-1">
        Здесь твои долгосрочные и среднесрочные цели. Mindra помогает разбивать их на шаги.
      </p>
    </div>

    <div className="px-4 py-3 border-b border-[var(--border)] space-y-2">
      <input
        className="w-full rounded-xl bg-[var(--bg)] border border-[var(--border)] px-3 py-2 text-xs text-[var(--text)] outline-none focus:border-[var(--accent)]"
        placeholder="Новая цель…"
        value={newText}
        onChange={(e) => setNewText(e.target.value)}
      />
      <div className="flex gap-2">
        <input
          type="date"
          className="flex-1 rounded-xl bg-[var(--bg)] border border-[var(--border)] px-3 py-2 text-xs text-[var(--text)] outline-none focus:border-[var(--accent)]"
          value={newDeadline}
          onChange={(e) => setNewDeadline(e.target.value)}
        />
        <label className="flex items-center gap-1 text-[11px] text-[var(--muted)]">
          <input
            type="checkbox"
            checked={newRemind}
            onChange={(e) => setNewRemind(e.target.checked)}
            className="accent-[var(--accent)]"
          />
          Напоминать
        </label>
      </div>

      <button
        onClick={handleCreate}
        disabled={creating || !newText.trim()}
        className="w-full rounded-xl bg-[var(--accent)] text-white text-xs py-2 hover:opacity-90 disabled:opacity-50"
      >
        {creating ? 'Добавляю…' : 'Добавить цель'}
      </button>

      {error && <p className="text-[11px] text-red-500">{error}</p>}
    </div>

    <div className="flex-1 overflow-auto px-3 py-3 space-y-2">
      {loading ? (
        <p className="text-xs text-[var(--muted)]">Загружаю цели…</p>
      ) : goals.length === 0 ? (
        <p className="text-xs text-[var(--muted)]">
          Пока у тебя нет целей. Добавь первую — Mindra поможет ей заняться 💜
        </p>
      ) : (
        goals.map((g) => (
          <div
            key={g.index}
            className="flex items-start justify-between gap-2 rounded-xl border border-[var(--border)] bg-[var(--bg)] px-3 py-2"
          >
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span
                  className={`text-xs ${
                    g.done ? 'line-through text-[var(--muted)]' : 'text-[var(--text)]'
                  }`}
                >
                  {g.text}
                </span>
              </div>

              <div className="mt-1 flex flex-wrap gap-x-2 gap-y-1 text-[11px] text-[var(--muted)]">
                {g.deadline && <span>⏳ {g.deadline}</span>}
                {g.remind && <span>🔔 напоминания включены</span>}
                {g.done && <span>✅ выполнена</span>}
              </div>
            </div>

            <div className="flex flex-col gap-1">
              {!g.done && (
                <button
                  onClick={() => handleDone(g)}
                  className="text-[11px] px-2 py-1 rounded-lg bg-emerald-600 text-white hover:opacity-90"
                >
                  Готово
                </button>
              )}
              <button
                onClick={() => handleDelete(g)}
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