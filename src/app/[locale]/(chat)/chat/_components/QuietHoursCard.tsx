'use client';

import { useEffect, useState } from 'react';
import { enablePush } from '@/lib/push/client';

type Settings = {
  tz: string;
  quietEnabled: boolean;
  quietStart: number;
  quietEnd: number;
  quietBypassMin: number;
};

const DEFAULTS: Settings = {
  tz: 'UTC',
  quietEnabled: true,
  quietStart: 22,
  quietEnd: 8,
  quietBypassMin: 30,
};

function clampInt(v: any, min: number, max: number) {
  const n = Number(v);
  if (Number.isNaN(n)) return min;
  return Math.min(max, Math.max(min, Math.floor(n)));
}

async function fetchSettings(): Promise<{ ok: true; settings: Settings } | { ok: false; error: string }> {
  // ✅ пробуем оба пути (частая причина “вечной загрузки”)
  const urls = ['/api/reminders/setting', '/api/reminders/settings'];

  for (const url of urls) {
    try {
      const r = await fetch(url, { cache: 'no-store' });
      const j = await r.json().catch(() => null);

      if (r.ok && j?.ok && j?.settings) {
        return { ok: true, settings: j.settings as Settings };
      }

      // если 401/404/500 — вернем понятную ошибку
      const msg =
        j?.error ||
        j?.message ||
        `Request failed: ${r.status} ${r.statusText} (${url})`;
      // не сразу сдаёмся — пробуем следующий url
      if (url === urls[urls.length - 1]) return { ok: false, error: msg };
    } catch (e: any) {
      if (url === urls[urls.length - 1]) {
        return { ok: false, error: String(e?.message ?? e) };
      }
    }
  }

  return { ok: false, error: 'Unknown error' };
}

async function saveSettings(payload: Partial<Settings>) {
  const urls = ['/api/reminders/setting', '/api/reminders/settings'];

  // сохраняем туда, где реально работает
  for (const url of urls) {
    const r = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const j = await r.json().catch(() => null);
    if (r.ok && j?.ok) return { ok: true as const };

    // если это последний url — вернем ошибку
    if (url === urls[urls.length - 1]) {
      return { ok: false as const, error: j?.error || `Save failed: ${r.status} (${url})` };
    }
  }

  return { ok: false as const, error: 'Save failed' };
}

export default function QuietHoursCard() {
  const [s, setS] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [pushBusy, setPushBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [pushOk, setPushOk] = useState<boolean | null>(null);

  const load = async () => {
    setLoading(true);
    setErr(null);

    const res = await fetchSettings();

    if (res.ok) {
      setS({
        ...DEFAULTS,
        ...res.settings,
      });
    } else {
      // ✅ показываем ошибку + даём дефолт, чтобы UI не был пустой
      setErr(res.error);
      setS(DEFAULTS);
    }

    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const save = async (next: Settings) => {
    setSaving(true);
    setErr(null);
    setS(next);

    const res = await saveSettings(next);

    setSaving(false);
    if (!res.ok) setErr(res.error || 'Ошибка сохранения');
  };

  const handleEnablePush = async () => {
    setPushBusy(true);
    setErr(null);
    try {
      await enablePush();
      setPushOk(true);
    } catch (e: any) {
      setPushOk(false);
      setErr(String(e?.message ?? e));
    } finally {
      setPushBusy(false);
    }
  };

  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4 space-y-4">
      <div>
        <div className="text-sm font-medium text-[var(--text)]">Push уведомления</div>
        <div className="text-xs text-[var(--muted)] mt-1">
          Включи push и настрой “тихие часы”.
        </div>
      </div>

      {loading && (
        <div className="text-xs text-[var(--muted)]">Загрузка…</div>
      )}

      {err && (
        <div className="text-xs text-red-500">
          {err}
          <button
            onClick={load}
            className="ml-2 underline text-[var(--text)]"
          >
            Retry
          </button>
        </div>
      )}

      {/* PUSH enable */}
      <div className="flex items-center justify-between gap-3">
        <div className="text-sm text-[var(--text)]">
          Разрешить push-уведомления
          {pushOk === true && <span className="ml-2 text-xs text-green-500">✅ включено</span>}
          {pushOk === false && <span className="ml-2 text-xs text-red-500">❌ ошибка</span>}
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
      {s && (
        <>
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
                disabled={saving}
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
        </>
      )}
    </div>
  );
}
