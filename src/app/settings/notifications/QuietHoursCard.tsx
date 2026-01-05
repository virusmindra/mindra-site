"use client";

import { useEffect, useState } from "react";

type Settings = {
  tz: string;
  quietEnabled: boolean;
  quietStart: number;
  quietEnd: number;
  quietBypassMin: number;
  notifyPush?: boolean; // опционально, если в БД есть
};

type PushStatus = {
  supported: boolean;
  permission: NotificationPermission | "unsupported";
  subscribed: boolean;
};

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  const arr = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i);
  return arr;
}

async function safeJson(res: Response) {
  const ct = res.headers.get("content-type") || "";
  if (!ct.includes("application/json")) {
    const text = await res.text().catch(() => "");
    throw new Error(
      `Expected JSON but got "${ct || "unknown"}". ${text.slice(0, 120)}`
    );
  }
  return res.json();
}

async function getServiceWorkerReg() {
  // важно: register должен совпадать с тем, что у тебя реально лежит в public/sw.js
  return await navigator.serviceWorker.register("/sw.js");
}

async function getPushStatus(): Promise<PushStatus> {
  const supported =
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window;

  if (!supported) {
    return { supported: false, permission: "unsupported", subscribed: false };
  }

  const permission = Notification.permission;
  if (permission !== "granted") {
    return { supported: true, permission, subscribed: false };
  }

  const reg = await navigator.serviceWorker.ready;
  const sub = await reg.pushManager.getSubscription();
  return { supported: true, permission, subscribed: Boolean(sub) };
}

export default function QuietHoursCard() {
  const [s, setS] = useState<Settings | null>(null);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const [push, setPush] = useState<PushStatus>({
    supported: true,
    permission: "default",
    subscribed: false,
  });
  const [pushBusy, setPushBusy] = useState(false);

  async function load() {
    setErr(null);

    // ✅ ВАЖНО: plural settings
    const r = await fetch("/api/reminders/settings", { cache: "no-store" });
    if (!r.ok) {
      throw new Error(`Settings GET failed: ${r.status}`);
    }
    const j = await safeJson(r);
    setS(j.settings);

    // параллельно подтягиваем статус push
    try {
      const st = await getPushStatus();
      setPush(st);
    } catch {
      // не критично
    }
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
      if (!r.ok || !j.ok) {
        throw new Error(j?.error || `Save failed (${r.status})`);
      }

      // если сервер вернул settings — синхронизируем
      if (j.settings) setS(j.settings);
    } catch (e: any) {
      setErr(String(e?.message ?? e));
    } finally {
      setSaving(false);
    }
  }

  async function enablePush() {
    setPushBusy(true);
    setErr(null);

    try {
      const supported =
        "serviceWorker" in navigator && "PushManager" in window;
      if (!supported) throw new Error("Push is not supported in this browser.");

      const perm = await Notification.requestPermission();
      if (perm !== "granted") {
        setPush({ supported: true, permission: perm, subscribed: false });
        throw new Error("Permission denied. Allow notifications in browser settings.");
      }

      // регистрируем SW
      await getServiceWorkerReg();
      const reg = await navigator.serviceWorker.ready;

      // получаем publicKey
      const vr = await fetch("/api/push/vapid", { cache: "no-store" });
      if (!vr.ok) throw new Error(`/api/push/vapid failed (${vr.status})`);
      const vj = await safeJson(vr);
      const publicKey = vj?.publicKey;
      if (!publicKey) throw new Error("Missing publicKey from /api/push/vapid");

      // подписка
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      });

      // отправляем подписку на сервер
      const sr = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(sub),
      });

      const sj = await safeJson(sr);
      if (!sr.ok || !sj.ok) throw new Error(sj?.error || "Subscribe failed");

      // обновляем статус
      const st = await getPushStatus();
      setPush(st);

      // ✅ опционально: включить notifyPush в настройках, если ты это хранишь
      if (s) {
        await save({ ...s, notifyPush: true });
      }
    } catch (e: any) {
      setErr(String(e?.message ?? e));
      // на всякий — обновим статус
      try {
        const st = await getPushStatus();
        setPush(st);
      } catch {}
    } finally {
      setPushBusy(false);
    }
  }

  if (!s) return <div className="rounded-2xl border p-4">Loading…</div>;

  const pushEnabledUI =
    push.supported && push.permission === "granted" && push.subscribed;

  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4 space-y-4">
      <div>
        <div className="text-sm font-medium text-[var(--text)]">Push уведомления</div>
        <div className="text-xs text-[var(--muted)] mt-1">
          Включи push и настрой “тихие часы”.
        </div>
      </div>

      {/* PUSH */}
      <div className="flex items-center justify-between gap-3">
        <div className="text-sm text-[var(--text)]">
          Разрешить push-уведомления{" "}
          {pushEnabledUI ? (
            <span className="text-green-500 ml-1">✅ включено</span>
          ) : (
            <span className="text-red-500 ml-1">✖ выключено</span>
          )}
        </div>

        <button
          className="px-3 py-2 rounded-xl border border-[var(--border)] hover:bg-black/5 dark:hover:bg-white/10 disabled:opacity-50"
          onClick={enablePush}
          disabled={pushBusy || !push.supported}
        >
          {pushBusy ? "..." : "Включить Push"}
        </button>
      </div>

      {/* QUIET HOURS */}
      <div className="pt-3 border-t border-[var(--border)] space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-medium text-[var(--text)]">Тихие часы</div>
            <div className="text-xs text-[var(--muted)]">
              В это время напоминания не будут отправляться (кроме срочных).
            </div>
          </div>

          <label className="flex items-center gap-2 text-sm text-[var(--text)]">
            <input
              type="checkbox"
              checked={s.quietEnabled}
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
              className="w-full rounded-xl border border-[var(--border)] bg-transparent px-3 py-2"
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
            <div className="text-xs text-[var(--muted)]">Конец (0–23)</div>
            <input
              className="w-full rounded-xl border border-[var(--border)] bg-transparent px-3 py-2"
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
          <div className="text-xs text-[var(--muted)]">
            Пробивать тихие часы, если осталось минут
          </div>
          <input
            className="w-full rounded-xl border border-[var(--border)] bg-transparent px-3 py-2"
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
          <div className="text-xs text-[var(--muted)]">Timezone (IANA)</div>
          <input
            className="w-full rounded-xl border border-[var(--border)] bg-transparent px-3 py-2"
            value={s.tz}
            onChange={(e) => setS({ ...s, tz: e.target.value })}
            onBlur={() => save(s)}
            placeholder="America/New_York"
            disabled={saving}
          />
        </label>
      </div>

      {err && <div className="text-sm text-red-500">{err}</div>}
    </div>
  );
}
