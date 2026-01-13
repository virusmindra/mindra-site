// src/lib/push/client.ts
type PushStatus =
  | { supported: false; permission: NotificationPermission; subscribed: false }
  | { supported: true; permission: NotificationPermission; subscribed: boolean; endpoint?: string };

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  const arr = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i);
  return arr;
}

async function getSWRegistration() {
  // не регистрируем каждый раз заново — сначала пробуем существующую
  const existing = await navigator.serviceWorker.getRegistration();
  if (existing) return existing;
  return navigator.serviceWorker.register("/sw.js");
}

export async function getPushStatus(): Promise<PushStatus> {
  const supported = "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
  const permission: NotificationPermission = supported ? Notification.permission : "default";

  if (!supported) return { supported: false, permission, subscribed: false };

  const reg = await navigator.serviceWorker.ready;
  const sub = await reg.pushManager.getSubscription();
  if (!sub) return { supported: true, permission, subscribed: false };

  return { supported: true, permission, subscribed: true, endpoint: sub.endpoint };
}

export async function enablePush() {
  const supported = "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
  if (!supported) throw new Error("Push not supported in this browser");

  // попросим разрешение, если не дано
  if (Notification.permission === "denied") {
    throw new Error("Push blocked in browser settings (permission denied)");
  }
  if (Notification.permission === "default") {
    const perm = await Notification.requestPermission();
    if (perm !== "granted") throw new Error("Push permission not granted");
  }

  const reg = await getSWRegistration();

  const res = await fetch("/api/push/vapid");
  const j = await res.json().catch(() => null);

  if (!res.ok || !j?.ok || !j?.publicKey) {
    throw new Error(j?.error || `Failed to load VAPID key (${res.status})`);
  }

  // если уже подписан — просто перезапишем в базе (на всякий)
  const existing = await reg.pushManager.getSubscription();
  const sub =
    existing ??
    (await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(j.publicKey),
    }));

  const r2 = await fetch("/api/push/subscribe", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(sub),
  });

  const j2 = await r2.json().catch(() => null);
  if (!r2.ok || !j2?.ok) throw new Error(j2?.error || `Subscribe API failed (${r2.status})`);

  return true;
}

export async function isPushSubscribed(): Promise<boolean> {
  if (typeof window === "undefined") return false;
  if (!("serviceWorker" in navigator)) return false;

  const reg = await navigator.serviceWorker.ready;
  const sub = await reg.pushManager.getSubscription();
  return !!sub;
}

export async function disablePush() {
  const supported =
    "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
  if (!supported) return { ok: true as const };

  const reg = await navigator.serviceWorker.ready;
  const sub = await reg.pushManager.getSubscription();
  if (!sub) return { ok: true as const };

  // 1) unsubscribe browser
  await sub.unsubscribe().catch(() => {});

  // 2) delete in DB by endpoint
  await fetch("/api/push/unsubscribe", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ endpoint: sub.endpoint }),
  }).catch(() => {});

  return { ok: true as const };
}

