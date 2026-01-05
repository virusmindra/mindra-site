'use client';

import { useEffect, useState } from 'react';
import { enablePush } from '@/lib/push/client';

type Settings = {
  tz: string;
  quietEnabled: boolean;
  quietStart: number;
  quietEnd: number;
  quietBypassMin: number;

  notifyPush?: boolean;
  notifyInApp?: boolean;
  pauseAll?: boolean;
};

function clampInt(v: any, min: number, max: number) {
  const n = Number(v);
  if (Number.isNaN(n)) return min;
  return Math.min(max, Math.max(min, Math.floor(n)));
}

export default function QuietHoursCard() {
  const [s, setS] = useState<Settings | null>(null);
  const [saving, setSaving] = useState(false);
  const [pushBusy, setPushBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [pushOk, setPushOk] = useState<boolean | null>(null);

  const load = async () => {
    setErr(null);
    const r = await fetch('/api/reminders/setting', { cache: 'no-store' });
    const j = await r.json().catch(() => null);
    if (!r.ok || !j?.ok) {
      setErr(j?.error || 'Не удалось загрузить настройки');
      return;
    }
    setS(j.settings);
  };

  useEffect(() => {
    load();
  }, []);

  const save = async (next: Settings) => {
    setSaving(true);
    setErr(null);
    setS(next);

    const r = await fetch('/api/reminders/setting', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(next),
    });

    const j = await r.json().catch(() => null);
    setSaving(false);

    if (!r.ok || !j?.ok) {
      setErr(j?.error || 'Ошибка сохранения');
    }
  };

  const handleEnablePush = async () => {
    setPushBusy(true);
    setErr(null);
    try {
      await enablePush();
      setPushOk(true);

      // если хочешь — сразу включим notifyPush в настройках
      if (s) {
        await save({ ...s, notifyPush: true });
      }
    } catch (e: any) {
      setPushOk(false);
      setErr(String(e?.message ?? e));
    } finally {
      setPushBusy(false);
    }
  };

  if (!s) {
    return (
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4">
        <div className="text-sm font-medium text-[var(--text)]">Push уведомления</div>
        <div className="text-xs text-[var(--muted)] mt-1">Загрузка…</div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4 space-y-4">
      <div>
        <div className="text-sm font-medium text-[var(--text)]">Push уведомления</div>
        <div className="text-xs text-[var(--muted)] mt-1">
          Включи push и настрой “тихие часы”, чтобы Mindra не отвлекала ночью.
        </div>
      </div>

      {/* PUSH enable */}
      <div className="flex items-center justify-between gap-3">
        <div className="text-sm text-[var(--text)]">
          Разрешить push-уведомления
          {pushOk === true && <span className="ml-2 text-xs text-green-600">✅ включено</span>}
          {pushOk === false && <span className="ml-2 text-xs text-red-600">❌ ошибка</span>}
        </div>

        <button
          onClick={handleEnablePush}
          disabled={pushBusy}
          className="px-3 py-1.5 rounded-xl border border-[var(--border)] text-sm hover:bg-black/5 dark:hover:bg-white/10 disabled:opacity-50"
        >
          {pushBusy ? 'Включаю…' : 'Включить Push'}
        </button>
      </div>

      <div className="h-px bg-[var(--border)]" />

      {/* QUIET HOURS */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-sm font-medium text-[var(--text)]">Тихие часы</div>
          <div className="text-xs text-[var(--muted)] mt-1">
            В это время напоминания не будут отправляться (кроме срочных).
          </div>
        </div>

        <label className="flex items-center gap-2 text-sm text-[var(--text)]">
          <input
            type="checkbox"
            checked={Boolean(s.quietEnabled)}
            onChange={(e) => save({ ...s, quietEnabled: e.target.checked })}
          />
          Вкл
        </label>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <label className="text-sm space-y-1">
          <div className="text-xs text-[var(--muted)]">Начало (0–23)</div>
          <input
            className="w-full rounded-xl border border-[var(--border)] bg-transparent px-3 py-2 text-[var(--text)]"
            type="number"
            min={0}
            max={23}
            value={s.quietStart}
            disabled={!s.quietEnabled || saving}
            onChange={(e) => setS({ ...s, quietStart: clampInt(e.target.value, 0, 23) })}
            onBlur={() => save({ ...s, quietStart: clampInt(s.quietStart, 0, 23) })}
          />
        </label>

        <label className="text-sm space-y-1">
          <div className="text-xs text-[var(--muted)]">Конец (0–23)</div>
          <input
            className="w-full rounded-xl border border-[var(--border)] bg-transparent px-3 py-2 text-[var(--text)]"
            type="number"
            min={0}
            max={23}
            value={s.quietEnd}
            disabled={!s.quietEnabled || saving}
            onChange={(e) => setS({ ...s, quietEnd: clampInt(e.target.value, 0, 23) })}
            onBlur={() => save({ ...s, quietEnd: clampInt(s.quietEnd, 0, 23) })}
          />
        </label>
      </div>

      <label className="text-sm space-y-1 block">
        <div className="text-xs text-[var(--muted)]">Пробивать тихие часы, если осталось минут</div>
        <input
          className="w-full rounded-xl border border-[var(--border)] bg-transparent px-3 py-2 text-[var(--text)]"
          type="number"
          min={0}
          max={180}
          value={s.quietBypassMin}
          disabled={!s.quietEnabled || saving}
          onChange={(e) => setS({ ...s, quietBypassMin: clampInt(e.target.value, 0, 180) })}
          onBlur={() => save({ ...s, quietBypassMin: clampInt(s.quietBypassMin, 0, 180) })}
        />
      </label>

      <label className="text-sm space-y-1 block">
        <div className="text-xs text-[var(--muted)]">Timezone (IANA)</div>
        <input
          className="w-full rounded-xl border border-[var(--border)] bg-transparent px-3 py-2 text-[var(--text)]"
          value={s.tz || ''}
          disabled={saving}
          onChange={(e) => setS({ ...s, tz: e.target.value })}
          onBlur={() => save({ ...s, tz: String(s.tz || 'UTC') })}
          placeholder="America/New_York"
        />
      </label>

      {err && <div className="text-xs text-red-600">{err}</div>}
    </div>
  );
}
