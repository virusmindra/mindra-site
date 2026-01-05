"use client";

import { useEffect, useState } from "react";
import { enablePush, disablePush, getPushStatus } from "@/lib/push/client";

type Settings = {
  tz: string;
  quietEnabled: boolean;
  quietStart: number;
  quietEnd: number;
  quietBypassMin: number;
  notifyPush?: boolean; // опционально
};

function clampInt(v: any, min: number, max: number) {
  const n = Number(v);
  if (Number.isNaN(n)) return min;
  return Math.min(max, Math.max(min, Math.floor(n)));
}

async function safeJson(res: Response) {
  const ct = res.headers.get("content-type") || "";
  if (!ct.includes("application/json")) {
    const text = await res.text().catch(() => "");
    throw new Error(`Expected JSON but got "${ct || "unknown"}". ${text.slice(0, 120)}`);
  }
  return res.json();
}

const DEFAULTS: Settings = {
  tz: "UTC",
  quietEnabled: true,
  quietStart: 22,
  quietEnd: 8,
  quietBypassMin: 30,
  notifyPush: true,
};

export default function QuietHoursCard() {
  const [s, setS] = useState<Settings | null>(null);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // push UI
  const [pushBusy, setPushBusy] = useState(false);
  const [pushEnabled, setPushEnabled] = useState(false);
  const [pushPermission, setPushPermission] = useState<NotificationPermission | "unsupported">(
    "default"
  );
  const [pushSupported, setPushSupported] = useState(true);

  async function refreshPush() {
    try {
      const st: any = await getPushStatus();
      // st: { supported, permission, subscribed }
      setPushSupported(Boolean(st.supported));
      setPushPermission(st.permission ?? "default");
      setPushEnabled(Boolean(st.subscribed));
    } catch {
      // если что-то пошло не так — просто считаем, что push недоступен
      setPushSupported(false);
      setPushPermission("unsupported");
      setPushEnabled(false);
    }
  }

  async function load() {
    setErr(null);

    // SETTINGS
    const r = await fetch("/api/reminders/settings", { cache: "no-store" });
    if (!r.ok) throw new Error(`Settings GET failed: ${r.status}`);
    const j = await safeJson(r);

    setS({ ...DEFAULTS, ...(j.settings ?? {}) });

    // PUSH
    await refreshPush();
  }

  useEffect(() => {
    load().catch((e) => setErr(String(e?.message ?? e)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function save(next: Settings) {
    setSaving(true);
    setErr(null);
    setS(next);

    try {
      const r = await fetch("/api/reminders/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(next),
      });

      const j = await safeJson(r);
      if (!r.ok || !j.ok) throw new Error(j?.error || `Save failed (${r.status})`);

      if (j.settings) setS({ ...DEFAULTS, ...j.settings });
    } catch (e: any) {
      setErr(String(e?.message ?? e));
    } finally {
      setSaving(false);
    }
  }

  async function togglePush(next: boolean) {
    setPushBusy(true);
    setErr(null);

    try {
      if (next) {
        await enablePush();
      } else {
        await disablePush();
      }

      await refreshPush();

      // опционально синхроним в БД notifyPush
      if (s) {
        await save({ ...s, notifyPush: next });
      }
    } catch (e: any) {
      setErr(String(e?.message ?? e));
      await refreshPush();
    } finally {
      setPushBusy(false);
    }
  }

  if (!s) return <div className="rounded-2xl border p-4">Loading…</div>;

  const pushDenied = pushPermission === "denied";
  const pushLabel =
    !pushSupported ? "unsupported" : pushDenied ? "denied" : String(pushPermission);

  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4 space-y-4">
      <div>
        <div className="text-sm font-medium text-[var(--text)]">Push уведомления</div>
        <div className="text-xs text-[var(--muted)] mt-1">Включи push и настрой “тихие часы”.</div>
      </div>

      {/* PUSH TOGGLE */}
      <div className="flex items-center justify-between gap-3">
        <div className="text-sm text-[var(--text)]">
          Push уведомления
          <div className="text-xs text-[var(--muted)]">
            Permission: {pushLabel} • Status: {pushEnabled ? "On" : "Off"}
          </div>
        </div>

        <label className="inline-flex items-center gap-2 text-sm text-[var(--text)]">
          <input
            type="checkbox"
            checked={pushEnabled}
            disabled={pushBusy || !pushSupported || pushDenied}
            onChange={(e) => togglePush(e.target.checked)}
          />
          {pushBusy ? "..." : pushEnabled ? "On" : "Off"}
        </label>
      </div>

      {!pushSupported && (
        <div className="text-xs text-[var(--muted)]">
          Этот браузер не поддерживает Push (или нет Service Worker/HTTPS).
        </div>
      )}

      {pushDenied && (
        <div className="text-xs text-red-500">
          Уведомления заблокированы в браузере (Permission denied). Разблокируй в настройках сайта.
        </div>
      )}

      <div className="h-px bg-[var(--border)]" />

      {/* QUIET HOURS */}
      <div className="space-y-3">
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
            value={s.tz || ""}
            disabled={saving}
            onChange={(e) => setS({ ...s, tz: e.target.value })}
            onBlur={() => save({ ...s, tz: String(s.tz || "UTC") })}
            placeholder="America/New_York"
          />
        </label>
      </div>

      {err && <div className="text-sm text-red-500">{err}</div>}
    </div>
  );
}
