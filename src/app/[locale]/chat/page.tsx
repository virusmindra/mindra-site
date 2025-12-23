// src/app/[locale]/chat/page.tsx
import ClientPage from './ClientPage';

export default function ChatPage() {
  return (
    <div className="flex-1">
      <ClientPage />
    </div>
  );
}

async function enablePush() {
  const reg = await navigator.serviceWorker.register("/sw.js");

  const permission = await Notification.requestPermission();
  if (permission !== "granted") {
    alert("Push denied");
    return;
  }

  const sub = await reg.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: Uint8Array.from(
      atob(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY),
      c => c.charCodeAt(0)
    ),
  });

  await fetch("/api/push/subscribe", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(sub),
  });

  alert("Push enabled 🚀");
}
