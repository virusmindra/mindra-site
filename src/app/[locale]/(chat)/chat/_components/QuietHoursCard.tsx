'use client';

import { useEffect, useState } from 'react';
import { enablePush } from '@/lib/push/client';
import { disablePush, isPushSubscribed } from "@/lib/push/client";

type Settings = {
  tz: string;
  quietEnabled: boolean;
  quietStart: number;
  quietEnd: number;
  quietBypassMin: number;

  notifyPush?: boolean;
};


const DEFAULTS: Settings = {
  tz: 'UTC',
  quietEnabled: true,
  quietStart: 22,
  quietEnd: 8,
  quietBypassMin: 30,
  notifyPush: true,
};

function clampInt(v: any, min: number, max: number) {
  const n = Number(v);
  if (Number.isNaN(n)) return min;
  return Math.min(max, Math.max(min, Math.floor(n)));
}

async function fetchSettings(): Promise<
  { ok: true; settings: Partial<Settings> } | { ok: false; error: string }
> {
  const r = await fetch('/api/reminders/settings', { method: 'GET' });
  const j = await r.json().catch(() => null);

  if (r.ok && j?.ok) return { ok: true, settings: j.settings || {} };
  return { ok: false, error: j?.error || `Request failed: ${r.status}` };
}

async function saveSettings(payload: Settings) {
  const r = await fetch('/api/reminders/settings', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  const j = await r.json().catch(() => null);
  if (r.ok && j?.ok) return { ok: true as const };
  return { ok: false as const, error: j?.error || `Save failed: ${r.status}` };
}
 type QuietHoursT = {
  title: string;
  subtitle: string;

  push: string;
  on: string;
  off: string;
  test: string;

  quietTitle: string;
  quietHint: string;

  enabled: string;
  start: string;
  end: string;
  bypass: string;
  timezone: string;

  retry: string;
  loading: string;
};

type Props = {
  t?: QuietHoursT;
};

export default function QuietHoursCard({ t }: Props) {
  const [s, setS] = useState<Settings>(DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [pushEnabled, setPushEnabled] = useState(false);

  const [pushBusy, setPushBusy] = useState(false);
  const [pushOk, setPushOk] = useState<boolean | null>(null);

  const [err, setErr] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setErr(null);

    const res = await fetchSettings();

    if (res.ok) {
      setS({ ...DEFAULTS, ...res.settings });
    } else {
      setErr(res.error);
      setS(DEFAULTS);
    }

    const subscribed = await isPushSubscribed().catch(() => false);
const wantPush = Boolean((res.ok ? (res.settings as any)?.notifyPush : DEFAULTS.notifyPush) ?? true);

// показываем ON только если и в настройках ON, и браузер реально подписан
setPushEnabled(wantPush && subscribed);

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

  const togglePush = async (next: boolean) => {
  setPushBusy(true);
  setErr(null);

  try {
    if (next) {
      await enablePush(); // создаст/обновит push_subscriptions на сервере (у тебя уже так)
      await save({ ...s, notifyPush: true } as any);
      setPushEnabled(true);
      setPushOk(true);
    } else {
      await disablePush();
      await save({ ...s, notifyPush: false } as any);
      setPushEnabled(false);
      setPushOk(true);
    }
  } catch (e: any) {
    setPushOk(false);
    setErr(String(e?.message ?? e));
  } finally {
    setPushBusy(false);
  }
};

  const TT: QuietHoursT = t ?? {
    title: "Push notifications",
    subtitle: "Enable push and configure quiet hours.",

    push: "Push notifications",
    on: "On",
    off: "Off",
    test: "Test push",

    quietTitle: "Quiet hours",
    quietHint: "Notifications won’t be sent during this time (except urgent ones).",

    enabled: "Enabled",
    start: "Start",
    end: "End",
    bypass: "Bypass quiet hours if minutes left",
    timezone: "Timezone (IANA)",

    retry: "Retry",
    loading: "Loading…",
  };

  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4 space-y-4">
      <div>
        <div className="text-sm font-medium text-[var(--text)]">{TT.title}</div>
        <div className="text-xs text-[var(--muted)] mt-1">{TT.subtitle}</div>
      </div>

      {loading && <div className="text-xs text-[var(--muted)]">{TT.loading}</div>}

      {err && (
        <div className="text-xs text-red-500">
          {err}
          <button onClick={load} className="ml-2 underline text-[var(--text)]">
            {TT.retry}
          </button>
        </div>
      )}

      {/* PUSH */}
<div className="flex items-center justify-between gap-3">
  <div className="text-sm text-[var(--text)]">
    {TT.push}
    {pushOk === true && <span className="ml-2 text-xs text-green-500">✅</span>}
    {pushOk === false && <span className="ml-2 text-xs text-red-500">❌</span>}
  </div>

  <div className="inline-flex rounded-full bg-[var(--card)] border border-[var(--border)] p-1 text-[11px]">
    <button
      onClick={() => togglePush(false)}
      disabled={pushBusy}
      className={[
        "px-2 py-0.5 rounded-full transition",
        !pushEnabled
          ? "bg-[var(--accent)] text-white"
          : "text-[var(--muted)] hover:bg-black/5 dark:hover:bg-white/10",
      ].join(" ")}
    >
      {TT.off}
    </button>

    <button
      onClick={() => togglePush(true)}
      disabled={pushBusy}
      className={[
        "px-2 py-0.5 rounded-full transition",
        pushEnabled
          ? "bg-[var(--accent)] text-white"
          : "text-[var(--muted)] hover:bg-black/5 dark:hover:bg-white/10",
      ].join(" ")}
    >
      {TT.on}
    </button>
  </div>
</div>

      {/* QUIET HOURS */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-sm font-medium text-[var(--text)]">{TT.quietTitle}</div>
          <div className="text-xs text-[var(--muted)] mt-1">
            {TT.quietHint}
          </div>
        </div>

        <label className="flex items-center gap-2 text-sm text-[var(--text)]">
          <input
            type="checkbox"
            checked={Boolean(s.quietEnabled)}
            onChange={(e) => save({ ...s, quietEnabled: e.target.checked })}
            disabled={saving}
          />
         {TT.enabled}
        </label>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <label className="text-sm space-y-1">
          <div className="text-xs text-[var(--muted)]">{TT.start}(0–23)</div>
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
          <div className="text-xs text-[var(--muted)]">{TT.end} (0–23)</div>
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
        <div className="text-xs text-[var(--muted)]">{TT.bypass}</div>
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
      <button
  onClick={async () => {
    const r = await fetch("/api/push/test", { method: "POST" });
    const j = await r.json().catch(() => null);
    alert(r.ok ? "Sent ✅ (check notification)" : `Failed: ${j?.error || r.status}`);
  }}
  className="px-3 py-1.5 rounded-xl border border-[var(--border)] text-sm hover:bg-black/5 dark:hover:bg-white/10"
>
  {TT.test}
</button>


      <label className="text-sm space-y-1 block">
        <div className="text-xs text-[var(--muted)]">{TT.timezone}</div>
        <input
          className="w-full rounded-xl border border-[var(--border)] bg-transparent px-3 py-2 text-[var(--text)]"
          value={s.tz || ''}
          disabled={saving}
          onChange={(e) => setS({ ...s, tz: e.target.value })}
          onBlur={() => save({ ...s, tz: String(s.tz || 'UTC') })}
          placeholder="America/New_York"
        />
      </label>
    </div>
  );
}
