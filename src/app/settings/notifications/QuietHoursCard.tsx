"use client";

import { useEffect, useState } from "react";

type Settings = {
  tz: string;
  quietEnabled: boolean;
  quietStart: number;
  quietEnd: number;
  quietBypassMin: number;
};

export default function QuietHoursCard() {
  const [s, setS] = useState<Settings | null>(null);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function load() {
    setErr(null);
    const r = await fetch("/api/reminders/setting");
    const j = await r.json();
    setS(j.settings);
  }

  useEffect(() => { load(); }, []);

  async function save(next: Settings) {
    setSaving(true);
    setErr(null);
    setS(next);

    const r = await fetch("/api/reminders/setting", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(next),
    });

    const j = await r.json();
    setSaving(false);
    if (!j.ok) setErr(j.error || "Save error");
  }

  if (!s) return <div className="rounded-xl border p-4">Loading…</div>;

  return (
    <div className="rounded-xl border p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <div className="font-semibold">Quiet hours</div>
          <div className="text-sm opacity-70">Mute reminders during selected hours.</div>
        </div>

        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={s.quietEnabled}
            onChange={(e) => save({ ...s, quietEnabled: e.target.checked })}
          />
          Enabled
        </label>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <label className="text-sm space-y-1">
          <div className="opacity-70">Start (0–23)</div>
          <input
            className="w-full rounded-md border px-3 py-2"
            type="number"
            min={0}
            max={23}
            value={s.quietStart}
            onChange={(e) => setS({ ...s, quietStart: Number(e.target.value) })}
            onBlur={() => save(s)}
            disabled={!s.quietEnabled || saving}
          />
        </label>

        <label className="text-sm space-y-1">
          <div className="opacity-70">End (0–23)</div>
          <input
            className="w-full rounded-md border px-3 py-2"
            type="number"
            min={0}
            max={23}
            value={s.quietEnd}
            onChange={(e) => setS({ ...s, quietEnd: Number(e.target.value) })}
            onBlur={() => save(s)}
            disabled={!s.quietEnabled || saving}
          />
        </label>
      </div>

      <label className="text-sm space-y-1 block">
        <div className="opacity-70">Bypass if due within (minutes)</div>
        <input
          className="w-full rounded-md border px-3 py-2"
          type="number"
          min={0}
          max={180}
          value={s.quietBypassMin}
          onChange={(e) => setS({ ...s, quietBypassMin: Number(e.target.value) })}
          onBlur={() => save(s)}
          disabled={!s.quietEnabled || saving}
        />
      </label>

      <label className="text-sm space-y-1 block">
        <div className="opacity-70">Timezone</div>
        <input
          className="w-full rounded-md border px-3 py-2"
          value={s.tz}
          onChange={(e) => setS({ ...s, tz: e.target.value })}
          onBlur={() => save(s)}
          placeholder="America/New_York"
          disabled={saving}
        />
        <div className="text-xs opacity-60">
          Tip: you can set <code>America/New_York</code>, <code>Europe/Warsaw</code>, etc.
        </div>
      </label>

      {err && <div className="text-sm text-red-600">{err}</div>}
    </div>
  );
}
