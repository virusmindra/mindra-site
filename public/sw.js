self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {}

  const title = data.title || "Mindra";

  const url = data.url || "/"; // может быть "/en/chat" и т.д.
  const options = {
  body: data.body || "",
  icon: data.icon || "/icons/icon-192.png",
  badge: data.badge || "/icons/badge-72.png",
  data: { url: data.url || "/" },
};


  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const rawUrl = event.notification?.data?.url || "/";
  const targetUrl = new URL(rawUrl, self.location.origin).href;

  event.waitUntil(
    (async () => {
      // если вкладка уже открыта — сфокусируем её
      const allClients = await clients.matchAll({ type: "window", includeUncontrolled: true });
      for (const client of allClients) {
        if (client.url === targetUrl && "focus" in client) {
          return client.focus();
        }
      }
      // иначе откроем новую
      if (clients.openWindow) return clients.openWindow(targetUrl);
    })()
  );
});
