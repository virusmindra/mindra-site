self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {}

  const title = data.title || "Mindra";

  const options = {
    body: data.body || "",
    icon: data.icon || "/icons/icon-192.png",
    badge: data.badge || "/icons/badge-72.png",
    tag: data.tag || undefined,
    renotify: Boolean(data.renotify),
    data: {
      url: data.url || "/",
      ...((data.data && typeof data.data === "object") ? data.data : {}),
    },
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const rawUrl = event.notification?.data?.url || "/";
  const targetUrl = new URL(rawUrl, self.location.origin).href;

  event.waitUntil((async () => {
    const allClients = await clients.matchAll({ type: "window", includeUncontrolled: true });

    // если уже открыта вкладка Mindra — фокус + навигация
    for (const client of allClients) {
      try {
        const clientUrl = new URL(client.url);
        const target = new URL(targetUrl);

        if (clientUrl.origin === target.origin) {
          if ("focus" in client) await client.focus();
          if ("navigate" in client) await client.navigate(targetUrl);
          return;
        }
      } catch {}
    }

    // иначе новая вкладка
    if (clients.openWindow) return clients.openWindow(targetUrl);
  })());
});
