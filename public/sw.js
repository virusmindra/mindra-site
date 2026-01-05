self.addEventListener("push", (event) => {
  let payload = {};
  try {
    payload = event.data ? event.data.json() : {};
  } catch {}

  const title = payload.title || "Mindra";

  // url может быть либо payload.url, либо payload.data.url
  const url =
    payload.url ||
    (payload.data && typeof payload.data === "object" ? payload.data.url : null) ||
    "/";

  const options = {
    body: payload.body || "",
    icon: payload.icon || "/icons/icon-192.png",
    badge: payload.badge || "/icons/badge-72.png",
    tag: payload.tag || undefined,
    renotify: Boolean(payload.renotify),
    data: {
      url,
      // кладём всё что пришло в payload.data, чтобы reminderId не потерять
      ...((payload.data && typeof payload.data === "object") ? payload.data : {}),
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

    if (clients.openWindow) return clients.openWindow(targetUrl);
  })());
});
